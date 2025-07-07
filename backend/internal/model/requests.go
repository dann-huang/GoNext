package model

type UserNames struct {
	Username    string `json:"username" validate:"required,alphanum,min=3,max=20"`
	DisplayName string `json:"displayName" validate:"required,min=2,max=50"`
}

type UserPass struct {
	CurrentPassword string `json:"currentPassword" validate:"required"`
	NewPassword     string `json:"newPassword" validate:"required,min=8"`
}

type UserResponse struct {
	Username    string `json:"username"`
	DisplayName string `json:"displayName"`
	AccountType string `json:"accountType"`
}

func (u *User) ToResponse() *UserResponse {
	return &UserResponse{
		Username:    u.Username,
		DisplayName: u.DisplayName,
		AccountType: string(u.AccountType),
	}
}

type SetupEmail struct {
	Email string `json:"email" validate:"required,email"`
}

type VerifyEmail struct {
	Code string `json:"code" validate:"required,len=6"`
}

type UpgradeResponse struct {
	Message string        `json:"message"`
	User    *UserResponse `json:"user,omitempty"`
}
