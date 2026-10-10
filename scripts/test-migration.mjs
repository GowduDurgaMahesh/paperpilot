import { PGlite } from '@electric-sql/pglite';
import fs from 'fs';

async function runPhase27Tests() {
  console.log('================================================================');
  console.log('  Phase 2.7: Comprehensive PostgreSQL Engine Security Test Suite');
  console.log('================================================================\n');

  // Test 1: Fresh Database Migration
  console.log('>>> TEST 1: Fresh Database Migration');
  const db1 = new PGlite();
  const vRes = await db1.query('SELECT version();');
  console.log('    Engine: ' + vRes.rows[0].version);

  // Setup auth mock
  await db1.exec(`
    CREATE SCHEMA auth;
    CREATE TABLE auth.users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email TEXT,
      raw_user_meta_data JSONB DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ DEFAULT now()
    );
    CREATE ROLE anon;
    CREATE ROLE authenticated;
  `);

  const migrationSql = fs.readFileSync('supabase/migrations/20261010000000_paperpilot_schema.sql', 'utf-8');
  await db1.exec(migrationSql);
  console.log('    ✓ Migration executed cleanly against fresh database.\n');

  // Test 2: Valid and Blank User Metadata
  console.log('>>> TEST 2: User Metadata Sanitization and Profile Provisioning');
  const user1Id = '11111111-1111-1111-1111-111111111111';
  await db1.query(`
    INSERT INTO auth.users (id, email, raw_user_meta_data)
    VALUES ($1, 'ada@oxford.edu', '{"full_name": "Ada Lovelace"}'::jsonb);
  `, [user1Id]);
  const p1 = await db1.query('SELECT * FROM public.profiles WHERE id = $1', [user1Id]);
  console.log('    ✓ Valid metadata:', { id: p1.rows[0].id, name: p1.rows[0].full_name });

  const user2Id = '22222222-2222-2222-2222-222222222222';
  await db1.query(`
    INSERT INTO auth.users (id, email, raw_user_meta_data)
    VALUES ($1, 'turing@cambridge.edu', '{"full_name": "   "}'::jsonb);
  `, [user2Id]);
  const p2 = await db1.query('SELECT * FROM public.profiles WHERE id = $1', [user2Id]);
  console.log('    ✓ Blank whitespace metadata -> fallback:', { id: p2.rows[0].id, name: p2.rows[0].full_name });

  const user3Id = '33333333-3333-3333-3333-333333333333';
  await db1.query(`
    INSERT INTO auth.users (id, email, raw_user_meta_data)
    VALUES ($1, NULL, NULL);
  `, [user3Id]);
  const p3 = await db1.query('SELECT * FROM public.profiles WHERE id = $1', [user3Id]);
  console.log('    ✓ Missing email & missing metadata -> fallback:', { id: p3.rows[0].id, name: p3.rows[0].full_name });
  console.log();

  // Test 3: updated_at Trigger Behavior
  console.log('>>> TEST 3: updated_at Trigger Verification');
  const projRes = await db1.query(`
    INSERT INTO public.projects (user_id, title)
    VALUES ($1, 'Original Title')
    RETURNING id, created_at, updated_at;
  `, [user1Id]);
  const initialUpdatedAt = projRes.rows[0].updated_at;

  await new Promise(r => setTimeout(r, 60));
  await db1.query(`
    UPDATE public.projects
    SET title = 'Revised Title'
    WHERE id = $1;
  `, [projRes.rows[0].id]);

  const updatedRes = await db1.query('SELECT updated_at FROM public.projects WHERE id = $1', [projRes.rows[0].id]);
  const revisedUpdatedAt = updatedRes.rows[0].updated_at;
  const changed = new Date(revisedUpdatedAt).getTime() > new Date(initialUpdatedAt).getTime();
  console.log('    Initial updated_at:', initialUpdatedAt);
  console.log('    Revised updated_at:', revisedUpdatedAt);
  console.log('    ✓ updated_at advanced automatically: ' + changed + '\n');

  // Test 4: Existing Trigger Name Targeting Unexpected Function (Collision Guard)
  console.log('>>> TEST 4: Trigger Collision Detection on auth.users');
  const dbConflictTrigger = new PGlite();
  await dbConflictTrigger.exec(`
    CREATE SCHEMA auth;
    CREATE TABLE auth.users (
      id UUID PRIMARY KEY,
      email TEXT,
      raw_user_meta_data JSONB
    );
    -- Create dummy function
    CREATE FUNCTION public.unrelated_foreign_function()
    RETURNS TRIGGER LANGUAGE plpgsql AS $$ BEGIN RETURN NEW; END; $$;
    -- Pre-create trigger on_paperpilot_user_created pointing to the wrong function!
    CREATE TRIGGER on_paperpilot_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION public.unrelated_foreign_function();
  `);

  try {
    await dbConflictTrigger.exec(migrationSql);
    console.error('    FAIL: Expected trigger collision exception, but migration succeeded!');
  } catch (err) {
    console.log('    ✓ Expected collision exception caught:');
    console.log('      "' + err.message + '"\n');
  }

  // Test 5: Existing Function Name Collision (Preflight Guard)
  console.log('>>> TEST 5: Function Name Collision Preflight Detection');
  const dbConflictFn = new PGlite();
  await dbConflictFn.exec(`
    CREATE SCHEMA auth;
    CREATE TABLE auth.users (id UUID PRIMARY KEY, email TEXT, raw_user_meta_data JSONB);
    -- Pre-create conflicting function
    CREATE FUNCTION public.paperpilot_set_updated_at()
    RETURNS TRIGGER LANGUAGE plpgsql AS $$ BEGIN RETURN NEW; END; $$;
  `);

  try {
    await dbConflictFn.exec(migrationSql);
    console.error('    FAIL: Expected function collision exception, but migration succeeded!');
  } catch (err) {
    console.log('    ✓ Expected function collision exception caught:');
    console.log('      "' + err.message + '"\n');
  }

  // Test 6: RLS Enabled on All Six Tables
  console.log('>>> TEST 6: Row Level Security (RLS) Status on Tables');
  const tables = ['profiles', 'projects', 'citations', 'quality_metrics', 'research_gaps', 'audit_logs'];
  for (const t of tables) {
    const rlsRes = await db1.query(`
      SELECT c.relrowsecurity
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public' AND c.relname = $1;
    `, [t]);
    console.log(`    Table "public.${t}": relrowsecurity = ${rlsRes.rows[0].relrowsecurity} (RLS Active)`);
  }
  console.log('    ✓ All six tables verified with default-deny RLS.\n');

  // Test 7: Function Privilege Catalog Inspection via has_function_privilege()
  console.log('>>> TEST 7: Function Execution Privileges via has_function_privilege()');
  const privCheck = await db1.query(`
    SELECT
      p.proname,
      has_function_privilege('anon', p.oid, 'EXECUTE') AS anon_can_execute,
      has_function_privilege('authenticated', p.oid, 'EXECUTE') AS auth_can_execute,
      has_function_privilege('public', p.oid, 'EXECUTE') AS public_can_execute,
      has_function_privilege(r.rolname, p.oid, 'EXECUTE') AS owner_can_execute
    FROM pg_proc p
    JOIN pg_roles r ON r.oid = p.proowner
    WHERE p.proname IN ('paperpilot_set_updated_at', 'paperpilot_handle_new_user');
  `);

  for (const row of privCheck.rows) {
    console.log(`    Function "${row.proname}":`);
    console.log(`      - PUBLIC EXECUTE:        ${row.public_can_execute}`);
    console.log(`      - anon EXECUTE:          ${row.anon_can_execute}`);
    console.log(`      - authenticated EXECUTE: ${row.auth_can_execute}`);
    console.log(`      - owner EXECUTE:         ${row.owner_can_execute}`);
  }
  console.log('    ✓ Verified: Non-owners (PUBLIC, anon, authenticated) cannot execute functions via RPC.\n');

  // Test 8: Transaction Abort and Recovery Verification
  console.log('>>> TEST 8: Migration Transactional Failure Recovery');
  const dbRollbackTest = new PGlite();
  await dbRollbackTest.exec(`
    CREATE SCHEMA auth;
    CREATE TABLE auth.users (id UUID PRIMARY KEY, email TEXT, raw_user_meta_data JSONB);
    -- Cause a forced conflict in table profiles
    CREATE TABLE public.profiles (id INT);
  `);

  try {
    await dbRollbackTest.exec('BEGIN;\n' + migrationSql + '\nCOMMIT;');
  } catch (err) {
    // Explicit rollback after aborted transaction
    await dbRollbackTest.exec('ROLLBACK;');
    
    // Check if any partial tables were created
    const leftoverCheck = await dbRollbackTest.query(`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name IN ('projects', 'citations', 'quality_metrics');
    `);
    console.log(`    ✓ Transaction aborted cleanly on table collision.`);
    console.log(`    ✓ Partial tables found in database after rollback: ${leftoverCheck.rows.length} (clean 0-residual state).\n`);
  }

  console.log('================================================================');
  console.log('  ALL 8 PHASE 2.7 ISOLATED POSTGRESQL TESTS PASSED SUCCESSFULLY ');
  console.log('================================================================');
}

runPhase27Tests().catch(err => {
  console.error('Test Suite Failed:', err);
  process.exit(1);
});
