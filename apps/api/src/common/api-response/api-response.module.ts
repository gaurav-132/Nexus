import { Module } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';

import { APIErrorFilter } from './api-error.filter.js';
import { APIResponseInterceptor } from './api-response.interceptor.js';

@Module({
    providers: [
        { provide: APP_FILTER, useClass: APIErrorFilter },
        { provide: APP_INTERCEPTOR, useClass: APIResponseInterceptor },
    ],
})
export class APIResponseModule {}
