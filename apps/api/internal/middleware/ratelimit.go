package middleware

import (
	"math"
	"net/http"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
)

type bucket struct {
	tokens         float64
	lastRefillTime time.Time
}

// TierConfig defines the limits for a specific tier using Token Bucket parameters
type TierConfig struct {
	IPLimit     int           // Sustained limit (e.g., 200)
	UserLimit   int           // Sustained limit (e.g., 100)
	Window      time.Duration // Time window for sustained limit (e.g., 1m)
	BurstLimit  int           // Max burst size (e.g., 3)
	BurstWindow time.Duration // Time window for burst (e.g., 5s)
}

// TieredLimiter handles rate limiting using the Token Bucket algorithm
type TieredLimiter struct {
	mu           sync.Mutex
	ipBuckets    map[string]*bucket
	userBuckets  map[string]*bucket
	burstBuckets map[string]*bucket
	config       TierConfig
	message      string
}

// NewTieredLimiter creates a new rate limiter with the specified tiered config
func NewTieredLimiter(config TierConfig, message string) *TieredLimiter {
	tl := &TieredLimiter{
		ipBuckets:    make(map[string]*bucket),
		userBuckets:  make(map[string]*bucket),
		burstBuckets: make(map[string]*bucket),
		config:       config,
		message:      message,
	}
	go tl.cleanup()
	return tl
}

func (tl *TieredLimiter) cleanup() {
	ticker := time.NewTicker(15 * time.Minute)
	defer ticker.Stop()
	for range ticker.C {
		tl.mu.Lock()
		now := time.Now()
		// If a bucket hasn't been touched in longer than its window (or 1 hour), remove it
		threshold := tl.config.Window
		if threshold < time.Hour {
			threshold = time.Hour
		}

		for id, b := range tl.ipBuckets {
			if now.Sub(b.lastRefillTime) > threshold {
				delete(tl.ipBuckets, id)
			}
		}
		for id, b := range tl.userBuckets {
			if now.Sub(b.lastRefillTime) > threshold {
				delete(tl.userBuckets, id)
			}
		}
		for id, b := range tl.burstBuckets {
			if now.Sub(b.lastRefillTime) > 10*time.Minute {
				delete(tl.burstBuckets, id)
			}
		}
		tl.mu.Unlock()
	}
}

// Middleware returns a Gin middleware function
func (tl *TieredLimiter) Middleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		ip := c.ClientIP()
		userToken, _ := c.Cookie("user_token")
		now := time.Now()

		tl.mu.Lock()
		defer tl.mu.Unlock()

		// 1. Check Burst Limit (if configured)
		if tl.config.BurstLimit > 0 && tl.config.BurstWindow > 0 {
			refillRate := float64(tl.config.BurstLimit) / tl.config.BurstWindow.Seconds()
			if !tl.allow(tl.burstBuckets, "ip:"+ip, float64(tl.config.BurstLimit), refillRate, now) {
				c.JSON(http.StatusTooManyRequests, gin.H{"error": "Burst limit exceeded. Please wait a few seconds."})
				c.Abort()
				return
			}
			if userToken != "" {
				if !tl.allow(tl.burstBuckets, "user:"+userToken, float64(tl.config.BurstLimit), refillRate, now) {
					c.JSON(http.StatusTooManyRequests, gin.H{"error": "Burst limit exceeded. Please wait a few seconds."})
					c.Abort()
					return
				}
			}
		}

		// 2. Check IP Limit
		ipRefillRate := float64(tl.config.IPLimit) / tl.config.Window.Seconds()
		if !tl.allow(tl.ipBuckets, ip, float64(tl.config.IPLimit), ipRefillRate, now) {
			c.JSON(http.StatusTooManyRequests, gin.H{"error": tl.message})
			c.Abort()
			return
		}

		// 3. Check User Limit
		if userToken != "" {
			userRefillRate := float64(tl.config.UserLimit) / tl.config.Window.Seconds()
			if !tl.allow(tl.userBuckets, userToken, float64(tl.config.UserLimit), userRefillRate, now) {
				c.JSON(http.StatusTooManyRequests, gin.H{"error": tl.message})
				c.Abort()
				return
			}
		}

		c.Next()
	}
}

// allow checks if a request is allowed by the token bucket and consumes a token if so
func (tl *TieredLimiter) allow(buckets map[string]*bucket, id string, capacity float64, refillRate float64, now time.Time) bool {
	b, exists := buckets[id]
	if !exists {
		// Initialize bucket at full capacity minus the current request
		buckets[id] = &bucket{
			tokens:         capacity - 1,
			lastRefillTime: now,
		}
		return true
	}

	// Refill tokens based on elapsed time
	elapsed := now.Sub(b.lastRefillTime).Seconds()
	b.tokens = math.Min(capacity, b.tokens+(elapsed*refillRate))
	b.lastRefillTime = now

	if b.tokens >= 1 {
		b.tokens -= 1
		return true
	}

	return false
}
