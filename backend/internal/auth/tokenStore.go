package auth

import (
	"context"
	"fmt"

	"letsgo/internal/config"

	"github.com/google/uuid"
	"github.com/redis/go-redis/v9"
)

type storage interface {
	createToken(ctx context.Context, username string) (string, error)
	validateToken(ctx context.Context, token string) (string, error)
}

func newRdbStore(rdb *redis.Client, cfg *config.Auth) storage {
	return &rdbStoreImpl{
		rdb: rdb,
		cfg: cfg,
	}
}

type rdbStoreImpl struct {
	rdb *redis.Client
	cfg *config.Auth
}

func (m *rdbStoreImpl) createToken(ctx context.Context, username string) (string, error) {
	token := uuid.New().String()
	err := m.rdb.Set(ctx, token, username, m.cfg.RefTTL).Err()
	if err != nil {
		return "", fmt.Errorf("auth: token generation failed: %w", err)
	}
	return token, nil
}

func (m *rdbStoreImpl) validateToken(ctx context.Context, token string) (string, error) {
	username, err := m.rdb.Get(ctx, token).Result()
	if err != nil {
		return "", fmt.Errorf("auth: token validation failed: %w", err)
	}
	return username, nil
}
