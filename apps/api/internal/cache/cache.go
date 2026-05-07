package cache

import (
	"sync"
	"time"
)

// Item represents a single cached value with an expiration time.
type Item struct {
	Value      any
	ExpiresAt  time.Time
}

// MemoryCache is a generic thread-safe in-memory cache with TTL support.
type MemoryCache struct {
	mu    sync.RWMutex
	items map[string]Item
}

// New creates a new MemoryCache instance.
func New() *MemoryCache {
	return &MemoryCache{
		items: make(map[string]Item),
	}
}

// Set adds a value to the cache with a specified duration.
func (c *MemoryCache) Set(key string, value any, duration time.Duration) {
	c.mu.Lock()
	defer c.mu.Unlock()

	c.items[key] = Item{
		Value:     value,
		ExpiresAt: time.Now().Add(duration),
	}
}

// Get retrieves a value from the cache if it exists and has not expired.
func (c *MemoryCache) Get(key string) (any, bool) {
	c.mu.RLock()
	defer c.mu.RUnlock()

	item, exists := c.items[key]
	if !exists {
		return nil, false
	}

	if time.Now().After(item.ExpiresAt) {
		return nil, false
	}

	return item.Value, true
}

// Delete removes a specific key from the cache.
func (c *MemoryCache) Delete(key string) {
	c.mu.Lock()
	defer c.mu.Unlock()

	delete(c.items, key)
}

// DeletePrefix removes all keys that start with a specific prefix.
// Useful for invalidating related data (e.g., all activity pages for a user).
func (c *MemoryCache) DeletePrefix(prefix string) {
	c.mu.Lock()
	defer c.mu.Unlock()

	for key := range c.items {
		if len(key) >= len(prefix) && key[:len(prefix)] == prefix {
			delete(c.items, key)
		}
	}
}

// Flush removes all items from the cache.
func (c *MemoryCache) Flush() {
	c.mu.Lock()
	defer c.mu.Unlock()

	c.items = make(map[string]Item)
}
