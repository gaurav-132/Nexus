import { OnModuleDestroy } from '@nestjs/common';
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

import * as schema from './schema/index.js';

type Database = NodePgDatabase<typeof schema>;

export class DatabaseService implements OnModuleDestroy {
    private static instance: DatabaseService | null = null;

    private readonly pool: Pool;
    readonly db: Database;

    private constructor() {
        const connectionString = process.env.DATABASE_URL;

        if (!connectionString) {
            throw new Error('DATABASE_URL is not configured');
        }

        this.pool = new Pool({
            connectionString,
        });

        this.db = drizzle(this.pool, { schema });
    }

    static getInstance(): DatabaseService {
        if (!DatabaseService.instance) {
            DatabaseService.instance = new DatabaseService();
        }

        return DatabaseService.instance;
    }

    async onModuleDestroy() {
        await this.pool.end();
        DatabaseService.instance = null;
    }
}
