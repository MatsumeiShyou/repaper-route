/**
 * BoardSkeleton (Phase 3-3: Skeleton Screen)
 * Provides a shimmering loading state that mimics the Board's layout.
 */
export const BoardSkeleton = () => {
    return (
        <div className="flex flex-col h-full w-full bg-white overflow-hidden animate-pulse">
            {/* Header Skeleton */}
            <div className="flex border-b border-gray-200 bg-gray-50/50">
                <div className="w-20 h-16 border-r border-gray-200 flex items-center justify-center p-2">
                    <div className="h-3 bg-gray-200 rounded w-full" />
                </div>
                {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="flex-1 h-16 border-r border-gray-200 p-2 flex flex-col justify-center">
                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-1.5" />
                        <div className="h-3 bg-gray-100 rounded w-1/2" />
                    </div>
                ))}
            </div>

            {/* Grid Skeleton */}
            <div className="flex-1 flex overflow-hidden">
                {/* Time Axis */}
                <div className="w-20 border-r border-gray-200 bg-gray-50/30">
                    {[...Array(10)].map((_, i) => (
                        <div key={i} className="h-20 border-b border-gray-100 p-2">
                            <div className="h-3 bg-gray-100 rounded w-1/2" />
                        </div>
                    ))}
                </div>

                {/* Main Content Area */}
                {[1, 2, 3, 4, 5].map(j => (
                    <div key={j} className="flex-1 border-r border-gray-200 relative bg-white">
                        {[...Array(10)].map((_, i) => (
                            <div key={i} className="h-20 border-b border-gray-50" />
                        ))}
                        
                        {/* Fake Job Blocks (Randomly placed for realism) */}
                        {j === 1 && (
                            <>
                                <div className="absolute top-4 left-2 right-2 h-24 bg-blue-50/60 rounded-md border border-blue-100/50" />
                                <div className="absolute top-40 left-2 right-2 h-16 bg-blue-50/60 rounded-md border border-blue-100/50" />
                            </>
                        )}
                        {j === 2 && (
                            <div className="absolute top-20 left-2 right-2 h-32 bg-emerald-50/60 rounded-md border border-emerald-100/50" />
                        )}
                        {j === 3 && (
                            <>
                                <div className="absolute top-10 left-2 right-2 h-20 bg-gray-50/60 rounded-md border border-gray-100/50" />
                                <div className="absolute top-60 left-2 right-2 h-24 bg-blue-50/60 rounded-md border border-blue-100/50" />
                            </>
                        )}
                        {j === 4 && (
                            <div className="absolute top-4 left-2 right-2 h-40 bg-purple-50/60 rounded-md border border-purple-100/50" />
                        )}
                    </div>
                ))}
            </div>

            {/* Sidebar Skeleton (collapsed) */}
            <div className="w-1 bg-gray-50 border-l border-gray-200" />
        </div>
    );
};
