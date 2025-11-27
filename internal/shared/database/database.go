package database

import (
	"database/sql"
	"fmt"

	"sysocial/internal/shared/config"

	_ "github.com/lib/pq"
)

// Connect estabelece conexão com o banco de dados
func Connect(cfg config.DatabaseConfig) (*sql.DB, error) {
	dsn := fmt.Sprintf("host=%s port=%d user=%s password=%s dbname=%s sslmode=%s",
		cfg.Host, cfg.Port, cfg.User, cfg.Password, cfg.Name, cfg.SSLMode)

	db, err := sql.Open("postgres", dsn)
	if err != nil {
		return nil, fmt.Errorf("erro ao abrir conexão com o banco: %w", err)
	}

	// Testar conexão
	if err := db.Ping(); err != nil {
		return nil, fmt.Errorf("erro ao conectar com o banco: %w", err)
	}

	// Configurar pool de conexões
	db.SetMaxOpenConns(25)
	db.SetMaxIdleConns(5)

	return db, nil
}

// Close fecha a conexão com o banco de dados
func Close(db *sql.DB) error {
	if db != nil {
		return db.Close()
	}
	return nil
}
