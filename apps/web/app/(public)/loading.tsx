export default function Loading() {
  return (
    <div className="w-full min-h-[50vh] grid place-items-center" role="status" aria-label="Loading">
      <div
        className="w-10 h-10 rounded-full border-4 border-[var(--color-border-subtle)] border-t-accent animate-spin"
        aria-hidden="true"
      />
    </div>
  );
}
