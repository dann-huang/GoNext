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

func CreateUser(ctx context.Context, db *sql.DB, name, pass string) (*User, error) {
	if name == "" {
		return nil, errors.New("name cannot be empty")
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(pass), bcrypt.DefaultCost)
	if err != nil {
		return nil, err
	}
	query := `INSERT INTO users (name, pass_hash) VALUES ($1, $2) RETURNING id`
	var id int64
	err = db.QueryRowContext(ctx, query, name, string(hash)).Scan(&id)
	if err != nil {
		return nil, err
	}
	return &User{ID: id, Name: name, PassHash: string(hash)}, nil
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

func InitSchema(db *sql.DB) error {
	query := `
	CREATE TABLE IF NOT EXISTS users (
		id SERIAL PRIMARY KEY,
		name TEXT UNIQUE NOT NULL,
		password TEXT NOT NULL
	);`
	_, err := db.Exec(query)
	if err != nil {
		return err
	}
	return nil
}
