export default function TrackPage() {
  return (
    <div className="space-y-6">
      <header className="border-b border-border pb-4">
        <span className="text-[11px] font-semibold tracking-wider uppercase text-accent">
          Ground-Truth Logging
        </span>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Track & Log
        </h1>
      </header>

      <div className="space-y-3">
        <div className="bg-surface-1 border border-border rounded-lg p-4">
          <h2 className="text-sm font-semibold text-foreground">Meals & Nutrition</h2>
          <p className="text-xs text-muted-foreground mt-1">
            Log plain language meals with Gemini macro estimation and instant manual overrides.
          </p>
        </div>

        <div className="bg-surface-1 border border-border rounded-lg p-4">
          <h2 className="text-sm font-semibold text-foreground">Health Vitals</h2>
          <p className="text-xs text-muted-foreground mt-1">
            Weight, water, sleep hours, steps, mood, and clinical reference bounds.
          </p>
        </div>

        <div className="bg-surface-1 border border-border rounded-lg p-4">
          <h2 className="text-sm font-semibold text-foreground">Workouts & Fitness</h2>
          <p className="text-xs text-muted-foreground mt-1">
            Exercise sets, reps, weight (kg), and training duration.
          </p>
        </div>

        <div className="bg-surface-1 border border-border rounded-lg p-4">
          <h2 className="text-sm font-semibold text-foreground">Supplements & Habits</h2>
          <p className="text-xs text-muted-foreground mt-1">
            Daily check-offs, discipline streaks, and consistency tracking.
          </p>
        </div>
      </div>
    </div>
  );
}
