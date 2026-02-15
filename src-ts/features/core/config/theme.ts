import { BoardJob } from '../../../types';

export const generateJobColorMap = (
    jobs: BoardJob[],
    driverOrder: string[],
    timeToMinutes: (t: string) => number
) => {
    const colorMap: Record<string, { bg: string, border: string, text: string }> = {};

    // Tailwind based color themes
    const themes = [
        { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700' },
        { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700' },
        { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700' },
        { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700' },
        { bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-700' },
    ];

    jobs.forEach((job, index) => {
        // Basic assignment logic for demo - can be more sophisticated
        const themeIndex = index % themes.length;
        colorMap[job.id] = themes[themeIndex];

        // Special coloring for specific bucket types
        if (job.bucket === '特殊') {
            colorMap[job.id] = { bg: 'bg-slate-100', border: 'border-slate-300', text: 'text-slate-600' };
        }
    });

    return colorMap;
};

export const getPendingJobColor = (bucket?: string) => {
    if (bucket === '特殊') return { bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-300' };
    if (bucket === 'スポット') return { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200' };
    return { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200' };
};
