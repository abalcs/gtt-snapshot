export default function HomeLoading() {
  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-pulse">
      {/* Title */}
      <div>
        <div className="h-9 w-72 bg-muted rounded" />
        <div className="h-5 w-96 bg-muted rounded mt-2" />
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="rounded-xl border bg-card py-6 px-6 space-y-3">
            <div className="h-4 w-32 bg-muted rounded" />
            <div className="h-8 w-16 bg-muted rounded" />
          </div>
        ))}
      </div>

      {/* CTA card */}
      <div className="rounded-xl border bg-[#3a5f54]/5 border-[#3a5f54]/20 py-6 px-6 space-y-3">
        <div className="h-6 w-64 bg-muted rounded" />
        <div className="h-4 w-96 bg-muted rounded" />
        <div className="h-10 w-36 bg-muted rounded-md" />
      </div>

      {/* Continents section */}
      <div className="space-y-4">
        <div className="h-7 w-32 bg-muted rounded" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="rounded-xl border bg-card py-6 px-6 space-y-3">
              <div className="flex items-center justify-between">
                <div className="h-5 w-28 bg-muted rounded" />
                <div className="h-5 w-20 bg-muted rounded-full" />
              </div>
              <div className="flex flex-wrap gap-1.5">
                {[1, 2, 3, 4].map(j => (
                  <div key={j} className="h-4 w-20 bg-muted rounded" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
