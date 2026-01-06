global.modules.fs = {
    readFileSync: (fileName, encoding) => {
        return _readFileSync.applySync(undefined, [fileName, encoding], { arguments: { copy: true }, result: { copy: true } });
    },
    
};

