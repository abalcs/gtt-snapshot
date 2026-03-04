export default function DestinationsLoading() {
  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-pulse">
      {/* Header */}
      <div>
        <div className="h-8 w-48 bg-muted rounded" />
        <div className="h-5 w-40 bg-muted rounded mt-2" />
      </div>

      {/* Filter bar */}
      <div className="flex gap-3">
        <div className="h-10 w-48 bg-muted rounded-md" />
        <div className="h-10 w-36 bg-muted rounded-md" />
      </div>

      {/* Tag filter bar */}
      <div className="flex flex-wrap gap-2">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="h-7 w-24 bg-muted rounded-full" />
        ))}
      </div>

      {/* Destination grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(i => (
          <div key={i} className="rounded-xl border bg-card py-6 px-6 space-y-3">
            <div className="flex items-start justify-between">
              <div className="h-5 w-36 bg-muted rounded" />
              <div className="h-5 w-20 bg-muted rounded-full" />
            </div>
            <div className="h-4 w-full bg-muted rounded" />
            <div className="flex gap-2">
              <div className="h-5 w-16 bg-muted rounded" />
              <div className="h-5 w-16 bg-muted rounded" />
            </div>
            <div className="flex flex-wrap gap-1.5">
              <div className="h-5 w-16 bg-muted rounded-full" />
              <div className="h-5 w-20 bg-muted rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
