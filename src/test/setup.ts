// src/test/setup.ts
import './setup-dom';
import './setup-matchers';
import './setup-mocks';

if (typeof window !== 'undefined') {
    Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: (query: string) => ({
            matches: false,
            media: query,
            onchange: null,
            addListener: () => { }, // Deprecated
            removeListener: () => { }, // Deprecated
            addEventListener: () => { },
            removeEventListener: () => { },
            dispatchEvent: () => { },
        }),
    });
}

