package user

import "errors"

var ErrNotFound = errors.New("user: not found")
var ErrAlreadyExists = errors.New("user: already exists")
var ErrInvalidInput = errors.New("user: invalid input")
