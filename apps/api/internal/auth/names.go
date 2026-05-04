package auth

import (
	"fmt"
	"math/rand"
	"time"
)

var adjectives = []string{
	"Swift", "Angry", "Brave", "Calm", "Dark", "Electric", "Frosty", "Golden",
	"Hidden", "Iron", "Jolly", "Lucky", "Magic", "Night", "Odd",
	"Prime", "Quick", "Rapid", "Silent", "Turbo", "Ultra", "Viper", "Wild",
	"Xenon", "Young", "Zesty", "Sly", "Neon", "Crimson", "Shadow", "Misty",
	"Bold", "Cold", "Deep", "Elite", "Fierce", "Grand", "Hyper", "Icy",
	"Jade", "Keen", "Lunar", "Mega", "Noble", "Omega", "Pure", "Rare",
	"Solar", "Titan", "Urban", "Vivid", "Wise", "Zen",
}

var nouns = []string{
	"Archer", "Bear", "Cat", "Dragon", "Eagle", "Falcon", "Ghost", "Hawk",
	"Ibis", "Jaguar", "Knight", "Lion", "Mamba", "Ninja", "Owl", "Panther",
	"Queen", "Raven", "Shark", "Tiger", "Unicorn", "Vulture", "Wolf", "Xray",
	"Yeti", "Zebra", "Pigeon", "Whale", "Coyote", "Ranger", "Warrior", "Pilot",
	"Hunter", "Scout", "Blade", "Storm", "Frost", "Flame", "Void", "Nova",
	"Pulse", "Echo", "Drift", "Volt", "Spark", "Onyx", "Ruby", "Bolt",
}

func GenerateRandomName() string {
	r := rand.New(rand.NewSource(time.Now().UnixNano()))
	adj := adjectives[r.Intn(len(adjectives))]
	noun := nouns[r.Intn(len(nouns))]

	// Variety in formats
	formatType := r.Intn(4)
	switch formatType {
	case 0: // AdjectiveNoun
		return fmt.Sprintf("%s%s", adj, noun)
	case 1: // AdjectiveNounNumbers
		return fmt.Sprintf("%s%s%d", adj, noun, r.Intn(100))
	case 2: // NounAdjective
		return fmt.Sprintf("%s%s", noun, adj)
	default: // Adjective_Noun
		return fmt.Sprintf("%s_%s", adj, noun)
	}
}
