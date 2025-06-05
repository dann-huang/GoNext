package model

import (
	"time"
)

type User struct {
	ID          int       `db:"id"`
	Username    string    `db:"username"`
	DisplayName string    `db:"displayname"`
	PassHash    string    `db:"passhash"`
	CreatedAt   time.Time `db:"created_at"`
	UpdatedAt   time.Time `db:"updated_at"`
}

type UserCreate struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

type UserUpdate struct {
	DisplayName *string `json:"displayName"`
	Password    *string `json:"password"`
}
