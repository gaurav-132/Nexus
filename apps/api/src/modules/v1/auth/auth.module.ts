import { Module } from '@nestjs/common';

import { DatabaseModule } from '../../../database/database.module.js';
import { AuthController } from './auth.controller.js';
import { AuthGuard } from './auth-context.js';
import { AuthRepository } from './auth.repository.js';
import { AuthService } from './auth.service.js';

@Module({
    imports: [DatabaseModule],
    controllers: [AuthController],
    providers: [AuthService, AuthRepository, AuthGuard],
    exports: [AuthGuard],
})
export class AuthModule {}
