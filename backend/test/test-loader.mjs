// ES Module loader for Mocha tests using register()
import { register } from 'node:module';
import { pathToFileURL } from 'node:url';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Register the loader with the correct path
const loaderUrl = new URL('./test-loader-impl.mjs', import.meta.url);
register(loaderUrl);

// Export the loader functions for direct use
export { resolve, load } from './test-loader-impl.mjs';
