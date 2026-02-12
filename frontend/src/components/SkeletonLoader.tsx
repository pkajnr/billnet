export const SkeletonText = ({ lines = 3 }: { lines?: number }) => (
  <div className="space-y-3">
    {Array.from({ length: lines }).map((_, i) => (
      <div
        key={i}
        className="h-4 bg-gray-200 animate-pulse"
        style={{ width: `${Math.random() * 30 + 70}%` }}
      />
    ))}
  </div>
);

export const SkeletonCard = () => (
  <div className="border border-gray-200 p-6 animate-pulse">
    <div className="h-6 bg-gray-200 w-1/3 mb-4" />
    <div className="space-y-3">
      <div className="h-4 bg-gray-200 w-full" />
      <div className="h-4 bg-gray-200 w-5/6" />
      <div className="h-4 bg-gray-200 w-4/6" />
    </div>
  </div>
);

export const SkeletonProfile = () => (
  <div className="border border-gray-200 p-8 animate-pulse">
    <div className="h-8 bg-gray-200 w-1/4 mb-8" />
    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-8">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i}>
          <div className="h-3 bg-gray-200 w-1/3 mb-3" />
          <div className="h-6 bg-gray-200 w-2/3" />
        </div>
      ))}
    </div>
    <div className="flex gap-4">
      <div className="h-12 bg-gray-200 w-32" />
      <div className="h-12 bg-gray-200 w-40" />
    </div>
  </div>
);

export const SkeletonDashboard = () => (
  <div className="min-h-screen bg-white text-gray-900 py-16 px-6">
    <div className="max-w-7xl mx-auto">
      <div className="mb-12 border-b border-gray-200 pb-12 animate-pulse">
        <div className="h-16 bg-gray-200 w-1/2 mb-3" />
        <div className="h-6 bg-gray-200 w-1/3" />
      </div>
      
      <SkeletonProfile />
      
      <div className="my-12">
        <div className="h-8 bg-gray-200 w-1/4 mb-8 animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
      
      <div className="border border-gray-200 p-8 animate-pulse">
        <div className="h-8 bg-gray-200 w-1/4 mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="text-center">
              <div className="h-12 bg-gray-200 w-16 mx-auto mb-2" />
              <div className="h-4 bg-gray-200 w-24 mx-auto" />
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

export default { SkeletonText, SkeletonCard, SkeletonProfile, SkeletonDashboard };
