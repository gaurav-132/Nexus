import { Module } from '@nestjs/common';

import { DatabaseModule } from '../../../database/database.module.js';
import { AuthModule } from '../auth/auth.module.js';
import { TenantsModule } from '../tenants/tenants.module.js';
import { AdminController } from './admin.controller.js';
import { PlatformAdminGuard } from './admin.guard.js';
import { AdminRepository } from './admin.repository.js';
import { AdminService } from './admin.service.js';

@Module({
    imports: [DatabaseModule, AuthModule, TenantsModule],
    controllers: [AdminController],
    providers: [AdminRepository, AdminService, PlatformAdminGuard],
})
export class AdminModule {}
