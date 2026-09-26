import { config } from 'dotenv';
import { Pool } from 'pg';
import { resolve } from 'node:path';

config({
    path: [resolve(process.cwd(), '.env'), resolve(process.cwd(), '../../.env')],
});

const emailArgumentIndex = process.argv.indexOf('--email');
const email = process.argv[emailArgumentIndex + 1]?.trim().toLowerCase();

if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    console.error(
        'Usage: pnpm --filter api admin:grant --email existing-user@example.com',
    );
    process.exit(1);
}

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
    console.error('DATABASE_URL is required.');
    process.exit(1);
}

const pool = new Pool({ connectionString });
try {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const user = await client.query(
            `SELECT id FROM users WHERE email = $1 AND status = 'active' FOR UPDATE`,
            [email],
        );
        if (user.rowCount !== 1) {
            throw new Error(
                'No active account exists for that email. Create/sign in to the normal Nexus account first.',
            );
        }

        const grant = await client.query(
            `INSERT INTO platform_admins (user_id) VALUES ($1) ON CONFLICT (user_id) DO NOTHING RETURNING user_id`,
            [user.rows[0].id],
        );
        await client.query('COMMIT');
        console.log(
            grant.rowCount === 1
                ? `Granted platform administrator access to ${email}.`
                : `${email} already has platform administrator access.`,
        );
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
} catch (error) {
    console.error(error instanceof Error ? error.message : 'Grant failed.');
    process.exitCode = 1;
} finally {
    await pool.end();
}
