// This file helps Mocha work with ES modules
import { register } from 'node:module';
import { pathToFileURL } from 'node:url';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Register the loader
register('./test-loader.mjs', pathToFileURL(path.join(__dirname, 'test-loader.mjs')));
