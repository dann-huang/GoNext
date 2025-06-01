package config

import (
	"fmt"
	"os"
	"time"
)

type Auth struct {
	AccessTokenSecret  string
	RefreshTokenSecret string
	AccessTokenExpiry  time.Duration
	RefreshTokenExpiry time.Duration
	Issuer             string
	Audience           string
}
type DB struct {
	PostgresUrl  string
	PostgresUser string
	PostgresPass string
	PostgresDB   string
	RedisURL     string
}

func (c *DB) ConnectionStrings() (string, string) {

	pString := fmt.Sprintf("postgresql://%s:%s@%s/%s?sslmode=disable",
		c.PostgresUser, c.PostgresPass, c.PostgresUrl, c.PostgresDB)
	rString := fmt.Sprintf("redis://%s", c.RedisURL)
	return pString, rString
}

type AppConfig struct {
	Auth       Auth
	DB         DB
	ServerPort string
}

func Load() (*AppConfig, error) {
	cfg := &AppConfig{}

	//auth
	cfg.Auth.AccessTokenSecret = os.Getenv("JWT_ACCESS_SECRET")
	cfg.Auth.RefreshTokenSecret = os.Getenv("JWT_REFRESH_SECRET")
	cfg.Auth.AccessTokenExpiry = 10 * time.Minute
	cfg.Auth.RefreshTokenExpiry = 24 * time.Hour
	cfg.Auth.Issuer = "letsgo"
	cfg.Auth.Audience = "letsgo"

	//db
	cfg.DB.PostgresUrl = os.Getenv("POSTGRES_URL")
	cfg.DB.PostgresUser = os.Getenv("POSTGRES_USER")
	cfg.DB.PostgresPass = os.Getenv("POSTGRES_PASS")
	cfg.DB.PostgresDB = os.Getenv("POSTGRES_DB")
	cfg.DB.RedisURL = os.Getenv("REDIS_URL")

	cfg.ServerPort = "3000"

	return cfg, nil
}
