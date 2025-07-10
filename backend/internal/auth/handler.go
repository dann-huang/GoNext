package auth

import (
	"encoding/json"
	"errors"
	"gonext/internal/config"
	"gonext/internal/mdw"
	"gonext/internal/model"
	"gonext/internal/repo"
	"gonext/pkg/util"
	"log/slog"
	"net/http"
	"time"

	"github.com/go-playground/validator/v10"
)

type handler interface {
	indexHandler() http.HandlerFunc
	registerHandler() http.HandlerFunc
	logoutHandler() http.HandlerFunc
	refreshHandler() http.HandlerFunc
	setupEmailHandler() http.HandlerFunc
	verifyEmailHandler() http.HandlerFunc
	changePasswordHandler() http.HandlerFunc
}

func newHandler(service service, config *config.Auth) handler {
	return &handlerImpl{
		service:  service,
		cfg:      config,
		validate: validator.New(),
	}
}

type handlerImpl struct {
	service  service
	cfg      *config.Auth
	validate *validator.Validate
}

func (h *handlerImpl) indexHandler() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		util.RespondJSON(w, http.StatusOK, map[string]string{"message": "Auth is running"})
	}
}

func (h *handlerImpl) setAuthCookie(w http.ResponseWriter, name, value, path string, expires time.Time) {
	http.SetCookie(w, &http.Cookie{
		Name:  name,
		Value: value,
		// Quoted,
		Path: path,
		// Domain:  h.cfg.Domain, // not needed when share domains apparently
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
		var req model.UserNames
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			util.RespondErr(w, http.StatusBadRequest, "Invalid request", err)
			return
		}

		if err := validator.New(validator.WithRequiredStructEnabled()).Struct(req); err != nil {
			util.RespondErr(w, http.StatusBadRequest, "Validation failed", err)
			return
		}

		result, err := h.service.createGuest(r.Context(), req.Username, req.DisplayName)
		if err != nil {
			if errors.Is(err, repo.ErrAlreadyExists) {
				util.RespondErr(w, http.StatusConflict, "Username already taken", nil)
			} else {
				slog.Error("failed to create user", "error", err)
				util.RespondErr(w, http.StatusInternalServerError, "Failed to create user", nil)
			}
			return
		}

		h.setAuthCookie(w, "access_token", result.access, "/", time.Now().Add(24*time.Hour))
		h.setAuthCookie(w, "refresh_token", result.refresh, "/auth/refresh", time.Now().Add(7*24*time.Hour))

		util.RespondJSON(w, http.StatusCreated, result.user.ToResponse())
	}
}

func (h *handlerImpl) logoutHandler() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		cookie, err := r.Cookie("refresh_token")
		if err != nil {
			util.RespondErr(w, http.StatusBadRequest, "No refresh token provided", nil)
			return
		}

		if err := h.service.logoutUser(r.Context(), cookie.Value); err != nil {
			slog.Error("failed to logout user", "error", err)
			util.RespondErr(w, http.StatusInternalServerError, "Failed to logout", nil)
			return
		}

		h.setAuthCookie(w, "access_token", "", "/", time.Unix(0, 0))
		h.setAuthCookie(w, "refresh_token", "", "/auth/refresh", time.Unix(0, 0))

		util.RespondJSON(w, http.StatusOK, map[string]string{"message": "Successfully logged out"})
	}
}

func (h *handlerImpl) refreshHandler() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		cookie, err := r.Cookie("refresh_token")
		if err != nil {
			util.RespondErr(w, http.StatusBadRequest, "No refresh token provided", nil)
			return
		}

		result, err := h.service.refreshUser(r.Context(), cookie.Value)
		if err != nil {
			slog.Error("failed to refresh token", "error", err)
			util.RespondErr(w, http.StatusUnauthorized, "Invalid refresh token", nil)
			return
		}

		h.setAuthCookie(w, "access_token", result.access, "/", time.Now().Add(24*time.Hour))
		h.setAuthCookie(w, "refresh_token", result.refresh, "/auth/refresh", time.Now().Add(7*24*time.Hour))

		util.RespondJSON(w, http.StatusOK, result.user.ToResponse())
	}
}

func (h *handlerImpl) setupEmailHandler() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		user := mdw.GetUser(r.Context())
		if user == nil {
			util.RespondErr(w, http.StatusUnauthorized, "User not authenticated", nil)
			return
		}

		var req model.SetupEmail
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			slog.Error("failed to decode request body", "error", err)
			util.RespondErr(w, http.StatusBadRequest, "Invalid request body", nil)
			return
		}

		if err := h.validate.Struct(req); err != nil {
			util.RespondErr(w, http.StatusBadRequest, "Invalid email address", nil)
			return
		}

		if err := h.service.setupEmail(r.Context(), user.UserID, req.Email); err != nil {
			slog.Error("failed to initiate upgrade", "error", err)
			util.RespondErr(w, http.StatusInternalServerError, "Failed to initiate upgrade", nil)
			return
		}

		util.RespondJSON(w, http.StatusOK, map[string]string{
			"message": "Verification email sent",
		})
	}
}

func (h *handlerImpl) verifyEmailHandler() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		user := mdw.GetUser(r.Context())
		if user == nil {
			util.RespondErr(w, http.StatusUnauthorized, "User not authenticated", nil)
			return
		}

		var req model.VerifyEmail
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			util.RespondErr(w, http.StatusBadRequest, "Invalid request", err)
			return
		}

		if err := h.validate.Struct(req); err != nil {
			util.RespondErr(w, http.StatusBadRequest, "Validation failed", err)
			return
		}

		result, err := h.service.verifyEmail(r.Context(), user.UserID, req.Code)
		if err != nil {
			if errors.Is(err, ErrInvalidCode) {
				util.RespondErr(w, http.StatusBadRequest, "Invalid or expired verification code", nil)
			} else {
				util.RespondErr(w, http.StatusInternalServerError, "Failed to verify email", err)
			}
			return
		}

		h.setAuthCookie(w, "access_token", result.access, "/", time.Now().Add(24*time.Hour))
		h.setAuthCookie(w, "refresh_token", result.refresh, "/auth/refresh", time.Now().Add(7*24*time.Hour))

		util.RespondJSON(w, http.StatusOK, result.user.ToResponse())
	}
}

func (h *handlerImpl) changePasswordHandler() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		user := mdw.GetUser(r.Context())
		if user == nil {
			util.RespondErr(w, http.StatusUnauthorized, "User not authenticated", nil)
			return
		}
		var req model.UserPass
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			util.RespondErr(w, http.StatusBadRequest, "Invalid request", err)
			return
		}
		if err := h.validate.Struct(req); err != nil {
			util.RespondErr(w, http.StatusBadRequest, "Validation failed", err)
			return
		}

		if err := h.service.setPassword(r.Context(), user.UserID, req.CurrentPass, req.NewPass); err != nil {
			slog.Error("failed to set password", "error", err)
			switch err.Error() {
			case "current password is required":
				util.RespondErr(w, http.StatusBadRequest, err.Error(), nil)
			case "invalid current password":
				util.RespondErr(w, http.StatusUnauthorized, err.Error(), nil)
			default:
				util.RespondErr(w, http.StatusInternalServerError, "Failed to set password", nil)
			}
			return
		}

		util.RespondJSON(w, http.StatusOK, map[string]string{
			"message": "Password updated successfully",
		})
	}
}
