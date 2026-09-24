import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { resolve } from 'node:path';

import { APIResponseModule } from './common/api-response/api-response.module.js';
import { V1Module } from './modules/v1/v1.module.js';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: [
                resolve(process.cwd(), '.env'),
                resolve(process.cwd(), '../../.env'),
            ],
        }),
        APIResponseModule,
        V1Module,
    ],
})
export class AppModule {}
