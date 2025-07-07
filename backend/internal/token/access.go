package token

import (
	"letsgo/internal/model"
	"letsgo/pkg/jwt/v2"
)

type UserPayload struct {
	Username    string            `json:"username"`
	Displayname string            `json:"displayname"`
	AccountType model.AccountType `json:"account_type"`
}

// NewUserPayload creates a new UserPayload with the given user details
func NewUserPayload(username, displayname string, accountType model.AccountType) *UserPayload {
	return &UserPayload{
		Username:    username,
		Displayname: displayname,
		AccountType: accountType,
	}
}

type UserManager = jwt.Manager[UserPayload]
