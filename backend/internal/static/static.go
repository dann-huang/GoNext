package static

import (
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"strings"
)

func SPAHandler(staticDir string) http.HandlerFunc {
	fs := http.FileServer(http.Dir(staticDir))
	return func(w http.ResponseWriter, r *http.Request) {
		path := filepath.Join(staticDir, r.URL.Path)
		if info, err := os.Stat(path); err == nil && !info.IsDir() {
			fs.ServeHTTP(w, r)
			return
		}
		http.ServeFile(w, r, filepath.Join(staticDir, "index.html"))
	}
}

// todo: remove. Only for testing.
func TestPageHandler(staticDir string) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		page := strings.TrimPrefix(r.URL.Path, "/test/")
		pagePath := filepath.Join(staticDir, "test", page)

		if _, err := os.Stat(pagePath); err == nil {
			http.ServeFile(w, r, pagePath)
			return
		}
		// If no extension, try .html
		if !strings.Contains(filepath.Base(page), ".") {
			pagePathHTML := pagePath + ".html"
			if _, err := os.Stat(pagePathHTML); err == nil {
				http.ServeFile(w, r, pagePathHTML)
				return
			}
		}
		w.WriteHeader(http.StatusNotFound)
		fmt.Fprintf(w, "Test page not found: %s", page)
	}
}
