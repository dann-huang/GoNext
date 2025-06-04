package mdw

import (
	"letsgo/internal/claim"
	"letsgo/pkg/jwt"
	"net/http"
)

func Auth(jwt *jwt.JWTManager[claim.UserClaims]) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		//todo
		return next
	}
}
