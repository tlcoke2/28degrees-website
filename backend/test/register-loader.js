// Register the loader with Node.js
import { register } from 'node:module';
import { pathToFileURL } from 'node:url';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Register the test loader implementation
register(pathToFileURL(path.join(__dirname, 'test-loader-impl.mjs')));
