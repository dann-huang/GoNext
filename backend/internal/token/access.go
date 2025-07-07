package token

import (
	"letsgo/internal/model"
	"letsgo/pkg/jwt/v2"
)

type UserPayload struct {
	UserID      int               `json:"user_id"`
	Username    string            `json:"username"`
	Displayname string            `json:"displayname"`
	AccountType model.AccountType `json:"account_type"`
}

func NewUserPayload(userID int, username, displayname string, accountType model.AccountType) *UserPayload {
	return &UserPayload{
		UserID:      userID,
		Username:    username,
		Displayname: displayname,
		AccountType: accountType,
	}
}

type UserManager = jwt.Manager[UserPayload]
