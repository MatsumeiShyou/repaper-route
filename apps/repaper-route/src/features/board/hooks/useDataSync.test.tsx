/** @vitest-environment jsdom */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useDataSync } from './useDataSync';
import { supabase } from '../../../lib/supabase/client';

interface SupabaseQueryMock {
    select: () => SupabaseQueryMock;
    eq: (col: string, val: string) => SupabaseQueryMock;
    order: () => SupabaseQueryMock;
    then: (
        onfulfilled: (value: { data: unknown[] | null; error: Record<string, unknown> | null }) => unknown
    ) => Promise<unknown>;
}

type MockResponse = {
    data: Record<string, unknown>[] | null;
    error: Record<string, unknown> | null;
};

type MockResolver = (value: MockResponse) => void;

// We dynamically control mock responses for each table query
let mockCoursesResult: { data: Record<string, unknown>[] | null; error: Record<string, unknown> | null } = { data: [], error: null };
let mockAssignmentsResult: { data: Record<string, unknown>[] | null; error: Record<string, unknown> | null } = { data: [], error: null };
let mockJobsResult: { data: (Record<string, unknown> | null)[] | null; error: Record<string, unknown> | null } = { data: [], error: null };

// Delay functions to simulate network latency
let coursesDelayMs = 0;
let assignmentsDelayMs = 0;
let jobsDelayMs = 0;

vi.mock('../../../lib/supabase/client', () => {
    return {
        supabase: {
            from: vi.fn()
        }
    };
});

