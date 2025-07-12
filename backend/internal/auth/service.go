package auth

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"errors"
	"fmt"
	"gonext/internal/config"
	"gonext/internal/mail"
	"gonext/internal/model"
	"gonext/internal/repo"
	"gonext/internal/token"
	"log/slog"

	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

var (
	ErrInvalidCode = errors.New("invalid or expired verification code")
	ErrAlreadySet  = errors.New("email is already set")
)

type service interface {
	createGuest(ctx context.Context, username, displayName string) (*authResult, error)
	setupEmail(ctx context.Context, userID int, email string) error
	verifyEmail(ctx context.Context, userID int, code string) (*authResult, error)
	setPassword(ctx context.Context, userID int, currentPassword, newPassword string) error
	logoutUser(ctx context.Context, refreshToken string) error
	refreshUser(ctx context.Context, refreshToken string) (*authResult, error)

	sendEmailCode(ctx context.Context, email string) error
	loginWithEmailCode(ctx context.Context, email, code string) (*authResult, error)
	loginWithPassword(ctx context.Context, email, password string) (*authResult, error)
}

type serviceImpl struct {
	accessMngr token.UserManager
	repo       repo.UserRepo
	kvStore    repo.KVStore
	mailer     mail.Mailer
	cfg        *config.Auth
}

func (s *serviceImpl) hashPass(password string) (string, error) {
	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return "", fmt.Errorf("failed to hash password: %w", err)
	}
	return string(hash), nil
}

func (s *serviceImpl) verifyPass(hashedPassword, password string) bool {
	if hashedPassword == "" {
		return false
	}
	err := bcrypt.CompareHashAndPassword([]byte(hashedPassword), []byte(password))
	return err == nil
}

func (s *serviceImpl) rand6d() (string, error) {
	b := make([]byte, 3)
	if _, err := rand.Read(b); err != nil {
		return "", fmt.Errorf("failed to generate random code: %w", err)
	}
	return hex.EncodeToString(b)[:6], nil
}

func newService(accessManager token.UserManager, repo repo.UserRepo, kv repo.KVStore, mailer mail.Mailer, config *config.Auth) service {
	return &serviceImpl{
		accessMngr: accessManager,
		repo:       repo,
		kvStore:    kv,
		mailer:     mailer,
		cfg:        config,
	}
}

func (s *serviceImpl) loginUser(ctx context.Context, user *model.User) (*authResult, error) {
	accessToken, err := s.accessMngr.GenerateToken(
		token.NewUserPayload(user.ID, user.Username, user.DisplayName, user.AccountType))
	if err != nil {
		return nil, fmt.Errorf("failed to generate access token: %w", err)
	}
	refreshToken := uuid.New().String()
	if err := s.setRefreshToken(ctx, user.Username, refreshToken); err != nil {
		return nil, fmt.Errorf("failed to store refresh token: %w", err)
	}

	if err := s.repo.UpdateLastLogin(ctx, user.ID); err != nil {
		slog.Error("failed to update last login", "error", err)
	}

	return &authResult{
		access:  accessToken,
		refresh: refreshToken,
		user:    user,
	}, nil
}

