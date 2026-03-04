export default function RegionLoading() {
  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-pulse">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2">
        <div className="h-4 w-12 bg-muted rounded" />
        <div className="h-4 w-4 bg-muted rounded" />
        <div className="h-4 w-24 bg-muted rounded" />
      </div>

      {/* Header */}
      <div className="space-y-2">
        <div className="h-8 w-48 bg-muted rounded" />
        <div className="h-5 w-72 bg-muted rounded" />
        <div className="h-4 w-32 bg-muted rounded" />
      </div>

      {/* Destination grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map(i => (
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
