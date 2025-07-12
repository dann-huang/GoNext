package token

import (
	"gonext/internal/model"
	"gonext/pkg/jwt/v2"
)

type UserPayload struct {
	UserID      int               `json:"user_id"`
	Username    string            `json:"username"`
	Displayname string            `json:"displayname"`
	AccountType model.AccountType `json:"account_type"`
	Email       *string           `json:"email,omitempty"`
}

type UserManager = jwt.Manager[UserPayload]
