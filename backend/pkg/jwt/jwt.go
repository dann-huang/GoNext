package jwt

import (
	"fmt"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

type RegisterableClaims interface {
	jwt.Claims
	GetRegisteredClaims() *jwt.RegisteredClaims
}

type Manager[T RegisterableClaims] interface {
	GenerateToken(claims T, expiryOverride ...*time.Duration) (string, error)
	ValidateToken(token string) (T, error)
}

type managerImpl[T RegisterableClaims] struct {
	secret   []byte
	expiry   time.Duration
	issuer   string
	audience string
}

func NewManager[T RegisterableClaims](secret string, expiry time.Duration, issuer, audience string) Manager[T] {
	return &managerImpl[T]{
		secret:   []byte(secret),
		expiry:   expiry,
		issuer:   issuer,
		audience: audience,
	}
}

func (m *managerImpl[T]) GenerateToken(claims T, expiryOverride ...*time.Duration) (string, error) {
	currentExpiry := m.expiry
	if len(expiryOverride) > 0 && expiryOverride[0] != nil {
		currentExpiry = *expiryOverride[0]
	}

	rc := claims.GetRegisteredClaims()
	if rc == nil {
		return "", fmt.Errorf("jwt: registered claim cannot be nil")
	}

	rc.ExpiresAt = jwt.NewNumericDate(time.Now().Add(currentExpiry))
	rc.IssuedAt = jwt.NewNumericDate(time.Now())
	rc.Issuer = m.issuer
	rc.Audience = jwt.ClaimStrings{m.audience}

	t, err := jwt.NewWithClaims(jwt.SigningMethodHS256, claims).SignedString(m.secret)
	if err != nil {
		return "", fmt.Errorf("jtw: failed to sign token: %w", err)
	}
	return t, nil
}

func (m *managerImpl[T]) ValidateToken(token string) (T, error) {
	var claims T

	keyFunc := func(token *jwt.Token) (any, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("jwt: failed to sign with method: %v", token.Header["alg"])
		}
		return m.secret, nil
	}

	parsedToken, err := jwt.ParseWithClaims(token, claims, keyFunc,
		jwt.WithValidMethods([]string{"HS256"}),
		jwt.WithAudience(m.audience),
		jwt.WithIssuer(m.issuer),
		jwt.WithExpirationRequired(),
		jwt.WithIssuedAt())

	if err != nil {
		return claims, fmt.Errorf("jwt: token parse failed: %w", err)
	}
	if !parsedToken.Valid {
		return claims, fmt.Errorf("jwt: invalid token")
	}

	return claims, nil
}
