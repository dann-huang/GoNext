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

// setAuthCookie sets an HTTP-only cookie with the given name, value, and expiration
func (h *handlerImpl) setAuthCookie(w http.ResponseWriter, name, value, path string, expires time.Time) {
	cookie := &http.Cookie{
		Name:     name,
		Value:    value,
		Path:     path,
		Expires:  expires,
		HttpOnly: true,
		Secure:   false, // Set based on your environment
		SameSite: http.SameSiteLaxMode,
	}

	if h.cfg.Domain != "" {
		cookie.Domain = h.cfg.Domain
	}

	http.SetCookie(w, cookie)
}

// setAuthCookies sets both access and refresh token cookies
func (h *handlerImpl) setAuthCookies(w http.ResponseWriter, accessToken, refreshToken string, expiresIn int) {
	// Set access token cookie (short-lived)
	h.setAuthCookie(
		w,
		h.cfg.AccCookieName, // Use configured cookie name
		accessToken,
		"/",
		time.Now().Add(time.Duration(expiresIn)*time.Second),
	)

	// Set refresh token cookie (long-lived)
	h.setAuthCookie(
		w,
		h.cfg.RefCookieName, // Use configured cookie name
		refreshToken,
		"/api/auth/refresh",
		time.Now().Add(h.cfg.RefTTL*time.Second), // Use configured TTL
	)
}

func (h *handlerImpl) guestHandler() http.HandlerFunc {
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

		accessExpires := time.Now().Add(h.cfg.AccTTL)
		h.setAuthCookie(w, "access_token", result.access, "/", accessExpires)
		h.setAuthCookie(w, "refresh_token", result.refresh, "/auth/refresh", time.Now().Add(h.cfg.RefTTL))

		util.RespondJSON(w, http.StatusCreated, result.user.ToAuthResponse(accessExpires))
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

		accessExpires := time.Now().Add(h.cfg.AccTTL)
		h.setAuthCookie(w, "access_token", result.access, "/", accessExpires)
		h.setAuthCookie(w, "refresh_token", result.refresh, "/auth/refresh", time.Now().Add(h.cfg.RefTTL))

		util.RespondJSON(w, http.StatusOK, result.user.ToAuthResponse(accessExpires))
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

		accessExpires := time.Now().Add(h.cfg.AccTTL)
		h.setAuthCookie(w, "access_token", result.access, "/", accessExpires)
		h.setAuthCookie(w, "refresh_token", result.refresh, "/auth/refresh", time.Now().Add(h.cfg.RefTTL))

		util.RespondJSON(w, http.StatusOK, result.user.ToAuthResponse(accessExpires))
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

// emailCodeHandler handles requests to send a login code to an email
func (h *handlerImpl) emailCodeHandler() http.HandlerFunc {
	type request struct {
		Email string `json:"email" validate:"required,email"`
	}

	return func(w http.ResponseWriter, r *http.Request) {
		var req request
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			util.RespondErr(w, http.StatusBadRequest, "Invalid request", err)
			return
		}

		if err := h.validate.Struct(req); err != nil {
			util.RespondErr(w, http.StatusBadRequest, "Validation failed", err)
			return
		}

		// Send the login code via email
		if err := h.service.sendEmailCode(r.Context(), req.Email); err != nil {
			slog.Error("failed to send email code", "error", err, "email", req.Email)
			// Don't leak information about whether the email exists
			util.RespondErr(w, http.StatusOK, "If the email is registered, you will receive a login code", nil)
			return
		}

		util.RespondJSON(w, http.StatusOK, map[string]string{
			"message": "If the email is registered, you will receive a login code",
		})
	}
}

// emailLoginHandler handles login with email and code
func (h *handlerImpl) emailLoginHandler() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req struct {
			Email string `json:"email" validate:"required,email"`
			Code  string `json:"code" validate:"required"`
		}

		// Decode and validate request
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			slog.Error("failed to decode email login request", "error", err)
			util.RespondErr(w, http.StatusBadRequest, "Invalid request", nil)
			return
		}

		if err := h.validate.Struct(req); err != nil {
			slog.Info("email login validation failed", "email", req.Email, "error", err)
			util.RespondErr(w, http.StatusBadRequest, "Invalid input", nil)
			return
		}

		// Attempt login with email code
		result, err := h.service.loginWithEmailCode(r.Context(), req.Email, req.Code)
		if err != nil {
			slog.Info("email code login failed", "email", req.Email, "error", err)
			util.RespondErr(w, http.StatusUnauthorized, "Invalid or expired code", nil)
			return
		}

		// Convert token TTL to seconds for the cookie
		expiresIn := int(h.cfg.AccTTL.Seconds())

		// Set auth cookies
		h.setAuthCookies(w, result.access, result.refresh, expiresIn)

		// Log successful login
		slog.Info("successful email code login", "user_id", result.user.ID, "email", req.Email)

		// Return success response
		util.RespondJSON(w, http.StatusOK, map[string]interface{}{
			"user":          result.user,
			"access_token":  result.access,
			"expires_in":    expiresIn,
			"refresh_token": result.refresh,
		})
	}
}

// loginHandler handles login with email and password
func (h *handlerImpl) loginHandler() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req struct {
			Email    string `json:"email" validate:"required,email"`
			Password string `json:"password" validate:"required"`
		}

		// Decode and validate request
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			slog.Error("failed to decode login request", "error", err)
			util.RespondErr(w, http.StatusBadRequest, "Invalid request", nil)
			return
		}

		if err := h.validate.Struct(req); err != nil {
			slog.Info("login validation failed", "email", req.Email, "error", err)
			util.RespondErr(w, http.StatusBadRequest, "Invalid input", nil)
			return
		}

		// Attempt login with email and password
		result, err := h.service.loginWithPassword(r.Context(), req.Email, req.Password)
		if err != nil {
			slog.Info("password login failed", "email", req.Email, "error", err)
			util.RespondErr(w, http.StatusUnauthorized, "Invalid email or password", nil)
			return
		}

		// Convert token TTL to seconds for the cookie
		expiresIn := int(h.cfg.AccTTL.Seconds())

		// Set auth cookies
		h.setAuthCookies(w, result.access, result.refresh, expiresIn)

		// Log successful login
		slog.Info("successful password login", "user_id", result.user.ID, "email", req.Email)

		// Return success response
		util.RespondJSON(w, http.StatusOK, map[string]interface{}{
			"user":          result.user,
			"access_token":  result.access,
			"expires_in":    expiresIn,
			"refresh_token": result.refresh,
		})
	}
}
