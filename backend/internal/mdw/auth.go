package mdw

import (
	"letsgo/internal/claims"
	"letsgo/pkg/jwt"
	"net/http"
)

func Auth(jwt *jwt.Manager[*claims.UserClaims]) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		//todo
		return next
	}
}
