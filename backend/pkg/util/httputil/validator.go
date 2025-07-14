package httputil

import (
	"encoding/json"
	"net/http"

	"github.com/go-playground/validator/v10"
)

type HasMsg interface {
	ErrMsg(err error) string
}

type Validator struct {
	validate *validator.Validate
}

func NewValidator() *Validator {
	return &Validator{
		validate: validator.New(validator.WithRequiredStructEnabled()),
	}
}

func (v *Validator) DecodeValidate(w http.ResponseWriter, r *http.Request, target any) bool {
	if err := json.NewDecoder(r.Body).Decode(target); err != nil {
		RespondErr(w, http.StatusBadRequest, "Invalid request", err)
		return false
	}

	if err := v.validate.Struct(target); err != nil {
		if hasMsg, ok := target.(HasMsg); ok {
			if msg := hasMsg.ErrMsg(err); msg != "" {
				RespondErr(w, http.StatusBadRequest, msg, nil)
				return false
			}
		}
		RespondErr(w, http.StatusBadRequest, "Invalid input", nil)
		return false
	}
	return true
}
