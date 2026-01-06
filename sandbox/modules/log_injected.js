const _logCallback = _log;
global.console = {
    log: (...args) => _logCallback.applyIgnored(undefined, args, { arguments: { copy: true } }),
    error: (...args) => _logCallback.applyIgnored(undefined, args, { arguments: { copy: true } }),
    warn: (...args) => _logCallback.applyIgnored(undefined, args, { arguments: { copy: true } }),
    info: (...args) => _logCallback.applyIgnored(undefined, args, { arguments: { copy: true } }),
};

