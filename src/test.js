import { deepEqual } from 'node:assert';
import { log, logLevels } from './log.js';

const context = {}
async function test(title, fn, ...args) {
  try {
    log(logLevels.ok, "TEST:", title);
    await fn({title, log, ctx:context, expect:deepEqual}, ...args);
  } catch (error) {
    log(logLevels.alert, "FAIL:", title);
    throw error;
  }
}

export { test };