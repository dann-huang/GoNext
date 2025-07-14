package auth

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

type setEmailReq struct {
	Email string `json:"email" validate:"required,email"`
}

type verifyEmailReq struct {
	Code string `json:"code" validate:"required,len=6"`
}

type emailLoginReq struct {
	Email string `json:"email" validate:"required,email"`
	Code  string `json:"code" validate:"required,len=6"`
}

type passReq struct {
	Pass string `json:"pass" validate:"required,min=8"`
	Code string `json:"code" validate:"required,len=6"`
}

type passLoginReq struct {
	Email string `json:"email" validate:"required,email"`
	Pass  string `json:"pass" validate:"required"`
}
