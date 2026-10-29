import {createRequire} from 'node:module';

// Use the website backend's canonical configuration, independent of working directory.
// The loader preserves existing process-environment overrides.
const require=createRequire(import.meta.url);
require('../../server/config/environment.js').loadEnvironment();
