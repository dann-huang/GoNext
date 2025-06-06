package token

import (
	"letsgo/pkg/jwt/v2"
)

type UserPayload struct{ Username string }

type UserManager = jwt.Manager[UserPayload]
