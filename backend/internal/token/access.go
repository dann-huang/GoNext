package token

import (
	"letsgo/pkg/jwt/v2"
)

type UserPayload struct {
	Username    string
	Displayname string
}

func NewUserPayload(username, displayname string) *UserPayload {
	return &UserPayload{
		Username:    username,
		Displayname: displayname,
	}
}

type UserManager = jwt.Manager[UserPayload]
