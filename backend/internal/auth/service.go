package auth

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"time"

	"letsgo/internal/config"
	"letsgo/internal/user"
	"letsgo/pkg/jwt"
	"letsgo/pkg/util"

	gjwt "github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	_ "github.com/lib/pq"
	"github.com/redis/go-redis/v9"
)

type AuthService struct {
	db         *sql.DB
	rdb        *redis.Client
	jwtManager *jwt.JWTManager
	cfg        *config.Auth
}

func NewAuthService(db *sql.DB, rdb *redis.Client, jwt *jwt.JWTManager, cfg *config.Auth) *AuthService {
	return &AuthService{
		db:         db,
		rdb:        rdb,
		jwtManager: jwt,
		cfg:        cfg,
	}
}

func (s *AuthService) setAuthCookie(w http.ResponseWriter,
	name, value, path string, expires time.Time) {
	http.SetCookie(w, &http.Cookie{
		Name:     name,
		Value:    value,
		Expires:  expires,
		HttpOnly: true,
		Secure:   true,
		SameSite: http.SameSiteLaxMode,
		Domain:   s.cfg.Domain,
		Path:     path,
	})
}

type UserRequest struct {
	Name string `json:"name"`
	Pass string `json:"pass"`
}

type LoginResponse struct {
	AccessToken string `json:"accessToken"`
	Message     string `json:"message"`

	//for testing
	AccessTokenExpiresAt  string `json:"accessTokenExpiresAt"`
	RefreshTokenExpiresAt string `json:"refreshTokenExpiresAt"`
	UserID                string `json:"userId"`
}

func (s *AuthService) RegisterHandler() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req UserRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			util.RespondJSON(w, http.StatusBadRequest,
				map[string]string{"error": "Invalid request"})
			return
		}

		_, err := user.GetUserByName(r.Context(), s.db, req.Name)
		if err == nil {
			util.RespondJSON(w, http.StatusConflict,
				map[string]string{"error": "Username already taken"})
			return
		}
		if err != sql.ErrNoRows {
			fmt.Println("Error checking user:", err)
			util.RespondJSON(w, http.StatusInternalServerError,
				map[string]string{"error": "Something went wrong"})
			return
		}
		usr, err := user.CreateUser(r.Context(), s.db, req.Name, req.Pass)
		if err != nil {
			util.RespondJSON(w, http.StatusInternalServerError,
				map[string]string{"error": "Something went wrong; failed to create user"})
			return
		}

		util.RespondJSON(w, http.StatusOK, map[string]string{
			"message":  "Success",
			"userId":   strconv.FormatInt(usr.ID, 10),
			"username": usr.Name,
		})
	}
}

func (s *AuthService) IndexHandler() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(`{"message": "Auth is running"}`))
	}
}

