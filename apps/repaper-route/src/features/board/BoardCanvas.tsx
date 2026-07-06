import React from 'react';
import { useDataSync } from './hooks/useDataSync';
import { BoardJob, BoardCourse } from '../../types';

export default function BoardCanvas() {
    const [date, setDate] = React.useState(new Date());

    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const dateKey = `${y}-${m}-${d}`;

    const { data, isLoading, error } = useDataSync(dateKey);

    const changeDate = (days: number) => {
        const next = new Date(date);
        next.setDate(next.getDate() + days);
        setDate(next);
    };

    if (isLoading) {
        return (
            <div className="flex h-full items-center justify-center p-8 bg-gray-50">
                <div className="text-xl text-gray-500 font-bold animate-pulse">Loading Board Data...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex h-full items-center justify-center p-8 bg-gray-50">
                <div className="text-xl text-red-500 font-bold">Error: {error}</div>
            </div>
        );
    }

    if (!data || data.courses.length === 0) {
        return (
            <div className="flex h-full items-center justify-center p-8 bg-gray-50">
                <div className="text-xl text-gray-400 font-bold">No dispatch plan for this date. (Commander has not published yet)</div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-gray-100 overflow-hidden font-sans">
            <div className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center shadow-sm z-10">
                <h1 className="text-2xl font-black text-gray-800 tracking-tight">TBNY DXOS Admin Viewer</h1>
                <div className="flex items-center gap-4">
                    <button onClick={() => changeDate(-1)} className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded font-bold text-gray-600">&lt; 前日</button>
                    <div className="text-sm font-semibold text-gray-700 bg-gray-100 px-4 py-2 rounded-full border border-gray-200">
                        {dateKey}
                    </div>
                    <button onClick={() => changeDate(1)} className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded font-bold text-gray-600">翌日 &gt;</button>
                </div>
            </div>
            
            <div className="flex-1 overflow-x-auto overflow-y-auto p-6">
                <div className="flex gap-4 min-w-max">
                    {data.courses.map((course: BoardCourse) => {
                        const courseJobs = data.jobs.filter(j => j.courseId === course.id);
                        
                        courseJobs.sort((a, b) => {
                            if (!a.startTime) return 1;
                            if (!b.startTime) return -1;
                            return a.startTime.localeCompare(b.startTime);
                        });

                        return (
                            <div key={course.id} className="w-80 flex flex-col bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                                <div 
                                    className="px-4 py-3 text-white font-bold flex flex-col items-center justify-center"
                                    style={{ backgroundColor: course.displayColor || '#4A90D9' }}
                                >
                                    <div className="text-lg tracking-wider">{course.name}</div>
                                    <div className="text-xs opacity-90 mt-1">
                                        Staff: {course.staffId ? 'Assigned' : 'Unassigned'} | Vehicle: {course.vehicleId ? 'Assigned' : 'Unassigned'}
                                    </div>
                                </div>
                                <div className="p-3 flex-1 overflow-y-auto bg-gray-50/50 space-y-3 min-h-[500px]">
                                    {courseJobs.length === 0 ? (
                                        <div className="text-center text-gray-400 text-sm mt-8 font-medium">No Jobs</div>
                                    ) : (
                                        courseJobs.map((job: BoardJob) => (
                                            <div key={job.id} className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                                                <div className="absolute left-0 top-0 bottom-0 w-1" style={{ backgroundColor: course.displayColor || '#4A90D9' }}></div>
                                                <div className="flex justify-between items-start mb-2">
                                                    <div className="font-bold text-gray-800 text-sm">{job.title}</div>
                                                    <div className="text-xs font-mono font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                                                        {job.startTime || '未定'}
                                                    </div>
                                                </div>
                                                <div className="text-xs text-gray-600 font-medium mb-1 line-clamp-1">
                                                    Area: {job.area || 'N/A'}
                                                </div>
                                                <div className="flex justify-between items-center text-xs mt-3">
                                                    <span className="text-gray-500 bg-gray-100 px-2 py-1 rounded font-medium">{job.duration} min</span>
                                                    {job.isSpot && (
                                                        <span className="bg-orange-100 text-orange-700 font-bold px-2 py-1 rounded">SPOT</span>
                                                    )}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
