package auth

import (
	"context"
	"fmt"
	"letsgo/internal/model"
	"letsgo/internal/repo"
	"letsgo/pkg/util"
)

type service interface {
	createUser(ctx context.Context, username string, password string) (*model.User, error)
}

type serviceImpl struct {
	repo repo.UserRepo
	kv   repo.KVStore
}

func newService(repo repo.UserRepo, kv repo.KVStore) service {
	return &serviceImpl{
		repo: repo,
		kv:   kv,
	}
}

func (s *serviceImpl) createUser(ctx context.Context, username string, password string) (*model.User, error) {
	passhash, err := util.PasswordHash(password)
	if err != nil {
		return nil, fmt.Errorf("service: create user failed for username=%s: %w", username, err)
	}
	user, err := s.repo.CreateUser(ctx, &model.User{
		Username:    username,
		DisplayName: username,
		PassHash:    passhash,
	})
	if err != nil {
		return nil, fmt.Errorf("service: create user failed for username=%s: %w", username, err)
	}
	return user, nil
}

func (s *serviceImpl) LoginUser(ctx context.Context, username, password string) (*model.User, error) {
	user, err := s.repo.ReadUser(ctx, username)
	if err != nil {
		return nil, fmt.Errorf("service: failed to login user for username=%s: %w", username, err)
	}
	return user, nil
}
