package middleware

import (
	"sync"
	"time"

	"github.com/gin-gonic/gin"
)

// ActiveTracker manages in-memory active user tracking with lazy cleanup.
// It is optimized for high request volume using a RWMutex.
type ActiveTracker struct {
	mu           sync.RWMutex
	users        map[string]time.Time
	window       time.Duration
	lastCleanup  time.Time
	cleanupInterval time.Duration
}

// NewActiveTracker creates a new tracker with a specified activity window.
func NewActiveTracker(window time.Duration) *ActiveTracker {
	return &ActiveTracker{
		users:           make(map[string]time.Time),
		window:          window,
		lastCleanup:     time.Now(),
		cleanupInterval: 1 * time.Minute, // Amortized cleanup frequency
	}
}

// MarkActive updates the last seen timestamp for a user.
// It performs a lazy cleanup if the cleanup interval has passed.
func (t *ActiveTracker) MarkActive(userID string) {
	t.mu.Lock()
	defer t.mu.Unlock()

	t.users[userID] = time.Now()

	// Lazy cleanup: avoid iterating on every single request.
	// Only cleanup if we haven't done so in the last 'cleanupInterval'.
	if time.Since(t.lastCleanup) > t.cleanupInterval {
		t.cleanup()
	}
}

// IsActive checks if a specific user has been seen within the window.
func (t *ActiveTracker) IsActive(userID string) bool {
	t.mu.RLock()
	lastSeen, exists := t.users[userID]
	t.mu.RUnlock()

	if !exists {
		return false
	}

	return time.Since(lastSeen) <= t.window
}

// GetActiveCount returns the number of users seen within the window.
// It performs an immediate cleanup to ensure accuracy.
func (t *ActiveTracker) GetActiveCount() int {
	t.mu.Lock()
	defer t.mu.Unlock()

	t.cleanup()
	return len(t.users)
}

// cleanup removes expired users from the map. 
// Must be called while holding a write lock.
func (t *ActiveTracker) cleanup() {
	now := time.Now()
	for id, lastSeen := range t.users {
		if now.Sub(lastSeen) > t.window {
			delete(t.users, id)
		}
	}
	t.lastCleanup = now
}

// TrackActiveUsers returns a middleware that updates the active status of authenticated users.
// It expects the user's unique identifier to be available as a cookie or context variable.
func TrackActiveUsers(tracker *ActiveTracker) gin.HandlerFunc {
	return func(c *gin.Context) {
		// In this app, we identify users by their 'user_token' cookie.
		// We could also use a userID from a JWT or session if available.
		token, err := c.Cookie("user_token")
		if err == nil && token != "" {
			tracker.MarkActive(token)
		}

		c.Next()
	}
}
