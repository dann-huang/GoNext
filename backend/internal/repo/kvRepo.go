package repo

import (
	"context"
	"fmt"
	"time"

	"github.com/redis/go-redis/v9"
)

type KVStore interface {
	Set(ctx context.Context, key, value string, ttl time.Duration) error
	Del(ctx context.Context, key string) error
	Get(ctx context.Context, key string) (string, error)

	ListAdd(ctx context.Context, key, val string, ttl time.Duration) error
	ListDel(ctx context.Context, key, val string) error
	ListCheck(ctx context.Context, key, val string) (bool, error)
	ListGet(ctx context.Context, key string) ([]string, error)
	ListTrim(ctx context.Context, key string, age time.Duration) error
}

func newKVStore(rdb *redis.Client) KVStore {
	return &rdsStore{rdb: rdb}
}

type rdsStore struct {
	rdb *redis.Client
}

func (r *rdsStore) Get(ctx context.Context, key string) (string, error) {
	return r.rdb.Get(ctx, key).Result()
}
func (r *rdsStore) Set(ctx context.Context, key, val string, ttl time.Duration) error {
	return r.rdb.Set(ctx, key, val, ttl).Err()
}
func (r *rdsStore) Del(ctx context.Context, key string) error {
	return r.rdb.Del(ctx, key).Err()
}

func (r *rdsStore) ListAdd(ctx context.Context, key, val string, ttl time.Duration) error {
	if err := r.rdb.ZAdd(ctx, key, redis.Z{
		Score:  float64(time.Now().Unix()),
		Member: val,
	}).Err(); err != nil {
		return err
	}
	return r.rdb.Expire(ctx, key, ttl).Err()
}
func (r *rdsStore) ListDel(ctx context.Context, key, val string) error {
	return r.rdb.ZRem(ctx, key, val).Err()
}
func (r *rdsStore) ListCheck(ctx context.Context, key, val string) (bool, error) {
	_, err := r.rdb.ZScore(ctx, key, val).Result()
	if err == redis.Nil {
		return false, nil
	} else if err == nil {
		return true, nil
	}
	return false, err
}
func (r *rdsStore) ListGet(ctx context.Context, key string) ([]string, error) {
	return r.rdb.ZRange(ctx, key, 0, -1).Result()
}
func (r *rdsStore) ListTrim(ctx context.Context, key string, age time.Duration) error {
	cutoff := time.Now().Add(-age).Unix()
	return r.rdb.ZRemRangeByScore(ctx, key, "-inf", fmt.Sprintf("%d", cutoff)).Err()
}
