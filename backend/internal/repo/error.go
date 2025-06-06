package repo

import "errors"

var ErrNotFound = errors.New("repo: not found")
var ErrAlreadyExists = errors.New("repo: already exists")
var ErrInvalidInput = errors.New("repo: invalid input")
