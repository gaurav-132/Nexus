import { spawnSync } from 'node:child_process';
import {
    existsSync,
    mkdirSync,
    readFileSync,
    renameSync,
    writeFileSync,
} from 'node:fs';
import { join, resolve } from 'node:path';

const [moduleName, ...drizzleArgs] = process.argv.slice(2);

if (!moduleName || !/^[a-z][a-z0-9_-]*$/.test(moduleName)) {
    console.error(
        'Usage: pnpm --filter api db:generate <module> [Drizzle Kit options]',
    );
    process.exit(1);
}

const migrationsRoot = resolve('drizzle');
const journalPath = join(migrationsRoot, 'meta', '_journal.json');
const journalBefore = JSON.parse(readFileSync(journalPath, 'utf8'));
const result = spawnSync('drizzle-kit', ['generate', ...drizzleArgs], {
    stdio: 'inherit',
});

if (result.error) throw result.error;
if (result.status !== 0) process.exit(result.status ?? 1);

const journal = JSON.parse(readFileSync(journalPath, 'utf8'));
if (journal.entries.length === journalBefore.entries.length) {
    process.exit(0);
}

const migration = journal.entries.at(-1);
const generatedPath = join(migrationsRoot, `${migration.tag}.sql`);
const moduleDirectory = join(migrationsRoot, moduleName);
const moduleTag = `${moduleName}/${migration.tag}`;
const destinationPath = join(migrationsRoot, `${moduleTag}.sql`);

if (!existsSync(generatedPath)) {
    throw new Error(`Generated migration not found: ${generatedPath}`);
}

mkdirSync(moduleDirectory, { recursive: true });
if (existsSync(destinationPath)) {
    throw new Error(`Migration already exists: ${destinationPath}`);
}

renameSync(generatedPath, destinationPath);
migration.tag = moduleTag;
const temporaryJournalPath = `${journalPath}.tmp`;
writeFileSync(temporaryJournalPath, `${JSON.stringify(journal, null, 2)}\n`);
renameSync(temporaryJournalPath, journalPath);
console.log(`Stored migration in ${destinationPath}`);
