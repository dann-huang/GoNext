package repo

import (
	"database/sql"

	"github.com/redis/go-redis/v9"
)

type Store struct {
	User    UserRepo
	KVStore KVStore
}

func NewStore(db *sql.DB, rds *redis.Client) *Store {
	return &Store{
		User:    newUserRepo(db),
		KVStore: newKVStore(rds),
	}
}
