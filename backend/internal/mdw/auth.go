package mdw

import (
	"context"
	"letsgo/internal/token"
	"net/http"
	"time"
)

type ContextKey string

func AccessMdw(jwt token.AccessTokenManager, cookieName string,
	cookieTTL time.Duration, payloadKey ContextKey) func(http.Handler) http.Handler {

	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			cookie, err := r.Cookie(cookieName)
			if err != nil {
				http.Error(w, "Unauthorized - missing token", http.StatusUnauthorized)
				return
			}
			payload, err := jwt.ValidateToken(cookie.Value)
			if err != nil {
				http.Error(w, "Unauthorized - invalid token", http.StatusUnauthorized)
				return
			}

			// // rotate token. Maybe look into rotating every x uses?
			// newToken, err := jwt.GenerateToken(payload)
			// if err != nil {
			// 	http.Error(w, "Internal Server Error - token rotation failed", http.StatusInternalServerError)
			// 	return
			// }
			// http.SetCookie(w, &http.Cookie{
			// 	Name:     cookieName,
			// 	Value:    newToken,
			// 	Expires:  time.Now().Add(cookieTTL),
			// 	HttpOnly: true,
			// 	Secure:   true,
			// })

			ctx := context.WithValue(r.Context(), payloadKey, payload)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}
