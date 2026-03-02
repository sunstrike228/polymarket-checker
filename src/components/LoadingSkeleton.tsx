"use client";

export default function LoadingSkeleton() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Fake table rows */}
      <div className="bg-poly-card border border-poly-border rounded-xl overflow-hidden">
        <div className="p-4 border-b border-poly-border flex gap-4">
          <div className="skeleton w-24 h-4" />
          <div className="skeleton w-20 h-4" />
          <div className="skeleton w-20 h-4" />
          <div className="skeleton w-20 h-4" />
          <div className="skeleton w-16 h-4" />
        </div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="p-4 border-b border-poly-border/50 flex items-center gap-4">
            <div className="skeleton w-8 h-8 rounded-full" />
            <div className="skeleton w-32 h-4" />
            <div className="flex-1" />
            <div className="skeleton w-20 h-4" />
            <div className="skeleton w-20 h-4" />
            <div className="skeleton w-16 h-4" />
          </div>
        ))}
      </div>

      {/* Fake stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="bg-poly-card border border-poly-border rounded-xl p-4">
            <div className="skeleton w-20 h-3 mb-3" />
            <div className="skeleton w-24 h-6" />
          </div>
        ))}
      </div>
    </div>
  );
}
