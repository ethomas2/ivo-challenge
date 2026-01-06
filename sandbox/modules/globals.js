const fs = require('fs');
const path = require('path');

async function register(context) {
    const injectedCode = fs.readFileSync(
        path.join(__dirname, 'globals_injected.js'),
        'utf-8'
    );
    await context.eval(injectedCode);
}

module.exports = { register };

