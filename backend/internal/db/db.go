package db

import (
	"context"
	"database/sql"
	"fmt"

	"gonext/internal/config"

	_ "github.com/lib/pq"
	"github.com/redis/go-redis/v9"
)

func Open(c *config.DB) (*sql.DB, *redis.Client, error) {
	pString, rString := c.ConnectionStrings()

	pg, err := sql.Open("postgres", pString)
	if err != nil {
		return nil, nil, fmt.Errorf("failed to open postgres: %w", err)
	}
	if err := pg.Ping(); err != nil {
		pg.Close()
		return nil, nil, fmt.Errorf("failed to connect to postgres: %w", err)
	}
	println("postgres success")

	opt, err := redis.ParseURL(rString)
	if err != nil {
		pg.Close()
		return nil, nil, fmt.Errorf("invalid redis config: %w", err)
	}
	rc := redis.NewClient(opt)
	if err := rc.Ping(context.Background()).Err(); err != nil {
		pg.Close()
		return nil, nil, fmt.Errorf("failed to connect to redis: %w", err)
	}
	println("redis success")

	return pg, rc, nil
}
