package token

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"errors"
	"fmt"
	"gonext/internal/config"
	"gonext/internal/repo"

	"github.com/google/uuid"
)

func Rand6d() (string, error) {
	b := make([]byte, 3)
	if _, err := rand.Read(b); err != nil {
		return "", fmt.Errorf("failed to generate random code: %w", err)
	}
	return hex.EncodeToString(b)[:6], nil
}

type TokenPurpose int

const (
	PurposePasswordReset TokenPurpose = iota
	PurposeEmailLogin
)

func refKey(id string) string {
	return fmt.Sprintf("refToken:%v", id)
}

func setEmailKey(userID, code string) string {
	return fmt.Sprintf("email:verify:%s:%s", userID, code)
}

func tokenKey(purpose TokenPurpose, key string) string {
	switch purpose {
	case PurposePasswordReset:
		return fmt.Sprintf("set_password:%s", key)
	case PurposeEmailLogin:
		return fmt.Sprintf("email_login:%s", key)
	default:
		panic("unknown token purpose")
	}
}

type KVManager interface {
	SetRefToken(ctx context.Context, id string) (string, error)
	UseRefToken(ctx context.Context, token string) (string, error)

	SetEmailSetupToken(ctx context.Context, userID, email string) (string, error)
	UseEmailSetupToken(ctx context.Context, userID, token string) (string, error)

	SetMailToken(ctx context.Context, purpose TokenPurpose, value string) (string, error)
	UseMailToken(ctx context.Context, purpose TokenPurpose, token string) (string, error)
}

type redisMngrImpl struct {
	store repo.KVStore
	cfg   *config.Token
}

func NewRedisKVMngr(store repo.KVStore, cfg *config.Token) KVManager {
	return &redisMngrImpl{
		store: store,
		cfg:   cfg,
	}
}

func (r *redisMngrImpl) SetRefToken(ctx context.Context, id string) (string, error) {
	token := uuid.NewString()
	if err := r.store.Set(ctx, token, id, r.cfg.RefTTL); err != nil {
		return "", fmt.Errorf("failed to set ref token: %w", err)
	}
	if err := r.store.ListAdd(ctx, refKey(id), token, r.cfg.RefTTL); err != nil {
		return "", fmt.Errorf("failed to set ref token map: %w", err)
	}
	return token, nil
}

func (r *redisMngrImpl) UseRefToken(ctx context.Context, token string) (string, error) {
	var errList []error
	id, err := r.store.Get(ctx, token)
	if err != nil {
		return "", fmt.Errorf("no such ref token: %w", err)
	}
	if err := r.store.Del(ctx, token); err != nil {
		errList = append(errList, fmt.Errorf("failed to delete ref token: %w", err))
	}
	if err := r.store.ListDel(ctx, refKey(id), token); err != nil {
		errList = append(errList, fmt.Errorf("failed to delete ref token map: %w", err))
	}
	if len(errList) > 0 {
		return id, errors.Join(errList...)
	}
	return id, nil
}

func (r *redisMngrImpl) SetEmailSetupToken(ctx context.Context, userID, email string) (string, error) {
	token, err := Rand6d()
	if err != nil {
		return "", err
	}
	if err := r.store.Set(ctx, setEmailKey(userID, token), email, r.cfg.EmailedCodeTTL); err != nil {
		return "", err
	}
	return token, nil
}
func (r *redisMngrImpl) UseEmailSetupToken(ctx context.Context, userID, token string) (string, error) {
	key := setEmailKey(userID, token)
	email, err := r.store.Get(ctx, key)
	if err != nil {
		return "", err
	}
	if err := r.store.Del(ctx, key); err != nil {
		return "", err
	}
	return email, nil
}

func (r *redisMngrImpl) SetMailToken(ctx context.Context, purpose TokenPurpose, value string) (string, error) {
	token, err := Rand6d()
	if err != nil {
		return "", err
	}
	storeKey := tokenKey(purpose, token)
	if err := r.store.Set(ctx, storeKey, value, r.cfg.EmailedCodeTTL); err != nil {
		return "", err
	}
	return token, nil
}

func (r *redisMngrImpl) UseMailToken(ctx context.Context, purpose TokenPurpose, token string) (string, error) {
	key := tokenKey(purpose, token)
	value, err := r.store.Get(ctx, key)
	if err != nil {
		return "", err
	}
	if err := r.store.Del(ctx, key); err != nil {
		return value, err
	}
	return value, nil
}
