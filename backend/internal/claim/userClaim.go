package claim

import "github.com/golang-jwt/jwt/v5" // Example for JWT claims

type UserClaims struct {
	UserID   string `json:"user_id"`
	Username string `json:"username"`
	jwt.RegisteredClaims
}

type RefreshClaims struct {
	UserID   string `json:"user_id"`
	Username string `json:"username"`
}
