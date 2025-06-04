package jwt

import (
	"fmt"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

type JWTManager[T jwt.Claims] struct {
	secret   []byte
	expiry   time.Duration
	issuer   string
	audience string
}

func NewManager[T jwt.Claims](secret string, expiry time.Duration, issuer, audience string) *JWTManager[T] {
	return &JWTManager[T]{
		secret:   []byte(secret),
		expiry:   expiry,
		issuer:   issuer,
		audience: audience,
	}
}

func (m *JWTManager[T]) GenerateToken(claims jwt.MapClaims, expiryOverride ...*time.Duration) (string, error) {
	expiry := m.expiry
	if len(expiryOverride) > 0 && expiryOverride[0] != nil {
		expiry = *expiryOverride[0]
	}

	claims["exp"] = time.Now().Add(expiry).Unix()
	claims["iat"] = time.Now().Unix()
	claims["iss"] = m.issuer
	claims["aud"] = m.audience

	t, err := jwt.NewWithClaims(jwt.SigningMethodHS256, claims).SignedString(m.secret)
	if err != nil {
		return "", fmt.Errorf("failed to sign token: %w", err)
	}
	return t, nil
}

func (m *JWTManager[T]) ValidateToken(tokenString string) (*T, error) {
	var claims T
	claimsInstance := any(&claims).(jwt.Claims)

	keyFunc := func(token *jwt.Token) (any, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return m.secret, nil
	}

	token, err := jwt.ParseWithClaims(tokenString, claimsInstance, keyFunc,
		jwt.WithValidMethods([]string{"HS256"}),
		jwt.WithAudience(m.audience),
		jwt.WithIssuer(m.issuer),
		jwt.WithExpirationRequired(),
		jwt.WithIssuedAt())

	if err != nil {
		return nil, fmt.Errorf("token validation failed: %w", err)
	}
	if !token.Valid {
		return nil, fmt.Errorf("invalid token")
	}

	return &claims, nil
}
