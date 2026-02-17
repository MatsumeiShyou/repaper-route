import { vi } from 'vitest';
import '@testing-library/jest-dom';

// Supabase Mock
vi.mock('@/lib/supabase/client', () => ({
    supabase: {
        from: () => ({
            select: () => ({
                eq: () => ({
                    single: () => Promise.resolve({ data: null, error: null }),
                    maybeSingle: () => Promise.resolve({ data: null, error: null })
                }),
                order: () => Promise.resolve({ data: [], error: null })
            }),
            upsert: () => Promise.resolve({ error: null }),
            update: () => ({ eq: () => ({ eq: () => Promise.resolve({ error: null }) }) })
        }),
        channel: () => ({
            on: () => ({ subscribe: () => ({}) }),
            unsubscribe: () => { }
        }),
        removeChannel: () => { }
    }
}));

// ResizeObserver Mock
global.ResizeObserver = class ResizeObserver {
    observe() { }
    unobserve() { }
    disconnect() { }
};

// Canvas Confetti Mock
vi.mock('canvas-confetti', () => ({
    default: vi.fn()
}));

// DOM Mocks
Element.prototype.scrollIntoView = vi.fn();
HTMLCanvasElement.prototype.getContext = vi.fn();
