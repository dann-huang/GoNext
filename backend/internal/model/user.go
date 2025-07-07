package model

import (
	"database/sql/driver"
	"errors"
	"time"
)

type AccountType string

const (
	AccountTypeGuest AccountType = "guest"
	AccountTypeUser  AccountType = "user"
	AccountTypeAdmin AccountType = "admin"
)

// Scan implements the sql.Scanner interface
func (a *AccountType) Scan(value interface{}) error {
	if value == nil {
		*a = AccountTypeGuest
		return nil
	}
	if s, ok := value.(string); ok {
		*a = AccountType(s)
		return nil
	}
	return errors.New("failed to scan AccountType")
}

// Value implements the driver.Valuer interface
func (a AccountType) Value() (driver.Value, error) {
	return string(a), nil
}

type User struct {
	ID          int         `db:"id"`
	Username    string      `db:"username"`
	DisplayName string      `db:"displayname"`
	AccountType AccountType `db:"account_type"`
	Email       *string     `db:"email"`
	PassHash    *string     `db:"passhash"`
	CreatedAt   time.Time   `db:"created_at"`
	UpdatedAt   time.Time   `db:"updated_at"`
	LastLoginAt time.Time   `db:"last_login_at"`
}

type UserCreate struct {
	Username    string `json:"username" validate:"required,alphanum,min=3,max=20"`
	DisplayName string `json:"displayName" validate:"required,min=2,max=50"`
}

type UserUpdate struct {
	Username    *string      `json:"username,omitempty" validate:"omitempty,alphanum,min=3,max=20"`
	DisplayName *string      `json:"displayName,omitempty" validate:"omitempty,min=2,max=50"`
	AccountType *AccountType `json:"accountType,omitempty"`
	Email       *string      `json:"email,omitempty" validate:"omitempty,email"`
	Password    *string      `json:"password,omitempty" validate:"omitempty,min=8"`
}

type UserResponse struct {
	ID          int       `json:"id"`
	Username    string    `json:"username"`
	DisplayName string    `json:"displayName"`
	AccountType string    `json:"accountType"`
	Email       *string   `json:"email,omitempty"`
	LastLoginAt time.Time `json:"lastLoginAt"`
	CreatedAt   time.Time `json:"createdAt"`
	UpdatedAt   time.Time `json:"updatedAt"`
}

func (u *User) ToResponse() *UserResponse {
	return &UserResponse{
		ID:          u.ID,
		Username:    u.Username,
		DisplayName: u.DisplayName,
		AccountType: string(u.AccountType),
		Email:       u.Email,
		LastLoginAt: u.LastLoginAt,
		CreatedAt:   u.CreatedAt,
		UpdatedAt:   u.UpdatedAt,
	}
}
