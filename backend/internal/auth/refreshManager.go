package auth

import (
	"context"
	"fmt"

	"letsgo/internal/config"

	"github.com/google/uuid"
	"github.com/redis/go-redis/v9"
)

type RefreshManager interface {
	GenerateToken(ctx context.Context, username string) (string, error)
	ValidateToken(ctx context.Context, token string) (string, error)
}

func NewRefManager(rdb *redis.Client, cfg *config.Auth) RefreshManager {
	return &sessionRefreshManager{
		rdb: rdb,
		cfg: cfg,
	}
}

type sessionRefreshManager struct {
	rdb *redis.Client
	cfg *config.Auth
}

func (m *sessionRefreshManager) GenerateToken(ctx context.Context, username string) (string, error) {
	token := uuid.New().String()
	err := m.rdb.Set(ctx, token, username, m.cfg.RefTTL).Err()
	if err != nil {
		return "", fmt.Errorf("refresh token failed to generate: %w", err)
	}
	return token, nil
}

func (m *sessionRefreshManager) ValidateToken(ctx context.Context, token string) (string, error) {

	return "", nil
}
