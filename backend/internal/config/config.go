package config

import (
	"fmt"
	"os"
	"time"
)

type Auth struct {
	AccessCookieName  string
	AccessTokenSecret string
	AccessTokenTTL    time.Duration
	RefreshCookieName string
	RefreshTokenTTL   time.Duration
	Issuer            string
	Audience          string
	Domain            string
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
	cfg.Auth.AccessCookieName = "access_token"
	cfg.Auth.AccessTokenSecret = os.Getenv("JWT_ACCESS_SECRET")
	cfg.Auth.AccessTokenTTL = 10 * time.Minute
	cfg.Auth.RefreshCookieName = "refresh_token"
	cfg.Auth.RefreshTokenTTL = 24 * time.Hour
	cfg.Auth.Issuer = "letsgo"
	cfg.Auth.Audience = "AuthService"
	cfg.Auth.Domain = os.Getenv("DOMAIN")

	//db
	cfg.DB.PostgresUrl = os.Getenv("POSTGRES_URL")
	cfg.DB.PostgresUser = os.Getenv("POSTGRES_USER")
	cfg.DB.PostgresPass = os.Getenv("POSTGRES_PASSWORD")
	cfg.DB.PostgresDB = os.Getenv("POSTGRES_DB")
	cfg.DB.RedisURL = os.Getenv("REDIS_URL")

	cfg.ServerPort = os.Getenv("GO_PORT")

	return cfg, nil
}
