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
	IPLimit          int           // Sustained limit per IP (e.g., 200)
	UserLimit        int           // Sustained limit per User Token (e.g., 100)
	FingerprintLimit int           // Sustained limit per Browser Fingerprint (e.g., 150)
	Window           time.Duration // Time window for sustained limit (e.g., 1m)
	BurstLimit       int           // Max burst size (e.g., 3)
	BurstWindow      time.Duration // Time window for burst (e.g., 5s)
}

// TieredLimiter handles rate limiting using the Token Bucket algorithm
type TieredLimiter struct {
	mu           sync.Mutex
	ipBuckets    map[string]*bucket
	userBuckets  map[string]*bucket
	fpBuckets    map[string]*bucket
	combBuckets  map[string]*bucket // IP + Fingerprint combined
	burstBuckets map[string]*bucket
	config       TierConfig
	message      string
}

// NewTieredLimiter creates a new rate limiter with the specified tiered config
func NewTieredLimiter(config TierConfig, message string) *TieredLimiter {
	if config.FingerprintLimit == 0 {
		config.FingerprintLimit = config.IPLimit
	}
	tl := &TieredLimiter{
		ipBuckets:    make(map[string]*bucket),
		userBuckets:  make(map[string]*bucket),
		fpBuckets:    make(map[string]*bucket),
		combBuckets:  make(map[string]*bucket),
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
		threshold := tl.config.Window
		if threshold < time.Hour {
			threshold = time.Hour
		}

		cleanMap(tl.ipBuckets, now, threshold)
		cleanMap(tl.userBuckets, now, threshold)
		cleanMap(tl.fpBuckets, now, threshold)
		cleanMap(tl.combBuckets, now, threshold)
		cleanMap(tl.burstBuckets, now, 10*time.Minute)

		tl.mu.Unlock()
	}
}

func cleanMap(m map[string]*bucket, now time.Time, threshold time.Duration) {
	for id, b := range m {
		if now.Sub(b.lastRefillTime) > threshold {
			delete(m, id)
		}
	}
}

// Middleware returns a Gin middleware function
func (tl *TieredLimiter) Middleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		ip := c.ClientIP()
		userToken, _ := c.Cookie("user_token")
		fingerprint := c.GetHeader("X-Fingerprint")
		now := time.Now()

		tl.mu.Lock()
		defer tl.mu.Unlock()

		// Refill rates
		sustainedRate := 1.0 / tl.config.Window.Seconds()
		burstRate := 0.0
		if tl.config.BurstWindow > 0 {
			burstRate = float64(tl.config.BurstLimit) / tl.config.BurstWindow.Seconds()
		}

		// 1. Check Burst Limit
		if burstRate > 0 {
			if !tl.allow(tl.burstBuckets, "ip:"+ip, float64(tl.config.BurstLimit), burstRate, now) {
				tl.abort(c, "Burst limit exceeded (IP).")
				return
			}
			if userToken != "" {
				if !tl.allow(tl.burstBuckets, "user:"+userToken, float64(tl.config.BurstLimit), burstRate, now) {
					tl.abort(c, "Burst limit exceeded (User).")
					return
				}
			}
			if fingerprint != "" {
				if !tl.allow(tl.burstBuckets, "fp:"+fingerprint, float64(tl.config.BurstLimit), burstRate, now) {
					tl.abort(c, "Burst limit exceeded (Fingerprint).")
					return
				}
			}
		}

		// 2. Check IP Limit
		if !tl.allow(tl.ipBuckets, ip, float64(tl.config.IPLimit), float64(tl.config.IPLimit)*sustainedRate, now) {
			tl.abort(c, tl.message)
			return
		}

		// 3. Check Fingerprint Limit
		if fingerprint != "" {
			if !tl.allow(tl.fpBuckets, fingerprint, float64(tl.config.FingerprintLimit), float64(tl.config.FingerprintLimit)*sustainedRate, now) {
				tl.abort(c, "Browser identification limit exceeded. Please slow down.")
				return
			}

			// 4. Combined Limit (Strict protection)
			// Combined limit is set to the stricter of the two
			combinedLimit := float64(tl.config.FingerprintLimit)
			if !tl.allow(tl.combBuckets, ip+":"+fingerprint, combinedLimit, combinedLimit*sustainedRate, now) {
				tl.abort(c, "Access restricted due to suspicious activity patterns.")
				return
			}
		}

		// 5. Check User Limit
		if userToken != "" {
			if !tl.allow(tl.userBuckets, userToken, float64(tl.config.UserLimit), float64(tl.config.UserLimit)*sustainedRate, now) {
				tl.abort(c, tl.message)
				return
			}
		}

		c.Next()
	}
}

func (tl *TieredLimiter) abort(c *gin.Context, msg string) {
	c.JSON(http.StatusTooManyRequests, gin.H{"error": msg})
	c.Abort()
}

// allow checks if a request is allowed by the token bucket and consumes a token if so
func (tl *TieredLimiter) allow(buckets map[string]*bucket, id string, capacity float64, refillRate float64, now time.Time) bool {
	b, exists := buckets[id]
	if !exists {
		buckets[id] = &bucket{
			tokens:         capacity - 1,
			lastRefillTime: now,
		}
		return true
	}

	elapsed := now.Sub(b.lastRefillTime).Seconds()
	b.tokens = math.Min(capacity, b.tokens+(elapsed*refillRate))
	b.lastRefillTime = now

	if b.tokens >= 1 {
		b.tokens -= 1
		return true
	}

	return false
}
