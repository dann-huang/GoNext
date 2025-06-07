package config

import (
	"fmt"
	"os"
	"time"
)

type Auth struct {
	AccCookieName   string
	AccSecret       string
	AccTTL          time.Duration
	RefCookieName   string
	RefStoredFormat string
	RefTTL          time.Duration
	Issuer          string
	Audience        string
	Domain          string
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
	Port        string
	FrontendUrl string
	StaticPages string
	Auth        *Auth
	DB          *DB
}

func Load() (*AppConfig, error) {
	cfg := &AppConfig{
		Port:        os.Getenv("GO_PORT"),
		FrontendUrl: os.Getenv("FRONTEND"),
		StaticPages: "/app/static",
	}

	cfg.Auth = &Auth{
		AccCookieName:   "access_token",
		AccSecret:       os.Getenv("JWT_ACCESS_SECRET"),
		AccTTL:          10 * time.Minute,
		RefCookieName:   "refresh_token",
		RefStoredFormat: "refToken:%v",
		RefTTL:          24 * time.Hour,
		Issuer:          "letsgo",
		Audience:        "AuthService",
		Domain:          os.Getenv("DOMAIN"),
	}
	cfg.DB = &DB{
		PostgresUrl:  os.Getenv("POSTGRES_URL"),
		PostgresUser: os.Getenv("POSTGRES_USER"),
		PostgresPass: os.Getenv("POSTGRES_PASSWORD"),
		PostgresDB:   os.Getenv("POSTGRES_DB"),
		RedisURL:     os.Getenv("REDIS_URL"),
	}

	return cfg, nil
}
