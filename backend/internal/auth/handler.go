package auth

import (
	"encoding/json"
	"errors"
	"letsgo/internal/config"
	"letsgo/internal/model"
	"letsgo/internal/repo"
	"letsgo/pkg/util"
	"log/slog"
	"net/http"
	"time"

	"github.com/go-playground/validator/v10"
)

type handler interface {
	indexHandler() http.HandlerFunc
	registerHandler() http.HandlerFunc
	loginHandler() http.HandlerFunc
	logoutHandler() http.HandlerFunc
	refreshHandler() http.HandlerFunc
}

func newHandler(service service, config *config.Auth) handler {
	return &handlerImpl{
		service: service,
		config:  config,
	}
}

type handlerImpl struct {
	service service
	config  *config.Auth
}

func (h *handlerImpl) indexHandler() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(`{"message": "Auth is running"}`))
	}
}

func (h *handlerImpl) setAuthCookie(w http.ResponseWriter, name, value, path string, expires time.Time) {
	http.SetCookie(w, &http.Cookie{
		Name:  name,
		Value: value,
		// Quoted,
		Path:    path,
		Domain:  h.config.Domain,
		Expires: expires,
		// RawExpires,
		// MaxAge,
		Secure:   false,
		HttpOnly: true,
		// SameSite: http.SameSiteNoneMode,
		// Partitioned,
		// Raw,
		// Unparsed,
	})
}

func (h *handlerImpl) registerHandler() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var params model.UserReq
		if err := json.NewDecoder(r.Body).Decode(&params); err != nil {
			util.RespondErr(w, http.StatusBadRequest, "Bad request", err)
			return
		}
		if err := validator.New(validator.WithRequiredStructEnabled()).Struct(params); err != nil {
			util.RespondErr(w, http.StatusBadRequest, "Missing required fields", err)
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
		var req model.UserReq
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			util.RespondErr(w, http.StatusBadRequest, "Invalid request", nil)
		}

		usr, access, refresh, err := h.service.loginUser(r.Context(), req.Username, req.Password)
		if err != nil {
			if errors.Is(err, repo.ErrNotFound) {
				util.RespondErr(w, http.StatusUnauthorized, "Credentials not found", nil)
			} else {
				util.RespondErr(w, http.StatusInternalServerError, "Something went wrong", err)
			}
			return
		}

		accExpire := time.Now().Add(h.config.AccTTL)
		refExpire := time.Now().Add(h.config.RefTTL)
		h.setAuthCookie(w, h.config.AccCookieName, access, "/", accExpire)
		h.setAuthCookie(w, h.config.RefCookieName, refresh, "/api/auth", refExpire)

		util.RespondJSON(w, http.StatusOK, map[string]any{
			"message":        "login success",
			"username":       usr.Username,
			"displayname":    usr.DisplayName,
			"accessExpires":  accExpire.UnixMilli(),
			"refreshExpires": refExpire.UnixMilli(),
		})
	}
}

func (h *handlerImpl) logoutHandler() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		refreshCookie, err := r.Cookie(h.config.RefCookieName)
		if err == nil {
			h.service.logoutUser(r.Context(), refreshCookie.Name)

			h.setAuthCookie(w, h.config.AccCookieName, "", "/", time.Unix(0, 0))
			h.setAuthCookie(w, h.config.RefCookieName, "", "/api/auth", time.Unix(0, 0))
		} else {
			slog.Error(err.Error())
		}
		util.RespondJSON(w, http.StatusOK, map[string]string{"message": "logout success"})
	}
}

func (h *handlerImpl) refreshHandler() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		refreshCookie, err := r.Cookie(h.config.RefCookieName)
		if err != nil {
			util.RespondErr(w, http.StatusUnauthorized, "No Refresh Token", nil)
			return
		}
		access, refresh, err := h.service.refreshUser(r.Context(), refreshCookie.Value)
		if err != nil {
			slog.Error(err.Error())
		}
		if access == "" {
			util.RespondErr(w, http.StatusInternalServerError, "Refresh failed", nil)
			return
		}

		accExpire := time.Now().Add(h.config.AccTTL)
		refExpire := time.Now().Add(h.config.RefTTL)
		h.setAuthCookie(w, h.config.AccCookieName, access, "/", accExpire)
		h.setAuthCookie(w, h.config.RefCookieName, refresh, "/api/auth", refExpire)

		util.RespondJSON(w, http.StatusOK, map[string]any{
			"message":        "refresh success",
			"accessExpires":  accExpire.UnixMilli(),
			"refreshExpires": refExpire.UnixMilli(),
		})
	}
}
