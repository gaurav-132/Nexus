import { Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';

import { DatabaseService } from '../../../database/database.service.js';
import { platformAdmins } from '../../../database/schema/index.js';

@Injectable()
export class AdminRepository {
    constructor(private readonly database: DatabaseService) {}

    async isPlatformAdmin(userId: string): Promise<boolean> {
        const [grant] = await this.database.db
            .select({ userId: platformAdmins.userId })
            .from(platformAdmins)
            .where(eq(platformAdmins.userId, userId))
            .limit(1);
        return Boolean(grant);
    }
}
