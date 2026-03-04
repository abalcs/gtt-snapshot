export default function DestinationDetailLoading() {
  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-pulse">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2">
        <div className="h-4 w-12 bg-muted rounded" />
        <div className="h-4 w-4 bg-muted rounded" />
        <div className="h-4 w-20 bg-muted rounded" />
        <div className="h-4 w-4 bg-muted rounded" />
        <div className="h-4 w-28 bg-muted rounded" />
      </div>

      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-start justify-between">
          <div className="h-9 w-64 bg-muted rounded" />
          <div className="h-6 w-24 bg-muted rounded-full" />
        </div>
        <div className="flex gap-2">
          <div className="h-5 w-20 bg-muted rounded-full" />
          <div className="h-5 w-24 bg-muted rounded-full" />
          <div className="h-5 w-16 bg-muted rounded-full" />
        </div>
        <div className="h-4 w-48 bg-muted rounded" />
      </div>

      {/* Map placeholder */}
      <div className="h-64 w-full bg-muted rounded-xl" />

      {/* Talking points card */}
      <div className="rounded-xl border bg-[#3a5f54]/5 py-6 px-6 space-y-3">
        <div className="h-6 w-36 bg-muted rounded" />
        <div className="h-4 w-full bg-muted rounded" />
        <div className="h-4 w-3/4 bg-muted rounded" />
      </div>

      {/* Overview grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="rounded-xl border bg-card py-6 px-6 space-y-2">
            <div className="h-5 w-28 bg-muted rounded" />
            <div className="h-4 w-20 bg-muted rounded" />
          </div>
        ))}
      </div>

      {/* Key facts */}
      <div className="h-px w-full bg-border" />
      <div className="space-y-3">
        <div className="h-7 w-24 bg-muted rounded" />
        <div className="space-y-2">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-4 w-full bg-muted rounded" />
          ))}
        </div>
      </div>

      {/* Pricing */}
      <div className="h-px w-full bg-border" />
      <div className="space-y-3">
        <div className="h-7 w-20 bg-muted rounded" />
        <div className="h-32 w-full bg-muted rounded-lg" />
      </div>

      {/* Seasonality */}
      <div className="h-px w-full bg-border" />
      <div className="space-y-3">
        <div className="h-7 w-28 bg-muted rounded" />
        <div className="h-24 w-full bg-muted rounded-lg" />
      </div>
    </div>
  );
}
