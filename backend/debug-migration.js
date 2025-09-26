const { PrismaClient } = require('@prisma/client');

async function debugMigration() {
  console.log('=== Migration Debug Script ===');
  console.log('Time:', new Date().toISOString());

  // Test basic connection
  console.log('\n1. Testing basic database connection...');
  const prisma = new PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
  });

  try {
    const startConnect = Date.now();
    await prisma.$connect();
    console.log(`✅ Connection successful (${Date.now() - startConnect}ms)`);

    // Test a simple query
    console.log('\n2. Testing simple query...');
    const startQuery = Date.now();
    const result = await prisma.$queryRaw`SELECT version();`;
    console.log(`✅ Query successful (${Date.now() - startQuery}ms):`, result);

    // Check current database schema
    console.log('\n3. Checking current tables...');
    const startTables = Date.now();
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `;
    console.log(`✅ Tables query successful (${Date.now() - startTables}ms)`);
    console.log(
      'Current tables:',
      tables.map((t) => t.table_name),
    );

    // Check migration history
    console.log('\n4. Checking migration history...');
    try {
      const migrations = await prisma.$queryRaw`
        SELECT migration_name, finished_at, applied_steps_count, logs 
        FROM _prisma_migrations 
        ORDER BY finished_at DESC 
        LIMIT 5;
      `;
      console.log('Recent migrations:', migrations);
    } catch (err) {
      console.log('No migration history found (this might be expected):', err.message);
    }

    // Check for locks or long-running transactions
    console.log('\n5. Checking for database locks...');
    const locks = await prisma.$queryRaw`
      SELECT 
        pid,
        usename,
        application_name,
        client_addr,
        state,
        query_start,
        state_change,
        query
      FROM pg_stat_activity 
      WHERE state != 'idle' 
      AND pid != pg_backend_pid()
      ORDER BY query_start;
    `;
    console.log('Active connections:', locks);
  } catch (error) {
    console.error('❌ Error during debug:', error);
  } finally {
    console.log('\n6. Disconnecting...');
    await prisma.$disconnect();
    console.log('✅ Disconnected');
  }
}

debugMigration().catch(console.error);
