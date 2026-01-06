global.modules = {};
global.exports = {};
global.module = { exports: global.exports };

global.require = (moduleName) => {
    if (global.modules[moduleName]) {
        return global.modules[moduleName];
    }
    throw new Error(`Cannot require module ${moduleName}`);
};

global.TextEncoder = class TextEncoder {
    encode(str) {
        const arr = new Uint8Array(str.length);
        for (let i = 0; i < str.length; i++) {
            arr[i] = str.charCodeAt(i);
        }
        return arr;
    }
};


global.Buffer = {
    isBuffer: (obj) => obj && obj instanceof Uint8Array,
    
    from: (input) => {
        if (typeof input === 'string') return new TextEncoder().encode(input);
        if (input instanceof ArrayBuffer) return new Uint8Array(input);
        return input;
    }
};

