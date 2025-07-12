package repo

import (
	"context"
	"database/sql"
	"fmt"
	"gonext/internal/model"
	"strings"

	"github.com/lib/pq"
)

type UserRepo interface {
	CreateUser(ctx context.Context, user *model.User) (*model.User, error)
	ReadUserByName(ctx context.Context, username string) (*model.User, error)
	ReadUserByID(ctx context.Context, id string) (*model.User, error)
	ReadUserByEmail(ctx context.Context, email string) (*model.User, error)
	UpdateUser(ctx context.Context, id string, params *model.UserUpdate) (*model.User, error)
	DeleteUser(ctx context.Context, id string) error
	UpdateLastLogin(ctx context.Context, id string) error
}

func newUserRepo(db *sql.DB) UserRepo {
	return &pgUserRepo{db: db}
}

type pgUserRepo struct {
	db *sql.DB
}

func (r *pgUserRepo) CreateUser(ctx context.Context, user *model.User) (*model.User, error) {
	var newUser model.User
	query := `
		INSERT INTO users (username, displayname, email, passhash, account_type)
		VALUES ($1, $2, $3, $4, $5)
		RETURNING id, username, displayname, email, passhash, account_type, 
		          created_at, updated_at, last_login_at
	`

	var lowerEmail *string
	if user.Email != nil {
		temp := strings.ToLower(*user.Email)
		lowerEmail = &temp
	}

	err := r.db.QueryRowContext(
		ctx,
		query,
		user.Username,
		user.DisplayName,
		sql.NullString{String: *lowerEmail, Valid: lowerEmail != nil},
		sql.NullString{String: *user.PassHash, Valid: user.PassHash != nil},
		user.AccountType,
	).Scan(
		&newUser.ID,
		&newUser.Username,
		&newUser.DisplayName,
		&newUser.Email,
		&newUser.PassHash,
		&newUser.AccountType,
		&newUser.CreatedAt,
		&newUser.UpdatedAt,
		&newUser.LastLoginAt,
	)

	if err != nil {
		if pqErr, ok := err.(*pq.Error); ok {
			switch {
			case pqErr.Code == "23505" && strings.Contains(pqErr.Constraint, "username"):
				err = fmt.Errorf("%w: username already exists", ErrAlreadyExists)
			case pqErr.Code == "23505" && strings.Contains(pqErr.Constraint, "email"):
				err = fmt.Errorf("%w: email already exists", ErrAlreadyExists)
			}
		}
		return nil, fmt.Errorf("repo: failed to create user: %w", err)
	}

	return &newUser, nil
}

func (r *pgUserRepo) ReadUserByName(ctx context.Context, username string) (*model.User, error) {
	var user model.User
	query := `
		SELECT id, username, displayname, email, passhash, account_type, 
		       created_at, updated_at, last_login_at
		FROM users 
		WHERE username = $1
	`

	err := r.db.QueryRowContext(ctx, query, username).Scan(
		&user.ID,
		&user.Username,
		&user.DisplayName,
		&user.Email,
		&user.PassHash,
		&user.AccountType,
		&user.CreatedAt,
		&user.UpdatedAt,
		&user.LastLoginAt,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			err = ErrNotFound
		}
		return nil, fmt.Errorf("repo: failed to get user by username=%v: %w", username, err)
	}

	return &user, nil
}

func (r *pgUserRepo) ReadUserByID(ctx context.Context, id string) (*model.User, error) {
	var user model.User
	query := `
		SELECT id, username, displayname, email, account_type, created_at, updated_at, last_login_at
		FROM users
		WHERE id = $1 AND deleted_at IS NULL
	`

	err := r.db.QueryRowContext(ctx, query, id).Scan(
		&user.ID,
		&user.Username,
		&user.DisplayName,
		&user.Email,
		&user.AccountType,
		&user.CreatedAt,
		&user.UpdatedAt,
		&user.LastLoginAt,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, ErrNotFound
		}
		return nil, fmt.Errorf("repo: failed to get user by ID=%v: %w", id, err)
	}

	return &user, nil
}

