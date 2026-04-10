import { BoardJob } from '../../../types';

export const generateJobColorMap = (
    jobs: BoardJob[],
    driverOrder?: string[],
    timeToMinutes?: (time: string) => number
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

    const PALETTE_SIZE = themes.length;

    // ------------------------------------------------------------------
    // Smart Coloring / Global Cycling Mode
    // ------------------------------------------------------------------
    // 引数が揃わない場合はフォールバック（単純インデックス循環）
    if (!driverOrder || !timeToMinutes) {
        jobs.forEach((job, i) => {
            colorMap[job.id] = themes[i % PALETTE_SIZE];
            if (job.bucket === '特殊') {
                colorMap[job.id] = { bg: 'bg-slate-100', border: 'border-slate-300', text: 'text-slate-600' };
            }
        });
        return colorMap;
    }

    // --- 型安全性のためのナローイング定数 ---
    const t2m = timeToMinutes;

    // --- ヘルパー: 案件の開始分・終了分を取得 ---
    const getStartMin = (job: BoardJob): number =>
        t2m!(job.startTime || job.timeConstraint || '06:00');
    const getEndMin = (job: BoardJob): number =>
        getStartMin(job) + job.duration;

    // --- 1. 計算順序（ソート）: ドライバー順 → 開始時間順 ---
    const driverIndexMap = new Map<string, number>();
    driverOrder.forEach((id, idx) => driverIndexMap.set(id, idx));

    const sortedJobs = [...jobs].sort((a, b) => {
        const driverA = driverIndexMap.get(a.driverId || '') ?? 9999;
        const driverB = driverIndexMap.get(b.driverId || '') ?? 9999;
        if (driverA !== driverB) return driverA - driverB;
        return getStartMin(a) - getStartMin(b);
    });

    // --- 2. ドライバー別にグループ化（色決定用の参照構造） ---
    // 各ドライバーの「既に色が決定された案件」のリスト
    const assignedByDriver = new Map<string, { job: BoardJob, colorIndex: number }[]>();
    driverOrder.forEach(id => assignedByDriver.set(id, []));

    // --- 3. Snakeパターン: グローバルインデックスで色を循環 ---
    let globalIndex = 0;

    for (const job of sortedJobs) {
        // 「特殊」バケットは固定色（衝突回避の対象外）
        if (job.bucket === '特殊') {
            colorMap[job.id] = { bg: 'bg-slate-100', border: 'border-slate-300', text: 'text-slate-600' };
            // 特殊案件は衝突検知の参照として登録するが、colorIndex は -1（パレット外）
            const list = assignedByDriver.get(job.driverId || '');
            if (list) list.push({ job, colorIndex: -1 });
            continue;
        }

        // --- 衝突検知: 避けるべき色インデックスを収集 ---
        const forbiddenIndices = new Set<number>();

        // ① 上方向（Top）: 同一ドライバーの直前案件
        const sameDriverList = assignedByDriver.get(job.driverId || '');
        if (sameDriverList && sameDriverList.length > 0) {
            const prevColorIdx = sameDriverList[sameDriverList.length - 1].colorIndex;
            if (prevColorIdx >= 0) forbiddenIndices.add(prevColorIdx);
        }

        // ② 左方向（Left）: 左隣ドライバーの時間重複案件
        const currentDriverIdx = driverIndexMap.get(job.driverId || '');
        if (currentDriverIdx !== undefined && currentDriverIdx > 0) {
            const leftDriverId = driverOrder[currentDriverIdx - 1];
            const leftDriverList = assignedByDriver.get(leftDriverId);
            if (leftDriverList) {
                const jobStartMin = getStartMin(job);
                const jobEndMin = getEndMin(job);
                for (const entry of leftDriverList) {
                    const entryStartMin = getStartMin(entry.job);
                    const entryEndMin = getEndMin(entry.job);
                    // 時間重複判定: 自案件の開始 < 左案件の終了 && 自案件の終了 > 左案件の開始
                    if (jobStartMin < entryEndMin && jobEndMin > entryStartMin) {
                        if (entry.colorIndex >= 0) forbiddenIndices.add(entry.colorIndex);
                    }
                }
            }
        }

        // --- 色の決定: Snake循環 ---
        let chosenIndex = globalIndex;
        let attempts = 0;
        while (forbiddenIndices.has(chosenIndex) && attempts < PALETTE_SIZE) {
            chosenIndex = (chosenIndex + 1) % PALETTE_SIZE;
            attempts++;
        }
        // 全色が禁止されていた場合（18色以上の衝突は理論上ないが安全策）
        // → グローバルインデックスのまま使用

        colorMap[job.id] = themes[chosenIndex];

        // グローバルインデックスを「今回決定した色の、次の色」に更新
        globalIndex = (chosenIndex + 1) % PALETTE_SIZE;

        // 参照構造に登録
        if (sameDriverList) {
            sameDriverList.push({ job, colorIndex: chosenIndex });
        }
    }

    return colorMap;
};

export const getPendingJobColor = (bucket?: string) => {
    if (bucket === '特殊') return { bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-300' };
    if (bucket === 'スポット') return { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200' };
    return { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200' };
};