func (s *serviceImpl) createGuest(ctx context.Context, username, displayName string) (*authResult, error) {
	user, err := s.repo.CreateUser(ctx, &model.User{
		Username:    username,
		DisplayName: displayName,
		AccountType: model.AccountTypeGuest,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to create guest user: %w", err)
	}
	return s.loginUser(ctx, user)
}

func (s *serviceImpl) setPassword(ctx context.Context, userID int, currentPassword, newPassword string) error {
	user, err := s.repo.ReadUserByID(ctx, userID)
	if err != nil {
		return fmt.Errorf("user not found: %w", err)
	}

	if user.PassHash != nil {
		if currentPassword == "" {
			return fmt.Errorf("current password is required")
		}
		if !s.verifyPass(*user.PassHash, currentPassword) {
			return fmt.Errorf("invalid current password")
		}
	}
	hash, err := s.hashPass(newPassword)
	if err != nil {
		return fmt.Errorf("failed to hash password: %w", err)
	}

	_, err = s.repo.UpdateUser(ctx, user.Username, &model.UserUpdate{
		PassHash: &hash,
	})
	if err != nil {
		return fmt.Errorf("failed to update password: %w", err)
	}

	return nil
}

func (s *serviceImpl) setupEmail(ctx context.Context, userID int, email string) error {
	code, err := s.rand6d()
	if err != nil {
		return fmt.Errorf("failed to generate verification code: %w", err)
	}
	if err := s.kvStore.Set(ctx, fmt.Sprintf(s.cfg.EmailSetupKey, userID, code), email, s.cfg.EmailCodeTTL); err != nil {
		return fmt.Errorf("failed to store verification code: %w", err)
	}
	if err := s.mailer.VerificationEmail(email, code); err != nil {
		return fmt.Errorf("failed to send verification email: %w", err)
	}
	return nil
}

func (s *serviceImpl) verifyEmail(ctx context.Context, userID int, code string) (*authResult, error) {
	user, err := s.repo.ReadUserByID(ctx, userID)
	if err != nil {
		return nil, fmt.Errorf("user not found: %w", err)
	}
	if user.AccountType != model.AccountTypeGuest {
		return nil, ErrAlreadySet
	}

	email, err := s.kvStore.Get(ctx, fmt.Sprintf(s.cfg.EmailSetupKey, userID, code))
	if err != nil {
		if errors.Is(err, repo.ErrNotFound) {
			return nil, ErrInvalidCode
		}
		return nil, fmt.Errorf("failed to verify code: %w", err)
	}
	accountType := model.AccountTypeUser
	user, err = s.repo.UpdateUser(ctx, user.Username, &model.UserUpdate{
		Email:       &email,
		AccountType: &accountType,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to upgrade user: %w", err)
	}
	if err := s.kvStore.Del(ctx, fmt.Sprintf(s.cfg.EmailSetupKey, userID, code)); err != nil {
		slog.Error("failed to delete email code", "error", err)
	}
	return s.loginUser(ctx, user)
}

func (s *serviceImpl) logoutUser(ctx context.Context, refreshToken string) error {
	username, err := s.kvStore.Get(ctx, refreshToken)
	if err != nil {
		return fmt.Errorf("failed to find ref tokens: %w", err)
	}
	return s.unsetRefreshToken(ctx, username, refreshToken)
}

func (s *serviceImpl) refreshUser(ctx context.Context, refreshToken string) (*authResult, error) {
	username, err := s.kvStore.Get(ctx, refreshToken)
	if err != nil {
		return nil, fmt.Errorf("invalid refresh token: %w", err)
	}
	user, err := s.repo.ReadUserByName(ctx, username)
	if err != nil {
		return nil, fmt.Errorf("user not found: %w", err)
	}
	return s.loginUser(ctx, user)
}

func (s *serviceImpl) setRefreshToken(ctx context.Context, username, token string) error {
	if err := s.kvStore.Set(ctx, token, username, s.cfg.RefTTL); err != nil {
		return fmt.Errorf("failed to set ref token: %w", err)
	}
	if err := s.kvStore.ListAdd(
		ctx,
		fmt.Sprintf(s.cfg.RefreshKey, username),
		token,
		s.cfg.RefTTL,
	); err != nil {
		return fmt.Errorf("failed to set ref token map: %w", err)
	}
	return nil
}

func (s *serviceImpl) unsetRefreshToken(ctx context.Context, username, token string) error {
	var errList []error
	if err := s.kvStore.Del(ctx, token); err != nil {
		errList = append(errList, fmt.Errorf("failed to delete ref token: %w", err))
	}
	if err := s.kvStore.ListDel(
		ctx,
		fmt.Sprintf(s.cfg.RefreshKey, username),
		token,
	); err != nil {
		errList = append(errList, fmt.Errorf("failed to delete ref token map: %w", err))
	}
	if len(errList) > 0 {
		return errors.Join(errList...)
	}
	return nil
}

func (s *serviceImpl) sendEmailCode(ctx context.Context, email string) error {
	user, err := s.repo.ReadUserByEmail(ctx, email)
	if err != nil {
		return err
	}
	code, err := s.rand6d()
	if err != nil {
		return fmt.Errorf("failed to generate code: %w", err)
	}
	err = s.kvStore.Set(ctx, fmt.Sprintf(s.cfg.EmailLoginKey, user.ID), code, s.cfg.EmailCodeTTL)
	if err != nil {
		return fmt.Errorf("failed to store code: %w", err)
	}
	err = s.mailer.SendLoginCode(email, email, code)
	if err != nil {
		return fmt.Errorf("failed to send code: %w", err)
	}
	return nil
}

func (s *serviceImpl) loginWithEmailCode(ctx context.Context, email, code string) (*authResult, error) {
	storedCode, err := s.kvStore.Get(ctx, fmt.Sprintf(s.cfg.EmailLoginKey, email))
	if err != nil || storedCode == "" {
		return nil, ErrInvalidCode
	}
	if storedCode != code {
		return nil, ErrInvalidCode
	}
	user, err := s.repo.ReadUserByEmail(ctx, email)
	if err != nil {
		return nil, err
	}

	// todo: considering not proceeding due to potential security concerns
	if err := s.kvStore.Del(ctx, fmt.Sprintf(s.cfg.EmailLoginKey, user.ID)); err != nil {
		slog.Error("failed to delete used login code", "error", err, "email", email)
	}
	return s.loginUser(ctx, user)
}

func (s *serviceImpl) loginWithPassword(ctx context.Context, email, password string) (*authResult, error) {
	user, err := s.repo.ReadUserByEmail(ctx, email)
	if err != nil {
		return nil, err
	}

	if user.PassHash == nil {
		return nil, fmt.Errorf("no password")
	}
	if !s.verifyPass(*user.PassHash, password) {
		return nil, fmt.Errorf("bad password")
	}
	return s.loginUser(ctx, user)
}
