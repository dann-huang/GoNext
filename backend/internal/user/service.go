package user

import (
	"context"
	"fmt"
	"letsgo/internal/model"
	"letsgo/internal/repo"
	"letsgo/pkg/util"
)

type Service interface {
	CreateUser(ctx context.Context, username string, password string) (*model.User, error)
	ReadUser(ctx context.Context, username string) (*model.User, error)
	UpdateUser(ctx context.Context, username string, params *model.UserUpdate) (*model.User, error)
	DeleteUser(ctx context.Context, username string) error
}

type serviceImpl struct {
	repo repo.UserRepo
}

func NewService(repo repo.UserRepo) Service {
	return &serviceImpl{
		repo: repo,
	}
}

func (s *serviceImpl) CreateUser(ctx context.Context, username string, password string) (*model.User, error) {
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

func (s *serviceImpl) DeleteUser(ctx context.Context, username string) error {
	err := s.repo.DeleteUser(ctx, username)
	if err != nil {
		return fmt.Errorf("service: failed to delete user for username=%s: %w", username, err)
	}
	return nil
}

func (s *serviceImpl) ReadUser(ctx context.Context, username string) (*model.User, error) {
	user, err := s.repo.ReadUser(ctx, username)
	if err != nil {
		return nil, fmt.Errorf("service: failed to get user for username=%s: %w", username, err)
	}
	return user, nil
}

func (s *serviceImpl) UpdateUser(ctx context.Context, username string, params *model.UserUpdate) (*model.User, error) {
	user, err := s.repo.UpdateUser(ctx, username, params)
	if err != nil {
		return nil, fmt.Errorf("service: failed to update user for username=%s: %w", username, err)
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
