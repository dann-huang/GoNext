package util

import (
	"fmt"

	"golang.org/x/crypto/bcrypt"
)

func PasswordHash(password string) (string, error) {
	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return "", fmt.Errorf("password: hashing failed: %w", err)
	}
	return string(hash), nil
}

func PasswordCheck(password, passhash string) bool {
	return bcrypt.CompareHashAndPassword([]byte(passhash), []byte(password)) == nil
}
