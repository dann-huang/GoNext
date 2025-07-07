package mdw

import (
	"context"
	"letsgo/internal/token"
	"net/http"
	"time"
)

type ContextKey string

type Middleware = func(http.Handler) http.Handler

const userCtxKey ContextKey = "user"

func AccessMdw(mngr token.UserManager, cookieName string, cookieTTL time.Duration) Middleware {

	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			cookie, err := r.Cookie(cookieName)
			if err != nil {
				http.Error(w, "Unauthorized - missing token", http.StatusUnauthorized)
				return
			}
			payload, err := mngr.ValidateToken(cookie.Value)
			if err != nil {
				http.Error(w, "Unauthorized - invalid token", http.StatusUnauthorized)
				return
			}

			ctx := context.WithValue(r.Context(), userCtxKey, payload)

			// TODO: Implement token rotation
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

func GetUser(ctx context.Context) *token.UserPayload {
	if user, ok := ctx.Value(userCtxKey).(*token.UserPayload); ok {
		return user
	}
	return nil
}
