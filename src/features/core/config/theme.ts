import { BoardJob } from '../../../types';

export const generateJobColorMap = (
    jobs: BoardJob[],
    _driverOrder?: string[],
    _timeToMinutes?: (time: string) => number
) => {
    const colorMap: Record<string, { bg: string, border: string, text: string }> = {};

    // Tailwind based color themes (18 colors)
    const themes = [
        { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700' },
        { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700' },
        { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700' },
        { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700' },
        { bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-700' },
        { bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-700' },
        { bg: 'bg-teal-50', border: 'border-teal-200', text: 'text-teal-700' },
        { bg: 'bg-sky-50', border: 'border-sky-200', text: 'text-sky-700' },
        { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700' },
        { bg: 'bg-cyan-50', border: 'border-cyan-200', text: 'text-cyan-700' },
        { bg: 'bg-lime-50', border: 'border-lime-200', text: 'text-lime-700' },
        { bg: 'bg-pink-50', border: 'border-pink-200', text: 'text-pink-700' },
        { bg: 'bg-violet-50', border: 'border-violet-200', text: 'text-violet-700' },
        { bg: 'bg-fuchsia-50', border: 'border-fuchsia-200', text: 'text-fuchsia-700' },
        { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-700' },
        { bg: 'bg-slate-50', border: 'border-slate-200', text: 'text-slate-700' },
        { bg: 'bg-zinc-50', border: 'border-zinc-200', text: 'text-zinc-700' },
        { bg: 'bg-neutral-50', border: 'border-neutral-200', text: 'text-neutral-700' },
    ];

    jobs.forEach((job, index) => {
        // [TODO] Global Cycling Mode: Adjacent card collision avoidance logic
        const themeIndex = index % themes.length;
        colorMap[job.id] = themes[themeIndex];

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
