package auth

import (
	"context"
	"errors"
	"fmt"
	"gonext/internal/config"
	"gonext/internal/mail"
	"gonext/internal/model"
	"gonext/internal/repo"
	"gonext/internal/token"
	"log/slog"

	"golang.org/x/crypto/bcrypt"
)

var (
	ErrInvalidCode = errors.New("invalid or expired verification code")
	ErrAlreadySet  = errors.New("email is already set")
)

type service interface {
	createGuest(ctx context.Context, username, displayName string) (*authResult, error)
	logoutUser(ctx context.Context, refreshToken string) error
	refreshUser(ctx context.Context, refreshToken string) (*authResult, error)

	setupEmail(ctx context.Context, userToken *token.UserPayload, email string) error
	verifyEmail(ctx context.Context, userToken *token.UserPayload, code string) (*authResult, error)
	reqPassCode(ctx context.Context, userToken *token.UserPayload) error
	setPassword(ctx context.Context, userToken *token.UserPayload, code string, password string) (*authResult, error)

	sendEmailCode(ctx context.Context, email string) error
	loginWithEmailCode(ctx context.Context, email, code string) (*authResult, error)
	loginWithPassword(ctx context.Context, email, password string) (*authResult, error)
}

type serviceImpl struct {
	accessMngr token.UserManager
	repo       repo.UserRepo
	kvMngr     token.KVManager
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

func (s *serviceImpl) loginUser(ctx context.Context, user *model.User) (*authResult, error) {
	userToken := &token.UserPayload{
		UserID:      user.ID,
		Username:    user.Username,
		Displayname: user.DisplayName,
		AccountType: user.AccountType,
		Email:       user.Email,
	}
	accessToken, err := s.accessMngr.GenerateToken(userToken)
	if err != nil {
		return nil, fmt.Errorf("failed to generate access token: %w", err)
	}
	refreshToken, err := s.kvMngr.SetRefToken(ctx, user.Username)
	if err != nil {
		return nil, fmt.Errorf("failed to create refresh token: %w", err)
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

func newService(accessManager token.UserManager, repo repo.UserRepo, kvMngr token.KVManager, mailer mail.Mailer, config *config.Auth) service {
	return &serviceImpl{
		accessMngr: accessManager,
		repo:       repo,
		kvMngr:     kvMngr,
		mailer:     mailer,
		cfg:        config,
	}
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

func (s *serviceImpl) setupEmail(ctx context.Context, userToken *token.UserPayload, email string) error {
	token, err := s.kvMngr.SetEmailSetupToken(ctx, userToken.UserID, email)
	if err != nil {
		return fmt.Errorf("failed to store verification code: %w", err)
	}
	if err := s.mailer.VerificationEmail(email, userToken.Displayname, token); err != nil {
		return fmt.Errorf("failed to send verification email: %w", err)
	}
	return nil
}

func (s *serviceImpl) verifyEmail(ctx context.Context, userToken *token.UserPayload, code string) (*authResult, error) {
	email, err := s.kvMngr.UseEmailSetupToken(ctx, userToken.UserID, code)
	if err != nil {
		if errors.Is(err, repo.ErrNotFound) {
			return nil, ErrInvalidCode
		}
		return nil, fmt.Errorf("failed to verify code: %w", err)
	}
	update := model.UserUpdate{
		Email: &email,
	}
	if userToken.AccountType == model.AccountTypeGuest {
		newType := model.AccountTypeUser
		update.AccountType = &newType
	}
	user, err := s.repo.UpdateUser(ctx, userToken.UserID, &update)
	if err != nil {
		return nil, fmt.Errorf("failed to upgrade user: %w", err)
	}
	return s.loginUser(ctx, user)
}

func (s *serviceImpl) reqPassCode(ctx context.Context, userToken *token.UserPayload) error {
	if userToken.Email == nil {
		return errors.New("email not set")
	}
	tokenStr, err := s.kvMngr.SetMailToken(ctx, token.PurposePasswordReset, userToken.UserID)
	if err != nil {
		return fmt.Errorf("failed to store verification code: %w", err)
	}
	if err := s.mailer.SendPasswordCode(*userToken.Email, userToken.Displayname, tokenStr); err != nil {
		return fmt.Errorf("failed to send verification email: %w", err)
	}
	return nil
}

func (s *serviceImpl) setPassword(ctx context.Context, userToken *token.UserPayload, code string, password string) (*authResult, error) {
	if userToken.Email == nil {
		return nil, errors.New("email not set")
	}
	_, err := s.kvMngr.UseMailToken(ctx, token.PurposePasswordReset, code)
	if err != nil {
		return nil, ErrInvalidCode
	}
	hashedPassword, err := s.hashPass(password)
	if err != nil {
		return nil, fmt.Errorf("failed to hash password: %w", err)
	}
	user, err := s.repo.UpdateUser(ctx, userToken.UserID, &model.UserUpdate{
		PassHash: &hashedPassword,
	})
	if err != nil {
		return nil, fmt.Errorf("user not found: %w", err)
	}
	return s.loginUser(ctx, user)
}

func (s *serviceImpl) logoutUser(ctx context.Context, refreshToken string) error {
	_, err := s.kvMngr.UseRefToken(ctx, refreshToken)
	return err
}

func (s *serviceImpl) refreshUser(ctx context.Context, refreshToken string) (*authResult, error) {
	username, err := s.kvMngr.UseRefToken(ctx, refreshToken)
	if err != nil {
		return nil, fmt.Errorf("invalid refresh token: %w", err)
	}
	user, err := s.repo.ReadUserByName(ctx, username)
	if err != nil {
		return nil, fmt.Errorf("user not found: %w", err)
	}
	return s.loginUser(ctx, user)
}

func (s *serviceImpl) sendEmailCode(ctx context.Context, email string) error {
	user, err := s.repo.ReadUserByEmail(ctx, email)
	if err != nil {
		return err
	}
	if user != nil {
		return ErrAlreadySet
	}
	token, err := s.kvMngr.SetMailToken(ctx, token.PurposeEmailLogin, email)
	if err != nil {
		return fmt.Errorf("failed to store code: %w", err)
	}
	err = s.mailer.SendLoginCode(email, email, token)
	if err != nil {
		return fmt.Errorf("failed to send code: %w", err)
	}
	return nil
}

func (s *serviceImpl) loginWithEmailCode(ctx context.Context, email, code string) (*authResult, error) {
	_, err := s.kvMngr.UseMailToken(ctx, token.PurposeEmailLogin, code)
	if err != nil {
		return nil, ErrInvalidCode
	}
	user, err := s.repo.ReadUserByEmail(ctx, email)
	if err != nil {
		return nil, err
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
