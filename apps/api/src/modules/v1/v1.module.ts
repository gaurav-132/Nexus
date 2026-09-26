import { Module } from '@nestjs/common';

import { AuthModule } from './auth/auth.module.js';
import { AdminModule } from './admin/admin.module.js';

@Module({
    imports: [AuthModule, AdminModule],
})
export class V1Module {}
