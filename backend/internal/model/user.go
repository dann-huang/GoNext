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

func (a *AccountType) Scan(value any) error {
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

func (a AccountType) Value() (driver.Value, error) {
	return string(a), nil
}

type User struct {
	ID          string      `db:"id"`
	Username    string      `db:"username"`
	DisplayName string      `db:"displayname"`
	AccountType AccountType `db:"account_type"`
	Email       *string     `db:"email"`
	PassHash    *string     `db:"passhash"`
	CreatedAt   time.Time   `db:"created_at"`
	UpdatedAt   time.Time   `db:"updated_at"`
	LastLoginAt time.Time   `db:"last_login_at"`
}

type UserUpdate struct {
	Username    *string
	DisplayName *string
	AccountType *AccountType
	Email       *string
	PassHash    *string
}
