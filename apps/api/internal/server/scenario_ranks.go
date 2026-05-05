package server

type ScenarioRankInfo struct {
	Name          string
	MinPercentile float64
}

var ScenarioRanks = []ScenarioRankInfo{
	{Name: "Godlike III", MinPercentile: 99.9},
	{Name: "Godlike II", MinPercentile: 99},
	{Name: "Godlike I", MinPercentile: 98},
	{Name: "World Class", MinPercentile: 95},
	{Name: "Elite", MinPercentile: 90},
	{Name: "Expert", MinPercentile: 80},
	{Name: "Adept", MinPercentile: 65},
	{Name: "Talented", MinPercentile: 50},
	{Name: "Advanced", MinPercentile: 35},
	{Name: "Competent", MinPercentile: 20},
	{Name: "Improver", MinPercentile: 10},
	{Name: "Beginner", MinPercentile: 0.1},
	{Name: "Unranked", MinPercentile: 0},
}

func GetScenarioRankName(percentile float64) string {
	for _, r := range ScenarioRanks {
		if percentile >= r.MinPercentile {
			return r.Name
		}
	}
	return "Unranked"
}

func GetScenarioRankIndex(name string) int {
	for i, r := range ScenarioRanks {
		if r.Name == name {
			return i
		}
	}
	return len(ScenarioRanks) - 1
}

func CalculatePercentile(rank, total int) float64 {
	if total <= 0 || rank <= 0 {
		return 0
	}
	return float64(total-rank+1) / float64(total) * 100
}
