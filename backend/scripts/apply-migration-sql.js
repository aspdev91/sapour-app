/*
  Runs a Prisma migration SQL file manually over the pooled connection with verbose logging.
  Useful when DIRECT_URL (5432) is blocked but DATABASE_URL (6543 via PgBouncer) works.
*/

const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

async function run() {
  const prisma = new PrismaClient({ log: ['query', 'warn', 'error'] });
  const migrationPath = path.resolve(
    __dirname,
    '../prisma/migrations/20250926164800_update_template_revision_system/migration.sql',
  );

  console.log('=== Manual Migration Executor ===');
  console.log('Using SQL file:', migrationPath);

  if (!fs.existsSync(migrationPath)) {
    console.error('Migration file not found.');
    process.exit(1);
  }

  const sql = fs.readFileSync(migrationPath, 'utf8');

  // Split statements naively by semicolon, but keep semicolons inside $$ ... $$ blocks (not used here)
  const statements = sql
    .split(/;\s*\n/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
    .map((s) => (s.endsWith(';') ? s : s + ';'));

  console.log(`Loaded ${statements.length} SQL statements.`);

  try {
    const start = Date.now();
    await prisma.$executeRawUnsafe('BEGIN;');

    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];
      console.log(`\n-- Executing statement ${i + 1}/${statements.length} --`);
      console.log(stmt);
      try {
        await prisma.$executeRawUnsafe(stmt);
        console.log(`✅ Statement ${i + 1} OK`);
      } catch (err) {
        console.error(`❌ Statement ${i + 1} FAILED:`, err.message);
        console.error('Rolling back...');
        await prisma.$executeRawUnsafe('ROLLBACK;');
        process.exit(1);
      }
    }

    await prisma.$executeRawUnsafe('COMMIT;');
    console.log(`\n✅ Migration applied successfully in ${Date.now() - start}ms`);
  } catch (e) {
    console.error('Unexpected error applying migration:', e);
    try {
      await prisma.$executeRawUnsafe('ROLLBACK;');
    } catch {}
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
