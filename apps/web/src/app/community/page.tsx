export default function CommunityPage() {
  return (
    <section className="space-y-6">
      <header className="retro-card-gradient-a border-2 border-border p-6 shadow-[var(--shadow-sm)]">
        <h1 className="text-2xl font-semibold text-foreground">Community</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Connect with other players, share routines, and compare progress.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        <article className="retro-card-gradient-b border-2 border-border p-5 shadow-[var(--shadow-xs)]">
          <h2 className="text-base font-medium text-foreground">Discord</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Join live feedback sessions and scenario challenges.
          </p>
        </article>

        <article className="retro-card-gradient-c border-2 border-border p-5 shadow-[var(--shadow-xs)]">
          <h2 className="text-base font-medium text-foreground">Leaderboards</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Track top performers and benchmark your consistency.
          </p>
        </article>
      </div>
    </section>
  );
}
