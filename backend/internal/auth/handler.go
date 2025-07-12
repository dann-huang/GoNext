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
	guestHandler() http.HandlerFunc
	logoutHandler() http.HandlerFunc
	refreshHandler() http.HandlerFunc

	emailCodeHandler() http.HandlerFunc
	emailLoginHandler() http.HandlerFunc
	loginHandler() http.HandlerFunc

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
	cookie := &http.Cookie{
		Name:     name,
		Value:    value,
		Path:     path,
		Expires:  expires,
		HttpOnly: true,
		Secure:   false,
		SameSite: http.SameSiteLaxMode,
	}

	if h.cfg.Domain != "" {
		cookie.Domain = h.cfg.Domain
	}

	http.SetCookie(w, cookie)
}

func (h *handlerImpl) setAuthCookies(w http.ResponseWriter, accessToken, refreshToken string) time.Time {
	h.setAuthCookie(
		w,
		h.cfg.RefCookieName,
		refreshToken,
		"/api/auth/refresh",
		time.Now().Add(h.cfg.RefTTL),
	)
	expires := time.Now().Add(h.cfg.AccTTL)
	h.setAuthCookie(
		w,
		h.cfg.AccCookieName,
		accessToken,
		"/",
		expires,
	)
	return expires
}

func (h *handlerImpl) decodeValidate(w http.ResponseWriter, r *http.Request, v any) bool {
	if err := json.NewDecoder(r.Body).Decode(v); err != nil {
		util.RespondErr(w, http.StatusBadRequest, "Invalid request", err)
		return false
	}
	if err := h.validate.Struct(v); err != nil {
		util.RespondErr(w, http.StatusBadRequest, "Validation failed", err)
		return false
	}
	return true
}

func (h *handlerImpl) guestHandler() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req model.UserNames
		if !h.decodeValidate(w, r, &req) {
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

		expires := h.setAuthCookies(w, result.access, result.refresh)
		util.RespondJSON(w, http.StatusCreated, result.user.ToAuthResponse(expires))
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

		expires := h.setAuthCookies(w, result.access, result.refresh)
		util.RespondJSON(w, http.StatusOK, result.user.ToAuthResponse(expires))
	}
}

func (h *handlerImpl) setupEmailHandler() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		user := mdw.GetUser(r.Context())
		if user == nil {
			util.RespondErr(w, http.StatusUnauthorized, "User not authenticated", nil)
			return
		}

		var req model.Email
		if !h.decodeValidate(w, r, &req) {
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
		if !h.decodeValidate(w, r, &req) {
			return
		}

		result, err := h.service.verifyEmail(r.Context(), user.UserID, req.Code)
		if err != nil {
			if errors.Is(err, ErrInvalidCode) {
				util.RespondErr(w, http.StatusBadRequest, "Invalid or expired verification code", nil)
			} else if errors.Is(err, ErrAlreadySet) {
				util.RespondErr(w, http.StatusBadRequest, "Email is already set", nil)
			} else {
				util.RespondErr(w, http.StatusInternalServerError, "Failed to verify email", err)
			}
			return
		}

		expires := h.setAuthCookies(w, result.access, result.refresh)
		util.RespondJSON(w, http.StatusOK, result.user.ToAuthResponse(expires))
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
		if !h.decodeValidate(w, r, &req) {
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

func (h *handlerImpl) emailCodeHandler() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req model.Email
		if !h.decodeValidate(w, r, &req) {
			return
		}

		if err := h.service.sendEmailCode(r.Context(), req.Email); err != nil && !errors.Is(err, repo.ErrAlreadyExists) {
			slog.Error("failed to send email code", "error", err, "email", req.Email)
		}
		util.RespondJSON(w, http.StatusOK, map[string]string{"message": "Email may be sent"})
	}
}

func (h *handlerImpl) emailLoginHandler() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req model.EmailLogin
		if !h.decodeValidate(w, r, &req) {
			slog.Info("email login validation failed", "email", req.Email)
			return
		}

		result, err := h.service.loginWithEmailCode(r.Context(), req.Email, req.Code)
		if err != nil {
			slog.Info("email code login failed", "email", req.Email, "error", err)
			util.RespondErr(w, http.StatusUnauthorized, "Invalid or expired code", nil)
			return
		}

		expires := h.setAuthCookies(w, result.access, result.refresh)
		util.RespondJSON(w, http.StatusOK, result.user.ToAuthResponse(expires))
	}
}

func (h *handlerImpl) loginHandler() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req model.PasswordLogin
		if !h.decodeValidate(w, r, &req) {
			return
		}
		result, err := h.service.loginWithPassword(r.Context(), req.Email, req.Password)
		if err != nil {
			util.RespondErr(w, http.StatusUnauthorized, "Invalid email or password", nil)
			return
		}
		expires := h.setAuthCookies(w, result.access, result.refresh)
		util.RespondJSON(w, http.StatusOK, result.user.ToAuthResponse(expires))
	}
}
