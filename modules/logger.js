/**
 * logger.js — Unified logging for all modules
 */
const fs   = require('fs').promises;
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');

function ts() { return new Date().toISOString(); }

function log(message, level = 'INFO') {
  const line = `[${ts()}] [${level}] ${message}`;
  console.log(line);
  return line;
}

async function appendToLog(filename, content) {
  try {
    await fs.appendFile(path.join(DATA_DIR, filename), content);
  } catch (e) {
    console.error(`[LOGGER] Could not write to ${filename}: ${e.message}`);
  }
}

async function readLog(filename) {
  try {
    return await fs.readFile(path.join(DATA_DIR, filename), 'utf-8');
  } catch {
    return '';
  }
}

module.exports = { log, appendToLog, readLog, ts };
