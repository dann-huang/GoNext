package jwt

import (
	"encoding/json"
	"fmt"
	"reflect"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

type Manager[P any] interface {
	GenerateToken(payload *P) (string, error)
	ValidateToken(token string) (*P, error)
}

func NewManager[P any](secret string, expiry time.Duration, issuer, audience string, payloadType P) (Manager[P], error) {
	val := reflect.ValueOf(payloadType)
	// if val.Kind() == reflect.Ptr {
	// 	val = val.Elem()
	// }
	if val.Kind() != reflect.Struct {
		return nil, fmt.Errorf("jwt: payloadType must be struct")
	}

	return &jwtManager[P]{
		secret:      []byte(secret),
		expiry:      expiry,
		issuer:      issuer,
		audience:    audience,
		payloadType: reflect.TypeOf(payloadType),
	}, nil
}

type claimsContainer struct {
	jwt.RegisteredClaims
	Payload json.RawMessage `json:"payload"` // defer unmarshaling
}

type jwtManager[P any] struct {
	secret      []byte
	expiry      time.Duration
	issuer      string
	audience    string
	payloadType reflect.Type
}

func (m *jwtManager[P]) GenerateToken(payload *P) (string, error) {
	payloadJson, err := json.Marshal(payload)
	if err != nil {
		return "", fmt.Errorf("jwt: marshal payload failed: %w", err)
	}

	claims := claimsContainer{
		RegisteredClaims: jwt.RegisteredClaims{
			Issuer: m.issuer,
			// Subject: ,
			Audience:  jwt.ClaimStrings{m.audience},
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(m.expiry)),
			NotBefore: jwt.NewNumericDate(time.Now()),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			// ID,
		},
		Payload: payloadJson,
	}

	token, err := jwt.NewWithClaims(jwt.SigningMethodHS256, claims).SignedString(m.secret)
	if err != nil {
		return "", fmt.Errorf("jwt: token signing failed: %w", err)
	}
	return token, nil
}

func (m *jwtManager[P]) ValidateToken(token string) (*P, error) {
	var claims claimsContainer

	keyFunc := func(tok *jwt.Token) (any, error) {
		if _, ok := tok.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("jwt: signing method error")
		}
		return m.secret, nil
	}
	parsed, err := jwt.ParseWithClaims(token, &claims, keyFunc)
	if err != nil {
		return nil, fmt.Errorf("fwt: token parse failed: %w", err)
	} else if !parsed.Valid {
		return nil, fmt.Errorf("fwt: token is invalid")
	}

	payloadPtr, ok := reflect.New(m.payloadType).Interface().(*P)
	if !ok {
		return nil, fmt.Errorf("fwt: payload doesn't conform to type %v", m.payloadType)
	}
	//payload := reflect.New(m.payloadType).Elem().Interface().(P) //or do this

	err = json.Unmarshal(claims.Payload, payloadPtr)
	if err != nil {
		return nil, fmt.Errorf("fwt: payload unmarshal failed %w", err)
	}
	return payloadPtr, nil
}
