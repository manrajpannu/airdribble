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
	ID        int     `json:"id"`
	Username  string  `json:"username"`
	Token     string  `json:"token"`
	RankID    *int    `json:"rank_id"`
	Location  *string `json:"location"`
	IPAddress   *string `json:"ip_address"`
	GamesPlayed int     `json:"games_played"`
	Shots       int     `json:"shots"`
	Kills       int     `json:"kills"`
	CreatedAt   *string `json:"created_at"`
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

func (m *GuestUserModel) Update(guest_user *GuestUser) error {
	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()

	query := `UPDATE guest_users SET username = ?, rank_id = ? WHERE token = ?`

	_, err := m.DB.ExecContext(ctx, query, guest_user.Username, guest_user.RankID, guest_user.Token)
	if err != nil {
		return err
	}

	return nil
}

func (m *GuestUserModel) GetByToken(token string) (*GuestUser, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()

	query := `SELECT id, username, token, rank_id, location, ip_address, games_played, shots, kills, created_at FROM guest_users WHERE token = ?`

	var guest_user GuestUser
	err := m.DB.QueryRowContext(ctx, query, token).Scan(
		&guest_user.ID,
		&guest_user.Username,
		&guest_user.Token,
		&guest_user.RankID,
		&guest_user.Location,
		&guest_user.IPAddress,
		&guest_user.GamesPlayed,
		&guest_user.Shots,
		&guest_user.Kills,
		&guest_user.CreatedAt,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}

	return &guest_user, nil
}

func (m *GuestUserModel) IncrementStats(token string, shots, kills int) error {
	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()

	query := `
		UPDATE guest_users 
		SET games_played = games_played + 1,
		    shots = shots + ?,
		    kills = kills + ?
		WHERE token = ?
	`

	_, err := m.DB.ExecContext(ctx, query, shots, kills, token)
	return err
}