func (s *AuthService) LoginHandler() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var req UserRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			util.RespondJSON(w, http.StatusBadRequest,
				map[string]string{"error": "Invalid request"})
			return
		}

		usr, err := user.GetUserByName(r.Context(), s.db, req.Name)
		if err == sql.ErrNoRows {
			util.RespondJSON(w, http.StatusUnauthorized,
				map[string]string{"error": "Invalid username or password"})
			return
		} else if err != nil {
			util.RespondJSON(w, http.StatusInternalServerError,
				map[string]string{"error": "Something went wrong"})
			return
		}
		if !usr.VerifyPassword(req.Pass) {
			util.RespondJSON(w, http.StatusUnauthorized,
				map[string]string{"error": "Invalid username or password"})
			return
		}

		usrId := strconv.FormatInt(usr.ID, 10)
		claims := gjwt.MapClaims{
			"sub": usrId,
		}

		accessToken, err := s.jwtManager.GenerateToken(claims, nil)
		if err != nil {
			util.RespondJSON(w, http.StatusInternalServerError,
				map[string]string{"error": "Access token generation failed"})
			return
		}

		refreshToken := uuid.New().String()
		ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
		defer cancel()

		err = s.rdb.Set(ctx, refreshToken, usr.ID, s.cfg.RefreshTokenTTL).Err()
		if err != nil {
			util.RespondJSON(w, http.StatusInternalServerError,
				map[string]string{"error": "Refresh token storage failed"})
			return
		}

		s.setAuthCookie(w, s.cfg.AccessCookieName, accessToken, "/",
			time.Now().Add(s.cfg.AccessTokenTTL))
		s.setAuthCookie(w, s.cfg.RefreshCookieName, refreshToken, "/auth/refresh",
			time.Now().Add(s.cfg.RefreshTokenTTL))

		util.RespondJSON(w, http.StatusOK, LoginResponse{
			Message:               "Login successful",
			AccessToken:           accessToken,
			AccessTokenExpiresAt:  time.Now().Add(s.cfg.AccessTokenTTL).Format(time.RFC3339),
			RefreshTokenExpiresAt: time.Now().Add(s.cfg.RefreshTokenTTL).Format(time.RFC3339),
			UserID:                strconv.FormatInt(usr.ID, 10),
		})
	}
}

func (s *AuthService) LogoutHandler() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		refreshTokenCookie, err := r.Cookie(s.cfg.RefreshCookieName)
		if err == nil {
			ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
			defer cancel()
			s.rdb.Del(ctx, refreshTokenCookie.Value).Err()

			s.setAuthCookie(w, s.cfg.AccessCookieName, "", "/", time.Unix(0, 0))
			s.setAuthCookie(w, s.cfg.RefreshCookieName, "", "/auth/refresh", time.Unix(0, 0))
		}
		util.RespondJSON(w, http.StatusOK,
			map[string]string{"message": "Logged out successfully"})
	}
}

func (s *AuthService) RefreshHandler() http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		refreshCookie, err := r.Cookie(s.cfg.RefreshCookieName)
		if err != nil {
			if err == http.ErrNoCookie {
				util.RespondJSON(w, http.StatusUnauthorized,
					map[string]string{"error": "No refresh token"})
				return
			}
			util.RespondJSON(w, http.StatusBadRequest,
				map[string]string{"error": "Invalid request"})
			return
		}

		oldRefreshToken := refreshCookie.Value
		ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
		defer cancel()

		userIDStr, err := s.rdb.Get(ctx, oldRefreshToken).Result()
		if err == redis.Nil {
			util.RespondJSON(w, http.StatusUnauthorized,
				map[string]string{"error": "Token does not exist"})
			return
		}
		if err != nil {
			util.RespondJSON(w, http.StatusInternalServerError,
				map[string]string{"error": "Server error"})
			return
		}
		s.rdb.Del(ctx, oldRefreshToken)

		claims := gjwt.MapClaims{
			"sub": userIDStr,
		}
		accessToken, err := s.jwtManager.GenerateToken(claims, nil)
		if err != nil {
			util.RespondJSON(w, http.StatusInternalServerError,
				map[string]string{"error": "Access token generation failed"})
			return
		}

		refreshToken := uuid.New().String()
		err = s.rdb.Set(ctx, refreshToken, userIDStr, s.cfg.RefreshTokenTTL).Err()
		if err != nil {
			util.RespondJSON(w, http.StatusInternalServerError,
				map[string]string{"error": "Failed to store new refresh token"})
			return
		}

		s.setAuthCookie(w, s.cfg.AccessCookieName, accessToken, "/",
			time.Now().Add(s.cfg.AccessTokenTTL))
		s.setAuthCookie(w, s.cfg.RefreshCookieName, refreshToken, "/auth/refresh",
			time.Now().Add(s.cfg.RefreshTokenTTL))

		util.RespondJSON(w, http.StatusOK, map[string]string{
			"message":     "Tokens refreshed successfully",
			"accessToken": accessToken,
		})
	}
}
