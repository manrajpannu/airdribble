# RL-Dart API - Setup & Run Instructions

## Prerequisites
- **Go**: Version 1.25.1 or later
- **Git** (optional, for cloning)

## 1. Clone the Repository
```
git clone <repo-url>
cd rl-dart-api
```

## 2. Install Dependencies
```
go mod download
```

## 3. Configure Environment Variables
- Edit the `.env` file in the project root as needed. Example:
  ```
  PORT=8080
  JWT_SECRET=your_secret_key
  ENV=development
  CHALLENGE_DURATION=1h
  USER_DURATION=8766h
  ```

## 4. Run Database Migrations
```
go run ./cmd/migrate/main.go up
```
This will create and update the `data.db` SQLite database.

## 5. Start the API Server
```
go run ./cmd/api/main.go
```
The server will start on the port specified in `.env` (default: 8080).

## 6. Access the API
- Open your browser or API client and go to: [http://localhost:8080](http://localhost:8080)

## 7. Additional Notes
- To rollback migrations:
  ```
  go run ./cmd/migrate/main.go down
  ```
- API documentation is available in the `docs/` folder.

---

Feel free to ask for help if you encounter any issues!
