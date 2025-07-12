package model

import "time"

type GuestRequest struct {
	Name string `json:"name" validate:"required,alphanum,min=5,max=30"`
}

type PassRequest struct {
	Pass string `json:"password" validate:"required,min=8"`
	Code string `json:"code" validate:"required,len=6"`
}

type UserResponse struct {
	Username    string `json:"username"`
	DisplayName string `json:"displayName"`
	AccountType string `json:"accountType"`
}

type AuthResponse struct {
	User      *UserResponse `json:"user"`
	AccessExp int64         `json:"accessExp"` // Unix timestamp in seconds
}

func (u *User) ToAuthResponse(expiresAt time.Time) *AuthResponse {
	return &AuthResponse{
		User: &UserResponse{
			Username:    u.Username,
			DisplayName: u.DisplayName,
			AccountType: string(u.AccountType),
		},
		AccessExp: expiresAt.UnixMilli(),
	}
}

type Email struct {
	Email string `json:"email" validate:"required,email"`
}

type EmailCode struct {
	Code string `json:"code" validate:"required,len=6"`
}

type EmailLogin struct {
	Email string `json:"email" validate:"required,email"`
	Code  string `json:"code" validate:"required,len=6"`
}

type EmailPassword struct {
	Code     string `json:"code" validate:"required,len=6"`
	Password string `json:"password" validate:"required"`
}

type UpgradeResponse struct {
	Message string        `json:"message"`
	User    *UserResponse `json:"user,omitempty"`
}

type PasswordLogin struct {
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required"`
}
