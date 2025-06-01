package main

import (
	"net/http"
	"os"
	"path/filepath"

	"github.com/go-chi/chi/v5"
)

func main() {
	r := chi.NewRouter()

	// API routes
	r.Route("/api", func(api chi.Router) {
		api.Get("/hello", func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Content-Type", "application/json")
			w.Write([]byte(`{"message": "Hello from API!"}`))
		})
	})

	// Test routes (serve specific static pages)
	r.Route("/test", func(test chi.Router) {
		test.Get("/page1", func(w http.ResponseWriter, r *http.Request) {
			http.ServeFile(w, r, filepath.Join("/app/static", "page1.html"))
		})
		test.Get("/page2", func(w http.ResponseWriter, r *http.Request) {
			http.ServeFile(w, r, filepath.Join("/app/static", "page2.html"))
		})
	})

	// Serve SPA static files (fallback)
	staticDir := "/app/static"
	fs := http.FileServer(http.Dir(staticDir))
	r.Handle("/*", spaHandler(staticDir, fs))

	http.ListenAndServe(":3000", r)
}

// spaHandler serves index.html for all non-file requests (SPA fallback)
func spaHandler(staticDir string, fs http.Handler) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		path := filepath.Join(staticDir, r.URL.Path)
		if info, err := os.Stat(path); err == nil && !info.IsDir() {
			fs.ServeHTTP(w, r)
			return
		}
		// Fallback to index.html for SPA routes
		http.ServeFile(w, r, filepath.Join(staticDir, "index.html"))
	}
}
