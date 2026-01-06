const ivm = require("isolated-vm");
const fs = require("fs");
const path = require("path");

async function register(context, { logs }) {
    context.global.setSync("_log", new ivm.Reference((...args) => {
        const serialized = args.map(arg => {
            if (typeof arg === 'object' && arg !== null) {
                try {
                    return JSON.stringify(arg);
                } catch (e) {
                    return String(arg);
                }
            }
            return String(arg);
        });
        logs.push(serialized.join(" "));
    }));
    
    const injectedCode = fs.readFileSync(
        path.join(__dirname, 'log_injected.js'),
        'utf-8'
    );
    await context.eval(injectedCode);
}

module.exports = { register };

