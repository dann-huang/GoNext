package auth

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"errors"
	"fmt"
	"letsgo/internal/config"
	"letsgo/internal/mail"
	"letsgo/internal/model"
	"letsgo/internal/repo"
	"letsgo/internal/token"
	"log/slog"

	"github.com/google/uuid"
)

type service interface {
	createGuest(ctx context.Context, username, displayName string) (*authResult, error)
	setupEmail(ctx context.Context, userID int, email string) error
	verifyEmail(ctx context.Context, userID int, code string) (*authResult, error)
	logoutUser(ctx context.Context, refreshToken string) error
	refreshUser(ctx context.Context, refreshToken string) (*authResult, error)
}

type serviceImpl struct {
	accessMngr token.UserManager
	repo       repo.UserRepo
	kvStore    repo.KVStore
	mailer     mail.Mailer
	cfg        *config.Auth
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

func rand6d() (string, error) {
	b := make([]byte, 3)
	if _, err := rand.Read(b); err != nil {
		return "", fmt.Errorf("failed to generate random code: %w", err)
	}
	return hex.EncodeToString(b)[:6], nil
}

func (s *serviceImpl) loginUser(ctx context.Context, user *model.User) (*authResult, error) {
	accessToken, err := s.accessMngr.GenerateToken(token.NewUserPayload(
		user.Username,
		user.DisplayName,
		user.AccountType,
	))
	if err != nil {
		return nil, fmt.Errorf("failed to generate access token: %w", err)
	}

	refreshToken := uuid.New().String()
	if err := s.setRefreshToken(ctx, user.Username, refreshToken); err != nil {
		return nil, fmt.Errorf("failed to set refresh token: %w", err)
	}

	return &authResult{
		access:  accessToken,
		refresh: refreshToken,
		user:    user,
	}, nil
}

func (s *serviceImpl) createGuest(ctx context.Context, username, displayName string) (*authResult, error) {
	user := &model.User{
		Username:    username,
		DisplayName: displayName,
		AccountType: model.AccountTypeGuest,
	}

	user, err := s.repo.CreateUser(ctx, user)
	if err != nil {
		return nil, fmt.Errorf("failed to create guest user: %w", err)
	}

	return s.loginUser(ctx, user)
}

func (s *serviceImpl) setupEmail(ctx context.Context, userID int, email string) error {
	code, err := rand6d()
	if err != nil {
		return fmt.Errorf("failed to generate verification code: %w", err)
	}

	key := fmt.Sprintf(s.cfg.CodeStoreFormat, userID)
	if err := s.kvStore.Set(ctx, key, code, s.cfg.EmailCodeTTL); err != nil {
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

	if user.AccountType == model.AccountTypeUser || user.AccountType == model.AccountTypeAdmin {
		return nil, fmt.Errorf("email is already set")
	}
	storedCode, err := s.kvStore.Get(ctx, fmt.Sprintf(s.cfg.CodeStoreFormat, userID))
	if err != nil {
		if errors.Is(err, repo.ErrNotFound) {
			return nil, fmt.Errorf("verification code expired or invalid")
		}
		return nil, fmt.Errorf("failed to verify code: %w", err)
	}

	if storedCode != code {
		return nil, fmt.Errorf("invalid verification code")
	}

	accountType := model.AccountTypeUser
	user, err = s.repo.UpdateUser(ctx, user.Username, &model.UserUpdate{
		AccountType: &accountType,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to upgrade user: %w", err)
	}
	if err := s.kvStore.Del(ctx, fmt.Sprintf(s.cfg.CodeStoreFormat, userID)); err != nil {
		slog.Error("failed to delete email code from redis", "error", err)
	}
	return s.loginUser(ctx, user)
}

func (s *serviceImpl) logoutUser(ctx context.Context, refreshToken string) error {
	username, err := s.kvStore.Get(ctx, refreshToken)
	if err != nil {
		return fmt.Errorf("service: logout without finding refresh token: %w", err)
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
		return fmt.Errorf("failed to set refresh token: %w", err)
	}

	userTokenKey := fmt.Sprintf("user:refresh_token:%s", username)
	if err := s.kvStore.Set(ctx, userTokenKey, token, s.cfg.RefTTL); err != nil {
		return fmt.Errorf("failed to set user refresh token mapping: %w", err)
	}
	return nil
}

func (s *serviceImpl) unsetRefreshToken(ctx context.Context, username, token string) error {
	var errList []error
	if err := s.kvStore.Del(ctx, token); err != nil {
		errList = append(errList, fmt.Errorf("service: refresh token delete failed: %w", err))
	}

	if err := s.kvStore.ListDel(ctx, fmt.Sprintf(s.cfg.RefStoredFormat, username),
		token); err != nil {
		errList = append(errList, fmt.Errorf("service: refresh list delete failed: %w", err))
	}
	if len(errList) > 0 {
		return fmt.Errorf("service: unset refresh token errors: %v", errList)
	}
	return nil
}
