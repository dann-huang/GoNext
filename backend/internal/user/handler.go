package user

import (
	"encoding/json"
	"errors"
	"letsgo/pkg/util"
	"net/http"
)

type Handler interface {
	IndexHandler() http.HandlerFunc
	RegisterHandler() http.HandlerFunc
	LoginHandler() http.HandlerFunc
	LogoutHandler() http.HandlerFunc
	RefreshHandler() http.HandlerFunc
}

type handlerImpl struct {
	service Service
}

func NewHandler(service Service) Handler {
	return &handlerImpl{
		service: service,
	}
}

func (h *handlerImpl) sendErrorResponse(w http.ResponseWriter, status int, msg string, err error) {
	if err != nil {
		//todo: error handling
	}
	util.RespondJSON(w, status, map[string]string{"error": msg})
}

func (h *handlerImpl) IndexHandler() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(`{"message": "User is running"}`))
	}
}

func (h *handlerImpl) RegisterHandler() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var params NewUserParams
		if err := json.NewDecoder(r.Body).Decode(&params); err != nil {
			h.sendErrorResponse(w, http.StatusBadRequest, "Invalid request", err)
			return
		}
		usr, err := h.service.CreateUser(r.Context(), params.Username, params.Password)
		if err != nil {
			if errors.Is(err, ErrAlreadyExists) {
				h.sendErrorResponse(w, http.StatusConflict, "Username taken", nil)
			} else {
				h.sendErrorResponse(w, http.StatusInternalServerError, "Something went wrong", err)
			}
			return
		}

		util.RespondJSON(w, http.StatusOK, map[string]string{
			"message":     "Success",
			"username":    usr.Username,
			"displayname": usr.DisplayName,
		})
	}
}

func (h *handlerImpl) LoginHandler() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		//todo
	}
}

func (h *handlerImpl) LogoutHandler() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		//todo
	}
}

func (h *handlerImpl) RefreshHandler() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		//todo
	}
}
