package token

import (
	"letsgo/pkg/jwt/v2"
)

type AccessPayload struct{ Username string }

type AccessTokenManager = jwt.Manager[AccessPayload]
