import { Global, Module } from '@nestjs/common';

import { DatabaseService } from './database.service.js';

@Global()
@Module({
    providers: [
        {
            provide: DatabaseService,
            useFactory: () => DatabaseService.getInstance(),
        },
    ],
    exports: [DatabaseService],
})
export class DatabaseModule {}
