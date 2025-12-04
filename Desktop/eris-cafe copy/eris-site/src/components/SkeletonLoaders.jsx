// Reusable Skeleton Loading Components

export const SkeletonCard = () => (
  <div className="bg-white rounded-lg shadow-md p-6 animate-pulse">
    <div className="w-full h-48 bg-gray-300 rounded-lg mb-4"></div>
    <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
    <div className="h-4 bg-gray-300 rounded w-1/2"></div>
  </div>
);

export const SkeletonTable = ({ rows = 5, columns = 6 }) => (
  <div className="bg-white rounded-lg shadow-md overflow-hidden animate-pulse">
    <table className="min-w-full divide-y divide-gray-200">
      <thead className="bg-gray-50">
        <tr>
          {[...Array(columns)].map((_, i) => (
            <th key={i} className="px-6 py-3">
              <div className="h-4 bg-gray-300 rounded w-20"></div>
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-200">
        {[...Array(rows)].map((_, rowIndex) => (
          <tr key={rowIndex}>
            {[...Array(columns)].map((_, colIndex) => (
              <td key={colIndex} className="px-6 py-4">
                <div className="h-4 bg-gray-200 rounded w-full"></div>
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export const SkeletonStats = () => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
    {[...Array(4)].map((_, i) => (
      <div key={i} className="bg-white/70 border border-white rounded-xl shadow-md p-6 animate-pulse">
        <div className="h-4 bg-gray-300 rounded w-24 mb-2"></div>
        <div className="h-8 bg-gray-300 rounded w-32 mb-2"></div>
        <div className="h-3 bg-gray-200 rounded w-20"></div>
      </div>
    ))}
  </div>
);

export const SkeletonChart = ({ height = 320 }) => (
  <div className="bg-white rounded-lg shadow-md p-6 animate-pulse">
    <div className="flex items-center justify-between mb-4">
      <div className="h-6 bg-gray-300 rounded w-48"></div>
      <div className="h-4 bg-gray-200 rounded w-24"></div>
    </div>
    <div className={`bg-gray-200 rounded`} style={{ height: `${height}px` }}></div>
  </div>
);

export const SkeletonList = ({ items = 5 }) => (
  <div className="space-y-4">
    {[...Array(items)].map((_, i) => (
      <div key={i} className="bg-white rounded-lg shadow-md p-6 animate-pulse">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <div className="h-5 bg-gray-300 rounded w-32 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-48"></div>
          </div>
          <div className="h-6 bg-gray-300 rounded-full w-20"></div>
        </div>
        <div className="border-t pt-4">
          <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        </div>
      </div>
    ))}
  </div>
);

export const SkeletonProductGrid = ({ items = 4 }) => (
  <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
    {[...Array(items)].map((_, i) => (
      <div key={i} className="group rounded-lg shadow-md overflow-hidden animate-pulse">
        <div className="w-full h-64 bg-gray-300"></div>
        <div className="p-4">
          <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    ))}
  </div>
);

export const SkeletonOrderCard = () => (
  <div className="bg-white rounded-lg shadow-md p-6 animate-pulse">
    <div className="flex justify-between items-start mb-4">
      <div className="flex-1">
        <div className="h-5 bg-gray-300 rounded w-32 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-48"></div>
      </div>
      <div className="h-6 bg-gray-300 rounded-full w-20"></div>
    </div>
    <div className="border-t pt-4 space-y-2">
      <div className="flex justify-between">
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        <div className="h-4 bg-gray-300 rounded w-16"></div>
      </div>
      <div className="flex justify-between">
        <div className="h-4 bg-gray-200 rounded w-1/3"></div>
        <div className="h-4 bg-gray-300 rounded w-16"></div>
      </div>
    </div>
    <div className="border-t mt-4 pt-4 flex justify-between">
      <div className="h-6 bg-gray-300 rounded w-16"></div>
      <div className="h-6 bg-gray-300 rounded w-24"></div>
    </div>
  </div>
);

export const SkeletonKanban = () => (
  <div className="flex gap-4 overflow-x-auto pb-4">
    {[...Array(5)].map((_, colIndex) => (
      <div key={colIndex} className="flex flex-col flex-shrink-0 w-80">
        <div className="bg-gray-300 rounded-t-lg p-3 h-12 animate-pulse"></div>
        <div className="bg-gray-100 rounded-b-lg p-3 min-h-[600px] space-y-3">
          {[...Array(3)].map((_, cardIndex) => (
            <div key={cardIndex} className="bg-white rounded-lg p-4 shadow-md animate-pulse">
              <div className="h-4 bg-gray-300 rounded w-24 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-full mb-4"></div>
              <div className="flex justify-between items-center">
                <div className="h-5 bg-gray-300 rounded w-16"></div>
                <div className="h-4 bg-gray-200 rounded w-20"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    ))}
  </div>
);

export const SkeletonHero = () => (
  <div className="relative h-screen overflow-hidden animate-pulse">
    <div className="absolute inset-0 bg-gray-400"></div>
    <div className="relative z-10 flex items-center justify-center h-full px-4">
      <div className="text-center w-full max-w-7xl mx-auto">
        <div className="h-6 bg-gray-300 rounded w-64 mx-auto mb-4"></div>
        <div className="h-16 bg-gray-300 rounded w-96 mx-auto mb-8"></div>
        <div className="h-4 bg-gray-200 rounded w-full max-w-4xl mx-auto mb-4"></div>
        <div className="w-full max-w-5xl mx-auto" style={{ paddingBottom: '56.25%' }}>
          <div className="absolute bg-gray-300 rounded" style={{ width: '80%', height: '45%', top: '30%', left: '10%' }}></div>
        </div>
      </div>
    </div>
  </div>
);

export const SkeletonProductDetail = () => (
  <div className="max-w-7xl mx-auto px-4 py-8 md:py-12">
    <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 animate-pulse">
      <div className="flex justify-center">
        <div className="w-full max-w-md aspect-square bg-gray-300 rounded-lg"></div>
      </div>
      <div className="space-y-6">
        <div className="h-10 bg-gray-300 rounded w-3/4"></div>
        <div className="h-8 bg-gray-300 rounded w-32"></div>
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        </div>
        <div className="space-y-2">
          <div className="h-4 bg-gray-300 rounded w-24"></div>
          <div className="flex gap-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-200 rounded w-24"></div>
            ))}
          </div>
        </div>
        <div className="h-12 bg-gray-300 rounded w-full"></div>
        <div className="h-14 bg-gray-400 rounded-lg w-full"></div>
      </div>
    </div>
  </div>
);

export const SkeletonForm = ({ fields = 4 }) => (
  <div className="space-y-4 animate-pulse">
    {[...Array(fields)].map((_, i) => (
      <div key={i}>
        <div className="h-4 bg-gray-300 rounded w-24 mb-2"></div>
        <div className="h-10 bg-gray-200 rounded w-full"></div>
      </div>
    ))}
  </div>
);

export const SkeletonReservation = () => (
  <div className="bg-white rounded-lg shadow-md p-6 animate-pulse">
    <div className="flex justify-between items-start mb-4">
      <div className="flex-1">
        <div className="h-5 bg-gray-300 rounded w-40 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-56"></div>
      </div>
      <div className="h-6 bg-gray-300 rounded-full w-20"></div>
    </div>
    <div className="grid grid-cols-2 gap-4 mb-4">
      {[...Array(4)].map((_, i) => (
        <div key={i}>
          <div className="h-3 bg-gray-200 rounded w-16 mb-1"></div>
          <div className="h-4 bg-gray-300 rounded w-24"></div>
        </div>
      ))}
    </div>
  </div>
);
