package repo

import (
	"context"
	"time"

	"github.com/redis/go-redis/v9"
)

type KVStore interface {
	SetStr(ctx context.Context, key, value string, ttl time.Duration) error
	GetStr(ctx context.Context, key string) (string, error)
}

func newKVStore(rdb *redis.Client) KVStore {
	return &rdsStore{rdb: rdb}
}

type rdsStore struct {
	rdb *redis.Client
}

func (r *rdsStore) GetStr(ctx context.Context, key string) (string, error) {
	return r.rdb.Get(ctx, key).Result()
}
func (r *rdsStore) SetStr(ctx context.Context, key, val string, ttl time.Duration) error {
	return r.rdb.Set(ctx, key, val, ttl).Err()
}
