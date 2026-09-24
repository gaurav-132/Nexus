import {
    Injectable,
    OnModuleDestroy,
    OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

import * as schema from './schema/index.js';

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
    private readonly pool: Pool;
    readonly db: NodePgDatabase<typeof schema>;

    constructor(config: ConfigService) {
        const connectionString = config.getOrThrow<string>('DATABASE_URL');

        try {
            const databaseUrl = new URL(connectionString);
            if (
                databaseUrl.protocol !== 'postgres:' &&
                databaseUrl.protocol !== 'postgresql:'
            ) {
                throw new Error();
            }
        } catch {
            throw new Error(
                'DATABASE_URL must be a valid PostgreSQL connection URL.',
            );
        }

        this.pool = new Pool({
            connectionString,
        });

        this.db = drizzle(this.pool, { schema });
    }

    async onModuleInit() {
        await this.pool.query('select 1');
    }

    async onModuleDestroy() {
        await this.pool.end();
    }
}