func (r *pgUserRepo) ReadUserByEmail(ctx context.Context, email string) (*model.User, error) {
	var user model.User
	query := `
		SELECT id, username, displayname, email, passhash, account_type, 
		       created_at, updated_at, last_login_at
		FROM users 
		WHERE email = $1 AND deleted_at IS NULL
	`

	lowerEmail := strings.ToLower(email)
	err := r.db.QueryRowContext(ctx, query, lowerEmail).Scan(
		&user.ID,
		&user.Username,
		&user.DisplayName,
		&user.Email,
		&user.PassHash,
		&user.AccountType,
		&user.CreatedAt,
		&user.UpdatedAt,
		&user.LastLoginAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("%w: user not found with email %s", ErrNotFound, email)
		}
		return nil, fmt.Errorf("repo: failed to get user by email: %w", err)
	}

	return &user, nil
}

func (r *pgUserRepo) UpdateUser(ctx context.Context, id string, params *model.UserUpdate) (*model.User, error) {
	updates := []string{}
	args := []any{}
	argCounter := 1

	if params.Email != nil {
		lowerEmail := strings.ToLower(*params.Email)
		updates = append(updates, fmt.Sprintf("email = $%d", argCounter))
		args = append(args, lowerEmail)
		argCounter++
	}
	if params.Username != nil {
		updates = append(updates, fmt.Sprintf("username = $%d", argCounter))
		args = append(args, *params.Username)
		argCounter++
	}
	if params.DisplayName != nil {
		updates = append(updates, fmt.Sprintf("displayname = $%d", argCounter))
		args = append(args, *params.DisplayName)
		argCounter++
	}
	if params.PassHash != nil {
		updates = append(updates, fmt.Sprintf("passhash = $%d", argCounter))
		args = append(args, *params.PassHash)
		argCounter++
	}
	if params.AccountType != nil {
		updates = append(updates, fmt.Sprintf("account_type = $%d", argCounter))
		args = append(args, *params.AccountType)
		argCounter++
	}

	if len(updates) == 0 {
		return r.ReadUserByID(ctx, id)
	}

	args = append(args, id)

	query := fmt.Sprintf(`
		UPDATE users 
		SET %s
		WHERE id = $%d
		RETURNING id, username, displayname, email, passhash, 
		          account_type, created_at, updated_at, last_login_at
	`, strings.Join(updates, ", "), argCounter)

	var updatedUser model.User
	err := r.db.QueryRowContext(ctx, query, args...).Scan(
		&updatedUser.ID,
		&updatedUser.Username,
		&updatedUser.DisplayName,
		&updatedUser.Email,
		&updatedUser.PassHash,
		&updatedUser.AccountType,
		&updatedUser.CreatedAt,
		&updatedUser.UpdatedAt,
		&updatedUser.LastLoginAt,
	)

	if err != nil {
		if pqErr, ok := err.(*pq.Error); ok {
			switch {
			case pqErr.Code == "23505" && strings.Contains(pqErr.Constraint, "username"):
				err = fmt.Errorf("%w: username already exists", ErrAlreadyExists)
			case pqErr.Code == "23505" && strings.Contains(pqErr.Constraint, "email"):
				err = fmt.Errorf("%w: email already exists", ErrAlreadyExists)
			}
		} else if err == sql.ErrNoRows {
			err = ErrNotFound
		}
		return nil, fmt.Errorf("repo: failed to update user: %w", err)
	}

	return &updatedUser, nil
}

func (r *pgUserRepo) DeleteUser(ctx context.Context, id string) error {
	result, err := r.db.ExecContext(
		ctx,
		`DELETE FROM users WHERE id = $1`,
		id,
	)
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

func (r *pgUserRepo) UpdateLastLogin(ctx context.Context, id string) error {
	result, err := r.db.ExecContext(
		ctx,
		`UPDATE users SET last_login_at = NOW() WHERE id = $1`,
		id,
	)
	if err != nil {
		return fmt.Errorf("repo: failed to update last login: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("repo: failed to update last login: %w", err)
	}

	if rowsAffected == 0 {
		return fmt.Errorf("repo: user not found: %w", ErrNotFound)
	}

	return nil
}
