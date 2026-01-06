
/**
 * Reads the contents of a file in the current directory.
 * @param fileName The name of the file to read.
 * @param encoding Optional encoding (e.g., 'utf-8'). If not specified, returns a Buffer.
 * @returns The contents of the file as a string (if encoding specified) or Buffer.
 */
export function readFile(fileName: string, encoding?: string): string | Buffer {
    const fs = require('fs');
    if (encoding !== undefined) {
        return fs.readFileSync(fileName, encoding);
    }
    return fs.readFileSync(fileName);
}


