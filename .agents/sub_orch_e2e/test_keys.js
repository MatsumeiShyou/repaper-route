const store = {};
const mockStorage = Object.create(null);
Object.defineProperties(mockStorage, {
    getItem: { value: (key) => store[key] || null, enumerable: false, configurable: true },
    setItem: { value: (key, value) => { 
        store[key] = value; 
        mockStorage[key] = value;
    }, enumerable: false, configurable: true },
    removeItem: { value: (key) => { 
        delete store[key]; 
        delete mockStorage[key];
    }, enumerable: false, configurable: true },
});

Object.defineProperty(globalThis, 'localStorage', {
    value: mockStorage,
    writable: true,
    configurable: true
});

localStorage.setItem('sb-mock-auth-token', JSON.stringify({ access_token: 'fake-jwt-token' }));

console.log("localStorage keys:", Object.keys(localStorage));
console.log("localStorage.getItem:", localStorage.getItem('sb-mock-auth-token'));
