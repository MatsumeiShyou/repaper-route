import React from 'react';

export const Skeleton = ({ className, count = 1 }) => {
    return (
        <div className="space-y-3 w-full animate-pulse">
            {Array.from({ length: count }).map((_, i) => (
                <div
                    key={i}
                    className={`bg-gray-200 dark:bg-gray-700 rounded-lg ${className}`}
                />
            ))}
        </div>
    );
};

export const JobCardSkeleton = () => (
    <div className="relative flex items-start gap-4 mb-4">
        <div className="relative z-10 flex-shrink-0 w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700" />
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 flex-grow shadow-md">
            <Skeleton className="h-6 w-3/4 mb-2" />
            <Skeleton className="h-4 w-1/2" />
        </div>
    </div>
);
