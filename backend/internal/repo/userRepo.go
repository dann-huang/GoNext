package repo

import (
	"context"
	"database/sql"
	"fmt"
	"letsgo/internal/model"
	"strings"

	"github.com/lib/pq"
)

type UserRepo interface {
	CreateUser(ctx context.Context, user *model.User) (*model.User, error)
	ReadUser(ctx context.Context, username string) (*model.User, error)
	UpdateUser(ctx context.Context, username string, params *model.UserUpdate) (*model.User, error)
	DeleteUser(ctx context.Context, username string) error
}

func newUserRepo(db *sql.DB) UserRepo {
	return &pgUserRepo{db: db}
}

type pgUserRepo struct {
	db *sql.DB
}

func (r *pgUserRepo) CreateUser(ctx context.Context, user *model.User) (*model.User, error) {
	var newUser model.User
	query := `INSERT INTO users (username, displayname, passhash) VALUES ($1, $2, $3) RETURNING id, username, displayname, passhash`
	err := r.db.QueryRowContext(ctx, query, user.Username, user.DisplayName, user.PassHash).Scan(
		&newUser.ID,
		&newUser.Username,
		&newUser.DisplayName,
		&newUser.PassHash,
	)
	if err != nil {
		if pqErr, ok := err.(*pq.Error); ok {
			if pqErr.Code.Name() == "unique_violation" || pqErr.Code == "23505" {
				err = ErrAlreadyExists
			}
		}
		return nil, fmt.Errorf("repo: failed to create user: %w", err)
	}
	return &newUser, nil
}

func (r *pgUserRepo) ReadUser(ctx context.Context, username string) (*model.User, error) {
	var user model.User
	query := `SELECT id, username, displayname, passhash FROM users WHERE username = $1`
	err := r.db.QueryRowContext(ctx, query, username).Scan(
		&user.ID,
		&user.Username,
		&user.DisplayName,
		&user.PassHash,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			err = ErrNotFound
		}
		return nil, fmt.Errorf("repo: failed to to get by username=%v: %w", username, err)
	}
	return &user, nil
}

func (r *pgUserRepo) UpdateUser(ctx context.Context, username string, params *model.UserUpdate) (*model.User, error) {
	updates := []string{}
	args := []any{}
	argCounter := 1

	if params.DisplayName != nil {
		updates = append(updates, fmt.Sprintf("displayname = $%d", argCounter))
		args = append(args, *params.DisplayName)
		argCounter++
	}
	if params.Password != nil {
		updates = append(updates, fmt.Sprintf("passhash = $%d", argCounter))
		args = append(args, *params.Password)
		argCounter++
	}
	if len(updates) == 0 {
		return r.ReadUser(ctx, username)
	}

	query := fmt.Sprintf("UPDATE users SET %s WHERE username = $%d RETURNING id, username, displayname, passhash",
		strings.Join(updates, ", "), argCounter)
	args = append(args, username)

	var updatedUser model.User
	err := r.db.QueryRowContext(ctx, query, args...).Scan(
		&updatedUser.ID,
		&updatedUser.Username,
		&updatedUser.DisplayName,
		&updatedUser.PassHash,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			err = ErrNotFound
		}
		return nil, fmt.Errorf("repo: failed to update user: %w", err)
	}
	return &updatedUser, nil
}

func (r *pgUserRepo) DeleteUser(ctx context.Context, username string) error {
	result, err := r.db.ExecContext(ctx, `DELETE FROM users WHERE username = $1`, username)
	if err != nil {
		return fmt.Errorf("repo: failed to delete user: %w", err)
	}
	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("repo: failed to delete user: %w", err)
	}
	if rowsAffected == 0 {
		return fmt.Errorf("repo: failed to delete user: %w", ErrNotFound)
	}

	return nil
}
