package auth

import (
	"context"
	"fmt"
	"letsgo/internal/config"
	"letsgo/internal/model"
	"letsgo/internal/repo"
	"letsgo/internal/token"
	"letsgo/pkg/util"

	"github.com/google/uuid"
)

type service interface {
	createUser(ctx context.Context, username string, password string) (*model.User, error)
	loginUser(ctx context.Context, username, password string) (*model.User, string, string, error)
	logoutUser(ctx context.Context, refreshToken string) error
	refreshUser(ctx context.Context, refreshToken string) (string, string, error)
}

type serviceImpl struct {
	accTokenManager token.UserManager
	repo            repo.UserRepo
	kv              repo.KVStore
	config          *config.Auth
}

func newService(accMngr token.UserManager, repo repo.UserRepo, kv repo.KVStore, config *config.Auth) service {
	return &serviceImpl{
		accTokenManager: accMngr,
		repo:            repo,
		kv:              kv,
		config:          config,
	}
}

func (s *serviceImpl) createUser(ctx context.Context, username string, password string) (*model.User, error) {
	passhash, err := util.PasswordHash(password)
	if err != nil {
		return nil, fmt.Errorf("service: create user failed: %w", err)
	}
	user, err := s.repo.CreateUser(ctx, &model.User{
		Username:    username,
		DisplayName: username,
		PassHash:    passhash,
	})
	if err != nil {
		return nil, fmt.Errorf("service: create user failed : %w", err)
	}
	return user, nil
}

func (s *serviceImpl) loginUser(ctx context.Context, username, password string) (*model.User, string, string, error) {
	user, err := s.repo.ReadUser(ctx, username)
	if err != nil {
		return nil, "", "", fmt.Errorf("service: login user failed: %w", err)
	}
	if !util.PasswordCheck(password, user.PassHash) {
		return nil, "", "", repo.ErrNotFound
	}

	accessToken, err := s.accTokenManager.GenerateToken(token.NewUserPayload(user.Username, user.DisplayName))
	if err != nil {
		return nil, "", "", fmt.Errorf("service: set access token failed: %w", err)
	}
	refreshToken := uuid.New().String()
	if err := s.setRefreshToken(ctx, username, refreshToken); err != nil {
		return nil, "", "", err
	}

	return user, accessToken, refreshToken, nil
}

func (s *serviceImpl) logoutUser(ctx context.Context, refreshToken string) error {
	username, err := s.kv.Get(ctx, refreshToken)
	if err != nil {
		return fmt.Errorf("service: logout without finding refresh token: %w", err)
	}
	return s.unsetRefreshToken(ctx, username, refreshToken)
}

func (s *serviceImpl) refreshUser(ctx context.Context, refreshToken string) (string, string, error) {
	username, err := s.kv.Get(ctx, refreshToken)
	if err != nil {
		return "", "", fmt.Errorf("service: no refresh token found: %w", err)
	}
	user, err := s.repo.ReadUser(ctx, username)
	if err != nil {
		return "", "", fmt.Errorf("service: read user failed: %w", err)
	}

	newRefToken := uuid.New().String()
	if err := s.setRefreshToken(ctx, username, newRefToken); err != nil {
		return "", "", err
	}
	accessToken, err := s.accTokenManager.GenerateToken(token.NewUserPayload(user.Username, user.DisplayName))
	if err != nil {
		return "", "", fmt.Errorf("service: set access token failed: %w", err)
	}

	if err := s.unsetRefreshToken(ctx, username, refreshToken); err != nil {
		return accessToken, newRefToken, err
	}
	return accessToken, newRefToken, nil
}

func (s *serviceImpl) setRefreshToken(ctx context.Context, username, token string) error {
	if err := s.kv.Set(ctx, token, username, s.config.RefTTL); err != nil {
		return fmt.Errorf("service: set refresh token failed: %w", err)
	}
	if err := s.kv.ListAdd(ctx, fmt.Sprintf(s.config.RefStoredFormat,
		username), token, s.config.RefTTL); err != nil {
		return fmt.Errorf("service: add refresh token to list failed: %w", err)
	}
	if err := s.kv.ListTrim(ctx, fmt.Sprintf(s.config.RefStoredFormat,
		username), s.config.RefTTL); err != nil {
		return fmt.Errorf("service: trim refresh token list failed: %w", err)
	}
	return nil
}

func (s *serviceImpl) unsetRefreshToken(ctx context.Context, username, token string) error {
	var errList []error
	if err := s.kv.Del(ctx, token); err != nil {
		errList = append(errList, fmt.Errorf("service: refresh token delete failed: %w", err))
	}
	if err := s.kv.ListDel(ctx, fmt.Sprintf(s.config.RefStoredFormat, username),
		token); err != nil {
		errList = append(errList, fmt.Errorf("service: refresh list delete failed: %w", err))
	}
	if len(errList) > 0 {
		return fmt.Errorf("service: unset refresh token errors: %v", errList)
	}
	return nil
}
