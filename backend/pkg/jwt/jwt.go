package jwt

import (
	"fmt"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

type JWTManager struct {
	secret   []byte
	expiry   time.Duration
	issuer   string
	audience string
}

func NewManager(secret string, expliry time.Duration, issuer, audience string) *JWTManager {
	return &JWTManager{
		secret:   []byte(secret),
		expiry:   expliry,
		issuer:   issuer,
		audience: audience,
	}
}

func (m *JWTManager) GenerateToken(claims jwt.MapClaims, expiryOverride *time.Duration) (string, error) {
	expiry := m.expiry
	if expiryOverride != nil {
		expiry = *expiryOverride
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

func (m *JWTManager) ValidateToken(tokenString string) (jwt.MapClaims, error) {
	keyFunc := func(token *jwt.Token) (any, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return []byte(m.secret), nil
	}
	token, err := jwt.Parse(tokenString, keyFunc,
		jwt.WithValidMethods([]string{"HS256"}),
		jwt.WithAudience(m.audience),
		jwt.WithIssuer(m.issuer),
		jwt.WithExpirationRequired(),
		jwt.WithIssuedAt())

	if err != nil {
		return nil, fmt.Errorf("token validation failed: %w", err)
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok || !token.Valid {
		return nil, fmt.Errorf("invalid token claims")
	}

	return claims, nil
}
