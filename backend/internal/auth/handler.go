package auth

import (
	"encoding/json"
	"errors"
	"letsgo/internal/model"
	"letsgo/internal/repo"
	"letsgo/pkg/util"
	"net/http"
)

type handler interface {
	indexHandler() http.HandlerFunc
	registerHandler() http.HandlerFunc
	loginHandler() http.HandlerFunc
	logoutHandler() http.HandlerFunc
	refreshHandler() http.HandlerFunc
}

type handlerImpl struct {
	service service
}

func newHandler(service service) handler {
	return &handlerImpl{
		service: service,
	}
}

func (h *handlerImpl) indexHandler() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(`{"message": "User is running"}`))
	}
}

func (h *handlerImpl) registerHandler() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var params model.UserCreate
		if err := json.NewDecoder(r.Body).Decode(&params); err != nil {
			util.RespondErr(w, http.StatusBadRequest, "Invalid request", err)
			return
		}
		usr, err := h.service.createUser(r.Context(), params.Username, params.Password)
		if err != nil {
			if errors.Is(err, repo.ErrAlreadyExists) {
				util.RespondErr(w, http.StatusConflict, "Username taken", nil)
			} else {
				util.RespondErr(w, http.StatusInternalServerError, "Something went wrong", err)
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

func (h *handlerImpl) loginHandler() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		//todo
	}
}

func (h *handlerImpl) logoutHandler() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		//todo
	}
}

func (h *handlerImpl) refreshHandler() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		//todo
	}
}
