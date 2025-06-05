package claims

import "github.com/golang-jwt/jwt/v5"

type UserClaims struct {
	Username string `json:"username"`
	jwt.RegisteredClaims
}

func (c *UserClaims) GetRegisteredClaims() *jwt.RegisteredClaims {
	return &c.RegisteredClaims
}

func test() {
	claim := new(UserClaims)
	claim.GetRegisteredClaims()
}
