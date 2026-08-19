export default function Loading() {
  return (
    <div className="w-full min-h-[60vh] flex flex-col items-center justify-center gap-6" role="status" aria-label="Loading dashboard">
      <div
        className="w-10 h-10 rounded-full border-4 border-[var(--color-border-subtle)] border-t-accent animate-spin"
        aria-hidden="true"
      />
      <p className="font-body text-sm text-muted-foreground">Loading your workspace...</p>
    </div>
  );
}
