export function SkeletonCard() {
  return (
    <div className="rounded-xl bg-[#161616] border border-[#2a2a2a] p-4 animate-pulse">
      <div className="h-3 bg-[#2a2a2a] rounded w-1/3 mb-3" />
      <div className="flex justify-between mb-3">
        <div className="h-4 bg-[#2a2a2a] rounded w-1/3" />
        <div className="h-4 bg-[#2a2a2a] rounded w-1/3" />
      </div>
      <div className="flex gap-2">
        <div className="h-8 bg-[#2a2a2a] rounded-lg flex-1" />
        <div className="h-8 bg-[#2a2a2a] rounded-lg flex-1" />
        <div className="h-8 bg-[#2a2a2a] rounded-lg flex-1" />
      </div>
    </div>
  )
}

export function SkeletonList({ count = 5 }: { count?: number }) {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  )
}
