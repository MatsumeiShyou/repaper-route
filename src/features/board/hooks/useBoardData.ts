import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../../../lib/supabase/client';
import { useMasterData } from './useMasterData';
import { useNotification } from '../../../contexts/NotificationContext';
import { isPastDayJST } from '../utils/dateUtils';
import { useDataSync } from './useDataSync';
import { JobAdapter } from '../logic/JobAdapter';
import { TemplateExpander, SkeletonJob } from '../../logic/core/TemplateExpander';
import {
    BoardJob, BoardDriver, BoardSplit, BoardHistory, AppUser, ExceptionReasonMaster
} from '../../../types';

// --- Types ---
export interface BoardState {
    drivers: BoardDriver[];
    jobs: BoardJob[];
    pendingJobs: BoardJob[];
    splits: BoardSplit[];
    appliedTemplateId?: string | null;
}

export const useBoardData = (user: AppUser | null, currentDateKey: string, isInteracting: boolean = false) => {
    const currentUserId = user?.id;

    const { drivers: masterDrivers, customers: masterPoints } = useMasterData();
    const { showNotification } = useNotification();

    // ----------------------------------------
    // 1. Logic Helpers (Adapters)
    // ----------------------------------------
    // mapSupabaseToBoardJob was removed and replaced by JobAdapter.mapToBoardJob

    const getDefaultDrivers = useCallback(() => ['A', 'B', 'C', 'D', 'E'].map(courseName => ({
        id: `course_${courseName}`,
        name: `${courseName}コース`,
        driverName: '未割当',
        currentVehicle: '未定',
        course: courseName,
        color: 'bg-gray-50 border-gray-200'
    })), []);

    // ----------------------------------------
    // 2. Data Synchronization (Phase 3-2: SWR Layer)
    // ----------------------------------------
    const { data: remoteData, isLoading: isSyncing, error: syncError, mutate: mutateCache } = useDataSync(
        currentDateKey, 
        getDefaultDrivers,
        user?.role
    );

    // ----------------------------------------
    // 3. Unified Local State (SSOT)
    // ----------------------------------------
    // --- State: UI Control ---
    const [isApplyingTemplate, setIsApplyingTemplate] = useState(false);
    const [appliedTemplateId, setAppliedTemplateId] = useState<string | null>(null);
    const [state, setState] = useState<BoardState>({
        drivers: [],
        jobs: [],
        pendingJobs: [],
        splits: []
    });

    const [isDataLoaded, setIsDataLoaded] = useState(false);
    const [history, setHistory] = useState<BoardHistory>({ past: [], future: [] });

    // Sync remote data to local state if no unsaved changes (history is empty) and not interacting
    useEffect(() => {
        if (remoteData && history.past.length === 0 && !isInteracting) {
            setState(remoteData);
            setAppliedTemplateId(remoteData.appliedTemplateId || null);
            setIsDataLoaded(true);
        }
    }, [remoteData, history.past.length, isInteracting]);

    // Handle sync errors
    useEffect(() => {
        if (syncError) {
            showNotification("データ同期中にエラーが発生しました", "error");
        }
    }, [syncError, showNotification]);

    // Supabase / Persistence State
    const [isOffline, setIsOffline] = useState(false);

    // Lock & Permission State
    const [lockState, setLockState] = useState<{ userId: string | null, dateKey: string | null }>({ userId: null, dateKey: null });
    
    // Permission derivation (F-SSOT)
    const [profile, setProfile] = useState<{ can_edit_board: boolean, role: string } | null>(null);
    const canEditBoard = useMemo(() => {
        if (!user) return false;
        if (user.role === 'admin') return true;
        return !!profile?.can_edit_board;
    }, [user, profile]);

    // Fetch Profile once
    useEffect(() => {
        if (currentUserId) {
            supabase.from('profiles').select('*').eq('id', currentUserId).maybeSingle()
                .then(({ data }) => { if (data) setProfile(data as any); });
        }
    }, [currentUserId]);

    // Exception Model State
    const [exceptionReasons, setExceptionReasons] = useState<ExceptionReasonMaster[]>([]);
    const [templateDescriptions, setTemplateDescriptions] = useState<string[]>([]);
    const [confirmedSnapshot, setConfirmedSnapshot] = useState<any>(null);
    
    // 【100点品質】備考サジェストの再取得ロジック (亡霊B対策・抽象化)
    const refreshTemplateDescriptions = useCallback(async () => {
        const { data } = await supabase.from('board_templates').select('description')
            .not('description', 'is', null)
            .neq('description', '');
        if (data) {
            const uniqueDesc = Array.from(new Set(data.map(t => t.description))).filter(Boolean) as string[];
            setTemplateDescriptions(uniqueDesc);
        }
    }, []);

    // Fetch Master Metadata, Exception Reasons, and Template History
    useEffect(() => {
        supabase.from('exception_reason_masters').select('*').eq('is_active', true).order('created_at', { ascending: true })
            .then(({ data }) => { if (data) setExceptionReasons(data as any); });
        
        refreshTemplateDescriptions();
        
        // Fetch Confirmed Snapshot for the route
        if (currentDateKey) {
            supabase.from('routes').select('confirmed_snapshot').eq('date', currentDateKey).maybeSingle()
                .then(({ data }) => { if (data) setConfirmedSnapshot(data.confirmed_snapshot); });
        }
    }, [currentDateKey]);

    // Derived States (Pure Derivation)
    const isPastDate = useMemo(() => isPastDayJST(new Date(currentDateKey)), [currentDateKey]);

    const isTargetDateLockedByMe = useMemo(() => {
        return lockState.userId === currentUserId && lockState.dateKey === currentDateKey;
    }, [lockState, currentUserId, currentDateKey]);

    // 【100pt 統治】閲覧制限範囲の境界判定 (IS 8601 準拠)
    const isOutOfRange = useMemo(() => {
        if (canEditBoard && user?.role === 'admin') return false; // 管理者は全能
        const target = new Date(currentDateKey);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const min = new Date(today);
        min.setMonth(today.getMonth() - 1);
        min.setDate(1); // 1ヶ月前の月初

        // 1ヶ月後の月末を計算
        const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
        const lastDayOfNextMonth = new Date(nextMonth.getFullYear(), nextMonth.getMonth() + 1, 0);
        
        return target < min || target > lastDayOfNextMonth;
    }, [currentDateKey, canEditBoard, user?.role]);

    const editMode = useMemo(() => {
        // 非管理者の場合、過去日付は編集不可。管理者は過去日付でもロックが取れれば編集可能。
        const pastCheck = (user?.role === 'admin') ? true : !isPastDate;
        return isTargetDateLockedByMe && pastCheck && canEditBoard;
    }, [isTargetDateLockedByMe, isPastDate, canEditBoard, user?.role]);

    const boardMode = useMemo(() => {
        // 非管理者の場合、過去日付は VIEW_PAST 固定。管理者は過去でもロックがあれば EDIT 許可。
        if (isPastDate && user?.role !== 'admin') return 'VIEW_PAST' as const;
        if (state.jobs.some(j => j.status === 'confirmed')) return 'CONFIRM' as const;
        if (!editMode) return 'VIEW_LOCKED' as const;
        return 'EDIT' as const;
    }, [isPastDate, state.jobs, editMode, user?.role]);

    const lockedBy = lockState.userId;

    // ----------------------------------------
    // 4. History Management
    // ----------------------------------------
    const recordHistory = useCallback(() => {
        setHistory(prev => ({
            past: [...prev.past, { ...state }],
            future: []
        }));
    }, [state]);

    // ----------------------------------------
    // 5. Lock Management
    // ----------------------------------------
    const requestEditLock = useCallback(async () => {
        if (!canEditBoard || isPastDate) {
            const reason = isPastDate ? "過去の配車は「閲覧のみ」です（不変原則）" : "編集権限がありません（閲覧専用）";
            showNotification(reason, "error");
            return;
        }

        const currentTime = new Date().toISOString();
        const TIMEOUT_MS = 15 * 60 * 1000;

        try {
            const { data: route, error: fetchError } = await supabase
                .from('routes')
                .select('edit_locked_by, edit_locked_at, last_activity_at')
                .eq('date', currentDateKey)
                .maybeSingle();

            if (fetchError) throw fetchError;

            const isLockExpired = route?.last_activity_at &&
                (Date.now() - new Date(route.last_activity_at as string).getTime()) > TIMEOUT_MS;

            if (!route?.edit_locked_by || isLockExpired || route.edit_locked_by === currentUserId) {
                let updateData: any = {
                    date: currentDateKey,
                    edit_locked_by: currentUserId,
                    edit_locked_at: currentTime,
                    last_activity_at: currentTime,
                    updated_at: currentTime
                };

                if (!route) {
                    updateData = { ...updateData, jobs: [], drivers: [], splits: [], pending: [] };
                }

                const { error: upsertError } = await supabase.from('routes').upsert(updateData, { onConflict: 'date' });
                
                // [GUARDRAIL] Ignore 409 Conflict in lock-refresh context
                // This happens when multiple tabs/syncs try to refresh the lock simultaneously.
                if (upsertError && (upsertError as any).code !== '409' && (upsertError as any).status !== 409) {
                    throw upsertError;
                }

                setLockState({ userId: currentUserId || null, dateKey: currentDateKey });
                showNotification("編集モードで開きました", "success");
            } else {
                setLockState({ userId: route.edit_locked_by, dateKey: currentDateKey });
                showNotification(`${route.edit_locked_by}が編集中です`, "info");
            }
        } catch (e: any) {
            if (user?.role === 'admin') {
                setLockState({ userId: currentUserId || null, dateKey: currentDateKey });
                showNotification("管理者モード（ローカル保存）で開きました", "success");
            } else {
                showNotification("同期中にエラーが発生しました。", "error");
            }
        }
    }, [currentUserId, currentDateKey, canEditBoard, isPastDate, showNotification, user?.role, user]);

    const releaseEditLock = useCallback(async () => {
        if (!editMode) return;
        try {
            await (supabase.from('routes') as any).update({
                edit_locked_by: null,
                edit_locked_at: null,
                last_activity_at: null
            }).eq('date', currentDateKey).eq('edit_locked_by', currentUserId || '');

            setLockState({ userId: null, dateKey: currentDateKey });
            showNotification("編集権を解放しました", "success");
        } catch (e) {
            console.error("Release lock error:", e);
        }
    }, [editMode, currentDateKey, currentUserId, showNotification]);

    useEffect(() => {
        if (!editMode) return;
        const interval = setInterval(async () => {
            await (supabase.from('routes') as any).update({
                last_activity_at: new Date().toISOString()
            }).eq('date', currentDateKey).eq('edit_locked_by', currentUserId || '');
        }, 60000);
        return () => clearInterval(interval);
    }, [editMode, currentDateKey, currentUserId]);

    useEffect(() => {
        if (isDataLoaded && !isPastDate) requestEditLock();
    }, [isDataLoaded, currentDateKey, requestEditLock, isPastDate]);

    useEffect(() => {
        return () => { if (editMode) releaseEditLock(); };
    }, [currentDateKey, editMode, releaseEditLock]);

    // ----------------------------------------
    // 6. Persistence Operations
    // ----------------------------------------
    const handleSave = async (reason = '一時保存') => {
        if (state.pendingJobs.length === 0 && state.jobs.length === 0) {
            showNotification("⚠️ データが空です。保存を中止します。", "error");
            return;
        }

        try {
            const { error } = await supabase.rpc('rpc_execute_board_update', {
                p_date: currentDateKey,
                p_new_state: {
                    ...state,
                    pending: state.pendingJobs,
                    applied_template_id: appliedTemplateId,
                    edit_locked_by: currentUserId,
                    edit_locked_at: new Date().toISOString()
                },
                p_ext_data: {
                    applied_template_id: appliedTemplateId
                },
                p_decision_type: 'MANUAL_SAVE',
                p_reason: reason,
                p_user_id: currentUserId,
                p_client_meta: { source: 'useBoardData' }
            } as any);

            if (error) throw error;
            setIsOffline(false);
            showNotification("一時保存しました (SDR記録完了)", "success");
            
            // Update cache after successful save
            mutateCache(state);
            setHistory({ past: [], future: [] }); // Clear history after save
        } catch (err: any) {
            console.error("Save error:", err);
            setIsOffline(true);
            const msg = `保存に失敗しました。\nコード: ${err?.code || 'Unknown'}\n詳細: ${err?.message || err?.details || ''}\nヒント: ${err?.hint || 'なし'}`;
            showNotification(msg, "error");
        }
    };

    const handleConfirmAll = async (reason = '一括確定') => {
        if (!editMode) return;
        const plannedJobs = state.jobs.filter(j => j.status === 'planned');
        if (plannedJobs.length === 0) {
            showNotification("確定待ちの案件はありません", "info");
            return;
        }

        if (!window.confirm(`${plannedJobs.length}件の案件を確定しますか？`)) return;

        try {
            const confirmedJobs = state.jobs.map(j => ({ ...j, status: 'confirmed' as const }));
            const newState = { ...state, jobs: confirmedJobs };

            const { error } = await supabase.rpc('rpc_execute_board_update', {
                p_date: currentDateKey,
                p_new_state: {
                    ...newState,
                    pending: newState.pendingJobs,
                    edit_locked_by: currentUserId,
                    edit_locked_at: new Date().toISOString()
                },
                p_ext_data: {},
                p_decision_type: 'BULK_CONFIRM',
                p_reason: reason,
                p_user_id: currentUserId,
                p_client_meta: { source: 'useBoardData' }
            } as any);

            if (error) throw error;
            setState(newState);
            mutateCache(newState);
            showNotification(`${plannedJobs.length}件を確定しました`, "success");
            setHistory({ past: [], future: [] });
        } catch (err: any) {
            const msg = `一括確定に失敗しました。\nコード: ${err?.code || 'Unknown'}\n詳細: ${err?.message || ''}`;
            showNotification(msg, "error");
        }
    };

    const handleExceptionChange = async (
        jobId: string,
        exceptionType: 'MOVE' | 'REASSIGN' | 'SWAP' | 'CANCEL' | 'ADD',
        proposedState: any,
        reasonMasterId?: string,
        reasonFreeText?: string,
        promoteRequested?: boolean
    ) => {
        try {
            const targetJob = state.jobs.find(j => j.id === jobId);
            if (!targetJob) throw new Error("Job not found");

            const updatedJobs = state.jobs.map(j => j.id === jobId ? { ...j, ...proposedState } : j);
            const newState = { ...state, jobs: updatedJobs };

            const { error: exceptionError } = await supabase.from('board_exceptions').insert([{
                route_date: currentDateKey, job_id: jobId, exception_type: exceptionType,
                before_state: { ...targetJob }, after_state: proposedState,
                reason_master_id: reasonMasterId, reason_free_text: reasonFreeText,
                promote_requested: promoteRequested, actor_id: currentUserId
            }]);

            if (exceptionError) throw exceptionError;

            await supabase.rpc('rpc_execute_board_update', {
                p_date: currentDateKey,
                p_new_state: {
                    ...newState,
                    pending: newState.pendingJobs,
                    edit_locked_by: currentUserId,
                    edit_locked_at: new Date().toISOString()
                },
                p_ext_data: { exception_type: exceptionType, job_id: jobId },
                p_decision_type: `EXCEPTION_${exceptionType}`,
                p_reason: reasonFreeText || reasonMasterId || 'Exception Change',
                p_user_id: currentUserId,
                p_client_meta: { source: 'useBoardData' }
            } as any);

            setState(newState);
            mutateCache(newState);
            setHistory({ past: [], future: [] });
            showNotification(`例外変更を記録しました`, "success");
        } catch (err: any) {
            const msg = `例外記録に失敗しました。\nコード: ${err?.code || 'Unknown'}`;
            showNotification(msg, "error");
        }
    };

    const undo = useCallback(() => {
        if (!editMode) return;
        setHistory(prev => {
            if (prev.past.length === 0) return prev;
            const previous = prev.past[prev.past.length - 1];
            setState(previous as BoardState);
            return { past: prev.past.slice(0, -1), future: [state, ...prev.future] };
        });
    }, [editMode, state]);

    const redo = useCallback(() => {
        if (!editMode) return;
        setHistory(prev => {
            if (prev.future.length === 0) return prev;
            const next = prev.future[0];
            setState(next as BoardState);
            return { past: [...prev.past, state], future: prev.future.slice(1) };
        });
    }, [editMode, state]);

    const addColumn = useCallback(() => {
        if (!editMode) return;
        setState(prev => {
            const newCourseName = String.fromCharCode(65 + prev.drivers.length);
            const newColumn: BoardDriver = {
                id: `course_${newCourseName}_${Date.now()}`,
                name: `${newCourseName}コース`,
                driverName: '未割当', currentVehicle: '未定', course: newCourseName,
                color: 'bg-gray-50 border-gray-200'
            };
            return { ...prev, drivers: [...prev.drivers, newColumn] };
        });
        recordHistory();
    }, [editMode, recordHistory]);

    const deleteColumn = useCallback((columnId: string) => {
        if (!editMode) return;
        if (state.jobs.some(j => j.driverId === columnId)) {
            showNotification('案件が残っているコースは削除できません', 'error');
            return;
        }
        setState(prev => ({ ...prev, drivers: prev.drivers.filter(d => d.id !== columnId) }));
        recordHistory();
    }, [editMode, state.jobs, recordHistory, showNotification]);

    const unassignJob = useCallback((jobId: string) => {
        if (!editMode) {
            const reason = isPastDate ? "計画は確定されています（変更不可）" : "編集権限がありません";
            showNotification(reason, "error");
            return;
        }

        const targetJob = state.jobs.find(j => j.id === jobId);
        if (!targetJob) {
            console.error("[unassignJob] Job not found in state.jobs:", jobId);
            showNotification("案件が見つかりません。画面を更新してください。", "error");
            return;
        }

        if (targetJob.status === 'confirmed') {
            showNotification("確定済みの案件は未配車リストに戻せません（例外操作が必要です）", "error");
            return;
        }

        // [Self-Healing] Restore original timeConstraint if possible
        let restoredTimeConstraint = targetJob.timeConstraint;
        if (targetJob.location_id) {
            const masterPoint = masterPoints.find(p => p.id === targetJob.location_id);
            if (masterPoint) {
                // Restore logic consistent with JobAdapter
                restoredTimeConstraint = masterPoint.time_constraint || 
                    ((masterPoint.time_constraint_type && masterPoint.time_constraint_type !== 'NONE') ? '要確認' : undefined);
            }
        }

        setState(prev => ({
            ...prev,
            jobs: prev.jobs.filter(j => j.id !== jobId),
            pendingJobs: [...prev.pendingJobs, { 
                ...targetJob, 
                driverId: undefined, 
                startTime: undefined,
                timeConstraint: restoredTimeConstraint
            }]
        }));
        recordHistory();
        showNotification("案件を未配車リストに戻しました", "success");
    }, [editMode, state.jobs, masterPoints, recordHistory, showNotification]);

    const assignPendingJob = useCallback((job: BoardJob, driverId: string, time: string) => {
        if (!editMode) return;
        setState(prev => ({
            ...prev,
            jobs: [...prev.jobs, { ...job, driverId, startTime: time }],
            pendingJobs: prev.pendingJobs.filter(j => j.id !== job.id)
        }));
        recordHistory();
    }, [editMode, recordHistory]);

    const handleRegisterTemplate = useCallback(async (name: string, dayOfWeek: number, nthWeek: number | null, absentCount: number = 0, description?: string) => {
        try {
            // バリデーション (100点統治: 防御的ロジック)
            if (!name || name.trim() === '') {
                showNotification("テンプレート名を入力してください", "error");
                return;
            }
            if (absentCount < 0) {
                showNotification("欠員想定数に負の値は設定できません", "error");
                return;
            }

            console.info("[handleRegisterTemplate] Saving with parameters:", { name, dayOfWeek, nthWeek, absentCount, description });

            // 骨格データのみを抽出（driver情報, startTime, status を除外）
            // 【100点品質】マスタ属性をスケルトンに封印 (亡霊A対策)
            const skeletonJobs = state.jobs.map(job => ({
                id: job.id,
                job_title: job.title,
                duration_minutes: job.duration,
                area: job.area ?? null,
                required_vehicle: job.requiredVehicle ?? null,
                visit_slot: job.visitSlot ?? null,
                task_type: job.taskType ?? null,
                customer_id: job.location_id ?? null,
                customer_name: job.title ?? null,
                // マスタ属性を JobAdapter が復元可能な形式で封入
                time_constraint_type: (job as any).time_constraint_type ?? null,
                special_type: (job as any).special_type ?? null
            }));
            const { data, error } = await supabase.from('board_templates').insert({
                name, day_of_week: dayOfWeek, nth_week: nthWeek,
                jobs_json: skeletonJobs as any,
                absent_count: absentCount,
                description: description ?? null,
                is_active: true
            }).select();

            if (error) throw error;
            
            // 【物理的証明】保存成功時に ID をログ出力
            if (data && data.length > 0) {
                console.log('[handleRegisterTemplate] Persistence success. ID:', data[0].id);
            }

            // 保存成功後にサジェストリストを更新 (亡霊B対策)
            refreshTemplateDescriptions();

            showNotification(`テンプレート「${name}」を登録しました`, "success");
        } catch (e: any) {
            console.error("[handleRegisterTemplate] Registration failed:", e);
            
            let message = "登録に失敗しました";
            if (e.code === '23505') {
                message = `テンプレート名「${name}」は既に存在します。別の名前を指定してください。`;
            } else if (e.message) {
                message = `登録エラー: ${e.message}`;
            }

            showNotification(message, "error");
            throw e;
        }
    }, [state.jobs, showNotification]);

    const handleApplyTemplate = useCallback(async (templateId: string) => {
        setIsApplyingTemplate(true);
        try {
            const { data, error } = await supabase
                .from('board_templates')
                .select('*')
                .eq('id', templateId)
                .single();

            if (error) throw error;
            if (!data) throw new Error('Template not found');

            const skeletonJobs = (data.jobs_json as any) as SkeletonJob[];
            
            // マスタバリデーション用IDセット作成
            const validLocationIds = new Set(masterPoints.map(p => p.location_id));

            // TemplateExpander が期待する Driver 形式に変換 (BoardDriver -> Database Driver 互換)
            const availableDriversForExpander = state.drivers.map(d => ({
                id: d.id,
                driver_name: d.driverName,
                vehicle_number: d.currentVehicle, // License Matcher が参照
                display_order: (d as any).display_order ?? 999,
                created_at: new Date().toISOString(), // Dummy for type
            })) as any[];

            // 展開
            const result = TemplateExpander.expand(
                skeletonJobs,
                availableDriversForExpander,
                validLocationIds
            );

            // 状態反映 (Result Job -> BoardJob 変換)
            setState(prev => ({
                ...prev,
                jobs: result.assigned.map(j => JobAdapter.mapToBoardJob(j)),
                pendingJobs: result.unassigned.map(j => JobAdapter.mapToBoardJob(j))
            }));
            setAppliedTemplateId(templateId);
            recordHistory();
            
            showNotification(`テンプレート「${data.name}」を適用しました`, "success");
        } catch (e) {
            console.error('[useBoardData] Template apply failed:', e);
            showNotification("テンプレートの適用に失敗しました", "error");
        } finally {
            setIsApplyingTemplate(false);
        }
    }, [state.drivers, masterPoints, showNotification, recordHistory]);

    const handleUpdateAppliedTemplate = useCallback(async () => {
        if (!appliedTemplateId) return null;
        try {
            const { data, error } = await supabase
                .from('board_templates')
                .select('*')
                .eq('id', appliedTemplateId)
                .single();
            if (error) throw error;
            
            const originalSkeleton = (data.jobs_json as any[]) || [];
            
            // 現在の盤面の状態からスケルトン（Partial<BoardJob>）を生成
            const currentSkeleton = state.jobs.map(job => ({
                location_id: job.location_id,
                visitSlot: job.visitSlot,
                duration: job.duration,
                requiredVehicle: job.requiredVehicle,
                title: job.title,
                taskType: job.taskType,
                area: job.area
            }));

            const { TemplateDiffCalculator } = await import('../../logic/core/TemplateDiffCalculator');
            const diffs = TemplateDiffCalculator.calculate(originalSkeleton, currentSkeleton);
            
            return {
                diffs,
                templateName: data.name,
                templateId: data.id
            };
        } catch (e) {
            console.error('Fetch template for diff failed:', e);
            showNotification("差分の計算に失敗しました", "error");
            return null;
        }
    }, [appliedTemplateId, state.jobs, showNotification]);

    const handleFinalizeTemplateUpdate = useCallback(async (templateId: string, newJobs: any[]) => {
        try {
            const { error } = await supabase
                .from('board_templates')
                .update({ jobs_json: newJobs, updated_at: new Date().toISOString() })
                .eq('id', templateId);
            if (error) throw error;
            showNotification("テンプレートを更新しました", "success");
        } catch (e) {
            console.error('Template update failed:', e);
            showNotification("テンプレートの更新に失敗しました", "error");
            throw e;
        }
    }, [showNotification]);

    return {
        masterDrivers,
        drivers: state.drivers, setDrivers: (d: BoardDriver[] | ((prev: BoardDriver[]) => BoardDriver[])) => setState(s => ({ ...s, drivers: typeof d === 'function' ? d(s.drivers) : d })),
        jobs: state.jobs, setJobs: (j: BoardJob[] | ((prev: BoardJob[]) => BoardJob[])) => setState(s => ({ ...s, jobs: typeof j === 'function' ? j(s.jobs) : j })),
        pendingJobs: state.pendingJobs, setPendingJobs: (pj: BoardJob[] | ((prev: BoardJob[]) => BoardJob[])) => setState(s => ({ ...s, pendingJobs: typeof pj === 'function' ? pj(s.pendingJobs) : pj })),
        splits: state.splits, setSplits: (sp: BoardSplit[] | ((prev: BoardSplit[]) => BoardSplit[])) => setState(s => ({ ...s, splits: typeof sp === 'function' ? sp(s.splits) : sp })),
        isDataLoaded, isOffline, isSyncing, isExpanding: isApplyingTemplate,
        editMode, lockedBy, canEditBoard, isPastDate, boardMode, isOutOfRange,
        showNotification,
        requestEditLock, releaseEditLock, handleSave, handleConfirmAll,
        handleExceptionChange, exceptionReasons, templateDescriptions, confirmedSnapshot,
        handleRegisterTemplate, handleApplyTemplate, assignPendingJob, unassignJob,
        handleUpdateAppliedTemplate, handleFinalizeTemplateUpdate, appliedTemplateId,
        history, recordHistory, undo, redo,
        addColumn, deleteColumn
    };
};
