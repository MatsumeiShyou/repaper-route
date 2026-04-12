// src/test/setup.ts
import './setup-dom';
import './setup-matchers';
import './setup-mocks';

// Mock Environment Variables
if (typeof process !== 'undefined') {
    process.env.OPENAI_API_KEY = 'sk-mock-key';
    process.env.STAGING_URL = 'http://localhost:5173';
}

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

