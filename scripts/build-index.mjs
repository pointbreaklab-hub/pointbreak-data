#!/usr/bin/env node
/**
 * Builds index/network.json from the ledger.
 *
 * The client is a static page, so reading this network file by file would cost
 * one request per job plus one per event. That is fine at ten postings and
 * impossible at a thousand, and it burns GitHub's unauthenticated rate limit
 * for anyone who has not signed in. One bundled file fetched from
 * raw.githubusercontent.com costs one request, needs no token, and is cached by
 * the CDN.
 *
 * The index carries raw jobs and events, never computed scores. Scores stay
 * client-side so anyone can check the arithmetic, and changing the algorithm
 * does not require rebuilding this. It is a cache for fetch efficiency, and the
 * ledger underneath it remains the source of truth: delete this file and the
 * client falls back to walking the directories.
 *
 * No dependencies, so it runs anywhere Node does.
 */

import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;

async function listFiles(dir, extension) {
  try {
    const entries = await readdir(join(ROOT, dir));
    return entries.filter((name) => name.endsWith(extension));
  } catch (error) {
    if (error.code === 'ENOENT') return [];
    throw error;
  }
}

async function readJson(dir, name) {
  try {
    return JSON.parse(await readFile(join(ROOT, dir, name), 'utf8'));
  } catch (error) {
    // One malformed file must not take the whole index down, because the
    // ledger is append only and a bad line cannot be removed once written.
    console.warn(`skipping ${dir}/${name}: ${error.message}`);
    return null;
  }
}

async function readJsonl(dir, name) {
  const raw = await readFile(join(ROOT, dir, name), 'utf8');
  const lines = [];

  for (const line of raw.split('\n')) {
    if (!line.trim()) continue;
    try {
      lines.push(JSON.parse(line));
    } catch {
      console.warn(`skipping a malformed line in ${dir}/${name}`);
    }
  }

  return lines;
}

const jobs = [];
for (const name of await listFiles('jobs', '.json')) {
  const job = await readJson('jobs', name);
  if (job) jobs.push(job);
}

const events = [];
for (const name of await listFiles('events', '.jsonl')) {
  events.push(...(await readJsonl('events', name)));
}

const companies = [];
for (const name of await listFiles('companies', '.json')) {
  const company = await readJson('companies', name);
  if (company) companies.push(company);
}

// Sorted so an unchanged ledger produces a byte-identical file, which keeps the
// workflow from committing noise on every run.
jobs.sort((a, b) => String(a.id).localeCompare(String(b.id)));
events.sort((a, b) => String(a.id).localeCompare(String(b.id)));
companies.sort((a, b) => String(a.id).localeCompare(String(b.id)));

const index = {
  version: 1,
  generated_at: new Date().toISOString(),
  counts: { jobs: jobs.length, events: events.length, companies: companies.length },
  jobs,
  events,
  companies
};

await mkdir(join(ROOT, 'index'), { recursive: true });
await writeFile(join(ROOT, 'index/network.json'), JSON.stringify(index, null, 0) + '\n');

console.log(
  `index/network.json: ${jobs.length} jobs, ${events.length} events, ${companies.length} companies`
);
