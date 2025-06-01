package user

import (
	"context"
	"database/sql"
	"errors"

	"golang.org/x/crypto/bcrypt"
)

type User struct {
	ID       int64
	Name     string
	PassHash string
}

func CreateUser(ctx context.Context, db *sql.DB, name, pass string) error {
	if name == "" {
		return errors.New("name cannot be empty")
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(pass), bcrypt.DefaultCost)
	if err != nil {
		return err
	}
	query := `INSERT INTO users (name, pass_hash) VALUES ($1, $2)`
	_, err = db.ExecContext(ctx, query, name, string(hash))
	if err != nil {
		return err
	}
	return nil
}

func GetUserByName(ctx context.Context, db *sql.DB, name string) (*User, error) {
	var u User
	query := `SELECT id, name, pass_hash FROM users WHERE name = $1`
	err := db.QueryRowContext(ctx, query, name).
		Scan(&u.ID, &u.Name, &u.PassHash)
	if err != nil {
		return nil, err
	}
	return &u, nil
}

func (u *User) VerifyPassword(password string) bool {
	return bcrypt.CompareHashAndPassword([]byte(u.PassHash), []byte(password)) == nil
}
