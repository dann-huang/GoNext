package auth

import (
	"context"
	"fmt"
	"letsgo/internal/claims"
	"letsgo/pkg/jwt"
)

type AccessManager interface {
	GenerateToken(ctx context.Context, username string) (string, error)
	ValidateToken(ctx context.Context, token string) (string, error)
}

func NewAccessManager(jwt jwt.Manager[*claims.UserClaims]) AccessManager {
	return &jwtAccessManager{
		jwtManager: jwt,
	}
}

type jwtAccessManager struct {
	jwtManager jwt.Manager[*claims.UserClaims]
}

func (m *jwtAccessManager) GenerateToken(ctx context.Context, username string) (string, error) {
	claim := claims.UserClaims{Username: username}
	token, err := m.jwtManager.GenerateToken(&claim)
	if err != nil {
		return "", fmt.Errorf("access token failed to generate: %w", err)
	}
	return token, nil
}

func (m *jwtAccessManager) ValidateToken(ctx context.Context, token string) (string, error) {
	claim, err := m.jwtManager.ValidateToken(token)
	if err != nil {
		return "", fmt.Errorf("access token failed to validate: %w", err)
	}
	return claim.Username, nil
}
