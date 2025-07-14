package auth

import (
	"github.com/go-playground/validator/v10"
)

type userInfo struct {
	Username    string `json:"username"`
	DisplayName string `json:"displayName"`
	AccountType string `json:"accountType"`
}

type authRes struct {
	User      *userInfo `json:"user"`
	AccessExp int64     `json:"accessExp"`
}

type guestReq struct {
	Name string `json:"name" validate:"required,alphanum,min=5,max=30"`
}

func (r guestReq) ErrMsg(err error) string {
	if validationErrs, ok := err.(validator.ValidationErrors); ok {
		for _, e := range validationErrs {
			switch e.Tag() {
			case "required":
				return "This field is required"
			case "alphanum":
				return "Must contain only letters and numbers"
			case "min":
				return "Must be at least 5 characters"
			case "max":
				return "Cannot be longer than 30 characters"
			}
		}
	}
	return ""
}

type setEmailReq struct {
	Email string `json:"email" validate:"required,email"`
}

func (r setEmailReq) ErrMsg(err error) string {
	return "Doesn't look like an email"
}

type verifyEmailReq struct {
	Code string `json:"code" validate:"required,len=6"`
}

func (r verifyEmailReq) ErrMsg(err error) string {
	return "Code should be 6 digits"
}

type emailLoginReq struct {
	Email string `json:"email" validate:"required,email"`
	Code  string `json:"code" validate:"required,len=6"`
}

func (r emailLoginReq) ErrMsg(err error) string {
	if validationErrs, ok := err.(validator.ValidationErrors); ok {
		for _, e := range validationErrs {
			if e.Field() == "Email" && e.Tag() == "email" {
				return "Doesn't look like an email"
			}
			if e.Field() == "Code" && e.Tag() == "len" {
				return "Code should be 6 digits"
			}
		}
	}
	return "Invalid email or verification code"
}

type passReq struct {
	Pass string `json:"pass" validate:"required,min=8"`
	Code string `json:"code" validate:"required,len=6"`
}

func (r passReq) ErrMsg(err error) string {
	if validationErrs, ok := err.(validator.ValidationErrors); ok {
		for _, e := range validationErrs {
			if e.Field() == "Pass" && e.Tag() == "min" {
				return "Password must be at least 8 characters"
			}
			if e.Field() == "Code" && e.Tag() == "len" {
				return "Code should be 6 digits"
			}
		}
	}
	return "Invalid password or verification code"
}

type passLoginReq struct {
	Email string `json:"email" validate:"required,email"`
	Pass  string `json:"pass" validate:"required"`
}

func (r passLoginReq) ErrMsg(err error) string {
	if validationErrs, ok := err.(validator.ValidationErrors); ok {
		for _, e := range validationErrs {
			if e.Field() == "Email" && e.Tag() == "email" {
				return "Doesn't look like an email"
			}
			if e.Field() == "Pass" && e.Tag() == "required" {
				return "Password is required"
			}
		}
	}
	return "Invalid email or password"
}
