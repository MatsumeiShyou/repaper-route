import { vi } from 'vitest';
import '@testing-library/jest-dom';

// Supabase Mock
vi.mock('@/lib/supabase/client', () => ({
    supabase: {
        from: () => {
            const chainable = {
                select: () => chainable,
                eq: () => ({
                    single: () => Promise.resolve({ data: null, error: null }),
                    maybeSingle: () => Promise.resolve({ data: null, error: null })
                }),
                order: () => chainable,
                then: (resolve: any) => resolve({ data: [], error: null })
            };
            return {
                ...chainable,
                upsert: () => Promise.resolve({ error: null }),
                update: () => ({ eq: () => ({ eq: () => Promise.resolve({ error: null }) }) })
            };
        },
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
Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(), // Deprecated
        removeListener: vi.fn(), // Deprecated
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
    })),
});
window.PointerEvent = class PointerEvent extends Event { } as any;
