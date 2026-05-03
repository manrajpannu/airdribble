package middleware

import (
	"net/http"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
)

type ipRecord struct {
	count     int
	windowEnd time.Time
}

// RateLimiter holds the state for a single rate-limited route.
type RateLimiter struct {
	mu       sync.Mutex
	records  map[string]*ipRecord
	limit    int
	window   time.Duration
}

// NewRateLimiter creates a new rate limiter.
// limit  = max number of requests allowed per window per IP
// window = the rolling time window (e.g. 1*time.Hour)
func NewRateLimiter(limit int, window time.Duration) *RateLimiter {
	rl := &RateLimiter{
		records: make(map[string]*ipRecord),
		limit:   limit,
		window:  window,
	}
	// Background goroutine to clean up expired IPs and prevent memory leaks
	go rl.cleanup()
	return rl
}

// Middleware returns a Gin middleware function for this rate limiter.
func (rl *RateLimiter) Middleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		ip := c.ClientIP()

		rl.mu.Lock()
		record, exists := rl.records[ip]
		now := time.Now()

		if !exists || now.After(record.windowEnd) {
			// First request from this IP, or their window has expired — reset
			rl.records[ip] = &ipRecord{
				count:     1,
				windowEnd: now.Add(rl.window),
			}
			rl.mu.Unlock()
			c.Next()
			return
		}

		if record.count >= rl.limit {
			// IP has exceeded the limit within the window
			retryAfter := int(time.Until(record.windowEnd).Seconds())
			rl.mu.Unlock()
			c.Header("Retry-After", time.Now().Add(time.Duration(retryAfter)*time.Second).Format(time.RFC1123))
			c.JSON(http.StatusTooManyRequests, gin.H{
				"error":       "Too many requests — you can only create 3 guest accounts per hour.",
				"retry_after": retryAfter,
			})
			c.Abort()
			return
		}

		record.count++
		rl.mu.Unlock()
		c.Next()
	}
}

// cleanup removes expired entries every 10 minutes to keep memory usage low.
func (rl *RateLimiter) cleanup() {
	ticker := time.NewTicker(10 * time.Minute)
	defer ticker.Stop()
	for range ticker.C {
		now := time.Now()
		rl.mu.Lock()
		for ip, record := range rl.records {
			if now.After(record.windowEnd) {
				delete(rl.records, ip)
			}
		}
		rl.mu.Unlock()
	}
}
