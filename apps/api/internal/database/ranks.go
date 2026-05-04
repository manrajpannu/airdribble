package database

import (
	"context"
	"database/sql"
	"time"
)

type RankModel struct {
	DB *sql.DB
}

type Rank struct {
	ID         int           `json:"id"`
	Name       string        `json:"name" binding:"required"`
	TierNumber sql.NullInt64 `json:"tier_number"`
	Division   sql.NullInt64 `json:"division"`
}

func (m *RankModel) Insert(rank *Rank) error {
	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()

	query := `INSERT INTO ranks (tier, tier_number, division) VALUES (?, ?, ?)`

	result, err := m.DB.ExecContext(ctx, query, rank.Name, rank.TierNumber, rank.Division)
	if err != nil {
		return err
	}
	id, err := result.LastInsertId()
	if err != nil {
		return err
	}
	rank.ID = int(id)
	return nil
}

func (m *RankModel) GetAll() ([]*Rank, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()

	query := `SELECT id, tier, tier_number, division FROM ranks`

	rows, err := m.DB.QueryContext(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	ranks := []*Rank{}
	for rows.Next() {
		var rank Rank
		err := rows.Scan(&rank.ID, &rank.Name, &rank.TierNumber, &rank.Division)
		if err != nil {
			return nil, err
		}
		ranks = append(ranks, &rank)
	}

	if err = rows.Err(); err != nil {
		return nil, err
	}

	return ranks, nil
}

func (m *RankModel) Get(id int) (*Rank, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()

	query := `SELECT id, tier, tier_number, division FROM ranks WHERE id = ?`

	var rank Rank

	err := m.DB.QueryRowContext(ctx, query, id).Scan(
		&rank.ID,
		&rank.Name,
		&rank.TierNumber,
		&rank.Division,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		} else {
			return nil, err
		}
	}

	return &rank, nil

}

func (m *RankModel) Delete(id int) error {
	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()

	query := `DELETE FROM ranks WHERE id = ?`

	_, err := m.DB.ExecContext(ctx, query, id)
	if err != nil {
		return err
	}
	return nil
}
