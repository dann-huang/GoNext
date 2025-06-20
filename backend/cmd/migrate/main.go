package setupdb

import (
	"database/sql"
	"fmt"
	"letsgo/internal/db"
	"log"

	"letsgo/internal/config"

	_ "github.com/lib/pq" // PostgreSQL driver
)

func RunInitialSchema(db *sql.DB) error {
	const createTableSQL = `
    CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        displayname VARCHAR(255) NOT NULL DEFAULT '',
        passhash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
    );`

	log.Println("Applying initial schema...")
	_, err := db.Exec(createTableSQL)
	if err != nil {
		return fmt.Errorf("failed to create users table: %w", err)
	}
	log.Println("Users table created or already exists.")
	return nil
}

//nolint:unused
func main() {
	appConfig, err := config.Load()
	if err != nil {
		panic(err)
	}
	db, _, err := db.Open(appConfig.DB)
	if err != nil {
		log.Fatalf("Error opening database: %v", err)
	}
	defer db.Close()

	if err = db.Ping(); err != nil {
		log.Fatalf("Error connecting to database: %v", err)
	}

	if err := RunInitialSchema(db); err != nil {
		log.Fatalf("Error running initial schema: %v", err)
	}
	log.Println("Database setup complete.")
}
