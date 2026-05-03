package database

import (
	"context"
	"database/sql"
	"time"
)

type GuestUserModel struct {
	DB *sql.DB
}

type GuestUser struct {
	ID        int    `json:"id"`
	Username  string `json:"username"`
	Token     string `json:"token"`
	RankID    *int   `json:"rank_id"`
	Location  string `json:"location"`
	IPAddress string `json:"ip_address"`
	CreatedAt string `json:"created_at"`
}

func (m *GuestUserModel) Insert(guest_user *GuestUser) error {
	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()

	query := `INSERT INTO guest_users (username, token, rank_id, ip_address) VALUES (?, ?, ?, ?)`

	_, err := m.DB.ExecContext(ctx, query, guest_user.Username, guest_user.Token, guest_user.RankID, guest_user.IPAddress)
	if err != nil {
		return err
	}

	return nil
}