describe('useDataSync Empirical Verification & Stress Tests', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockCoursesResult = { data: [], error: null };
        mockAssignmentsResult = { data: [], error: null };
        mockJobsResult = { data: [], error: null };
        coursesDelayMs = 0;
        assignmentsDelayMs = 0;
        jobsDelayMs = 0;

        vi.mocked(supabase.from).mockImplementation((tableName: string) => {
            const query: SupabaseQueryMock = {
                select: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                order: vi.fn().mockReturnThis(),
                then: vi.fn().mockImplementation(async (onfulfilled: (value: { data: unknown[] | null; error: Record<string, unknown> | null }) => unknown) => {
                    let result: { data: unknown[] | null; error: Record<string, unknown> | null } = { data: [], error: null };
                    let delay = 0;

                    if (tableName === 'courses') {
                        result = mockCoursesResult;
                        delay = coursesDelayMs;
                    } else if (tableName === 'course_assignments') {
                        result = mockAssignmentsResult;
                        delay = assignmentsDelayMs;
                    } else if (tableName === 'jobs') {
                        result = mockJobsResult;
                        delay = jobsDelayMs;
                    }

                    if (delay > 0) {
                        await new Promise<void>(resolve => setTimeout(resolve, delay));
                    }

                    return Promise.resolve(result).then(onfulfilled);
                })
            };
            return query as unknown as ReturnType<typeof supabase.from>;
        });
    });

    it('should fetch data successfully and map properly', async () => {
        mockCoursesResult = {
            data: [
                { id: 'course-1', name: 'Course 1', display_color: '#ff0000', display_order: 1 }
            ],
            error: null
        };
        mockAssignmentsResult = {
            data: [
                { course_id: 'course-1', staff_id: 'staff-1', vehicle_id: 'vehicle-1', assigned_date: '2026-07-11' }
            ],
            error: null
        };
        mockJobsResult = {
            data: [
                { id: 'job-1', job_title: 'Job 1', bucket_type: 'AM', duration_minutes: 30, area: 'Area A', note: 'Note 1', is_spot: true, status: 'completed', scheduled_date: '2026-07-11' }
            ],
            error: null
        };

        const { result } = renderHook(() => useDataSync('2026-07-11'));

        expect(result.current.isLoading).toBe(true);

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        expect(result.current.error).toBeNull();
        expect(result.current.data).not.toBeNull();
        expect(result.current.data?.courses).toHaveLength(1);
        expect(result.current.data?.courses[0]).toEqual({
            id: 'course-1',
            name: 'Course 1',
            displayColor: '#ff0000',
            displayOrder: 1,
            staffId: 'staff-1',
            vehicleId: 'vehicle-1'
        });
        expect(result.current.data?.jobs).toHaveLength(1);
        expect(result.current.data?.jobs[0]).toEqual({
            id: 'job-1',
            title: 'Job 1',
            bucket: 'AM',
            duration: 30,
            area: 'Area A',
            requiredVehicle: undefined,
            note: 'Note 1',
            isSpot: true,
            taskType: 'collection',
            courseId: undefined,
            startTime: undefined,
            status: 'completed',
            location_id: undefined,
            address: undefined
        });
    });

    it('should trigger race condition when dateKey changes rapidly without cleanup', async () => {
        let coursesResolver11!: MockResolver;
        let assignmentsResolver11!: MockResolver;
        let jobsResolver11!: MockResolver;

        let coursesResolver12!: MockResolver;
        let assignmentsResolver12!: MockResolver;
        let jobsResolver12!: MockResolver;

        let coursesCount = 0;

        vi.mocked(supabase.from).mockImplementation((tableName: string) => {
            let currentDateKey = '';
            const query: SupabaseQueryMock = {
                select: vi.fn().mockReturnThis(),
                eq: vi.fn().mockImplementation((_col: string, val: string) => {
                    currentDateKey = val;
                    return query;
                }),
                order: vi.fn().mockReturnThis(),
                then: vi.fn().mockImplementation(async (onfulfilled: (value: { data: unknown[] | null; error: Record<string, unknown> | null }) => unknown) => {
                    let promise: Promise<MockResponse>;

                    if (tableName === 'courses') {
                        coursesCount++;
                        if (coursesCount === 1) {
                            promise = new Promise<MockResponse>(resolve => { coursesResolver11 = resolve; });
                        } else {
                            promise = new Promise<MockResponse>(resolve => { coursesResolver12 = resolve; });
                        }
                    } else {
                        if (currentDateKey === '2026-07-11') {
                            if (tableName === 'course_assignments') {
                                promise = new Promise<MockResponse>(resolve => { assignmentsResolver11 = resolve; });
                            } else {
                                promise = new Promise<MockResponse>(resolve => { jobsResolver11 = resolve; });
                            }
                        } else {
                            if (tableName === 'course_assignments') {
                                promise = new Promise<MockResponse>(resolve => { assignmentsResolver12 = resolve; });
                            } else {
                                promise = new Promise<MockResponse>(resolve => { jobsResolver12 = resolve; });
                            }
                        }
                    }

                    const res = await promise;
                    return Promise.resolve(res).then(onfulfilled);
                })
            };
            return query as unknown as ReturnType<typeof supabase.from>;
        });

        // 1. Initial render with date = '2026-07-11'
        const { result, rerender } = renderHook(({ date }) => useDataSync(date), {
            initialProps: { date: '2026-07-11' }
        });

        // 2. Immediately rerender with date = '2026-07-12' (simulates rapid user date switching)
        await act(async () => {
            rerender({ date: '2026-07-12' });
        });

        // 3. Resolve '2026-07-12' queries first (resolves fast)
        await act(async () => {
            coursesResolver12({ data: [{ id: 'course-1', name: 'Course 1' }], error: null });
        });
        await act(async () => {
            assignmentsResolver12({ data: [], error: null });
        });
        await act(async () => {
            jobsResolver12({ data: [{ id: 'job-12', job_title: 'Date 12 Job', bucket_type: 'AM' }], error: null });
        });

        // Wait for state updates for '2026-07-12'
        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
            expect(result.current.data?.jobs[0].title).toBe('Date 12 Job');
        });

        // 4. Resolve '2026-07-11' queries last (resolves slow)
        await act(async () => {
            if (typeof coursesResolver11 === 'function') {
                coursesResolver11({ data: [{ id: 'course-1', name: 'Course 1' }], error: null });
            }
        });
        await new Promise(resolve => setTimeout(resolve, 10));
        await act(async () => {
            if (typeof assignmentsResolver11 === 'function') {
                assignmentsResolver11({ data: [], error: null });
            }
        });
        await new Promise(resolve => setTimeout(resolve, 10));
        await act(async () => {
            if (typeof jobsResolver11 === 'function') {
                jobsResolver11({ data: [{ id: 'job-11', job_title: 'Date 11 Job', bucket_type: 'PM' }], error: null });
            }
        });

        // Wait to see if the state got overwritten by the slower request
        await new Promise(resolve => setTimeout(resolve, 50));

        console.log('Race condition test - FINAL JOB TITLE:', result.current.data?.jobs[0]?.title);
        
        // This assertion will FAIL if the race condition occurs (i.e. if the hook is overwritten by Date 11)
        expect(result.current.data?.jobs[0].title).toBe('Date 12 Job');
    });

    it('should crash or fail to load data when corrupt database payload contains null elements in jobs', async () => {
        mockCoursesResult = { data: [], error: null };
        mockAssignmentsResult = { data: [], error: null };
        mockJobsResult = {
            data: [
                null,
                { id: 'valid-job', job_title: 'Valid Job', bucket_type: 'PM' }
            ],
            error: null
        };

        const { result } = renderHook(() => useDataSync('2026-07-11'));

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        console.log('Corrupt job test - FULL RESULT:', JSON.stringify(result.current));
        expect(result.current.error).toBeNull();
        expect(result.current.data).not.toBeNull();
        expect(result.current.data?.jobs).toHaveLength(1);
        expect(result.current.data?.jobs[0].id).toBe('valid-job');
    });

    it('should format error using fallback string when Supabase returns a plain object error without inheriting from Error', async () => {
        const plainObjectError = {
            message: 'Database connection failed',
            code: 'PGRST100'
        };

        mockCoursesResult = {
            data: null,
            error: plainObjectError
        };

        const { result } = renderHook(() => useDataSync('2026-07-11'));

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        console.log('Plain error object test - FULL RESULT:', JSON.stringify(result.current));
        expect(result.current.error).toBe('データ取得エラー');
    });
});
