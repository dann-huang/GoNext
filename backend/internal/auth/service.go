package auth

import (
	"context"
	"database/sql"
	"encoding/json"
	"net/http"
	"strconv"
	"time"

	"letsgo/internal/config"
	"letsgo/internal/user"
	"letsgo/internal/util"

	"github.com/google/uuid"
	_ "github.com/lib/pq"
	"github.com/redis/go-redis/v9"
)

type AuthService struct {
	db  *sql.DB
	rdb *redis.Client
	jwt *JWTManager
	cfg *config.Auth
}

func NewAuthService(db *sql.DB, rdb *redis.Client, jwt *JWTManager, cfg *config.Auth) *AuthService {
	return &AuthService{
		db:  db,
		rdb: rdb,
		jwt: jwt,
		cfg: cfg,
	}
}

type LoginRequest struct {
	Name string `json:"name"` // Or "username", depending on your user model
	Pass string `json:"pass"`
}

type LoginResponse struct {
	AccessToken string `json:"accessToken"`
	Message     string `json:"message"`
}

func (s *AuthService) LoginHandler() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req LoginRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			util.RespondJSON(w, http.StatusBadRequest,
				map[string]string{"error": "Invalid request payload"})
			return
		}

		usr, err := user.GetUserByName(r.Context(), s.db, req.Name)
		if err == nil {
			if !usr.VerifyPassword(req.Pass) {
				util.RespondJSON(w, http.StatusUnauthorized,
					map[string]string{"error": "Name taken or wrong password"})
				return
			} else {
				// user doesn't exist, create a new user
				usr, err = user.CreateUser(r.Context(), s.db, req.Name, req.Pass)
				if err != nil {
					util.RespondJSON(w, http.StatusInternalServerError,
						map[string]string{"error": "Something went wrong; failed to create user"})
					return
				}
			}
		}

		// Generate JWT token
		accessToken, err := s.jwt.GenerateAccessToken(strconv.FormatInt(usr.ID, 10))
		if err != nil {
			util.RespondJSON(w, http.StatusInternalServerError,
				map[string]string{"error": "Failed to generate access token"})
			return
		}

		refreshToken := uuid.New().String()                            // Generate a UUID for the refresh token
		ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second) // Context with timeout for Redis ops
		defer cancel()

		err = s.rdb.Set(ctx, refreshToken, usr.ID, s.cfg.RefreshTokenTTL).Err() // Store refresh token in Redis
		if err != nil {
			util.RespondJSON(w, http.StatusInternalServerError,
				map[string]string{"error": "Failed to store refresh token"})
			return
		}

		// 3. Set Cookies
		http.SetCookie(w, &http.Cookie{
			Name:     s.cfg.AccessCookieName,
			Value:    accessToken,
			Expires:  time.Now().Add(s.cfg.AccessTokenTTL),
			HttpOnly: true,
			Secure:   true,
			SameSite: http.SameSiteLaxMode,
			Domain:   s.cfg.Domain,
			Path:     "/",
		})

		http.SetCookie(w, &http.Cookie{
			Name:     s.cfg.AccessCookieName,
			Value:    refreshToken,
			Expires:  time.Now().Add(s.cfg.RefreshTokenTTL),
			HttpOnly: true,
			Secure:   true,
			SameSite: http.SameSiteLaxMode,
			Domain:   s.cfg.Domain,
			Path:     "/auth/refresh", // need to create refresh endpoint
		})

		util.RespondJSON(w, http.StatusOK, LoginResponse{
			AccessToken: accessToken,
			Message:     "Login successful",
		})
	}
}

func (s *AuthService) LogoutHandler() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		refreshTokenCookie, err := r.Cookie(s.cfg.AccessCookieName)
		if err != nil {
			return
		}

		ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
		defer cancel()
		if err := s.rdb.Del(ctx, refreshTokenCookie.Value).Err(); err != nil {
			// fail to delete token from redis. Not sure what do
		}

		http.SetCookie(w, &http.Cookie{
			Name:     s.cfg.AccessCookieName,
			Value:    "",
			Expires:  time.Unix(0, 0), // Expire in the past
			HttpOnly: true,
			Secure:   true,
			SameSite: http.SameSiteLaxMode,
			Domain:   s.cfg.Domain,
			Path:     "/",
		})

		http.SetCookie(w, &http.Cookie{
			Name:     s.cfg.RefreshCookieName,
			Value:    "",
			Expires:  time.Unix(0, 0), // Expire in the past
			HttpOnly: true,
			Secure:   true,
			SameSite: http.SameSiteLaxMode,
			Domain:   s.cfg.Domain,
			Path:     "/auth/refresh",
		})

		util.RespondJSON(w, http.StatusOK,
			map[string]string{"message": "Logged out successfully"})
	}
}
