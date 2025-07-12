package token

import "context"

type KVManager interface {
	SetRefToken(ctx context.Context, username, token string) error
	DelRefToken(ctx context.Context, username, token string) error
}
