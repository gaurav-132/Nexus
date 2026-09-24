import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';

import { AppModule } from './app.module.js';
import { getAllowedWebOrigins } from './common/http/allowed-origins.js';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    const config = app.get(ConfigService);
    const webOrigins = getAllowedWebOrigins(config);
    const port = Number(config.get<string>('PORT') ?? 3001);

    if (!Number.isInteger(port) || port < 1 || port > 65_535) {
        throw new Error('PORT must be a valid TCP port number.');
    }

    app.enableShutdownHooks();
    app.setGlobalPrefix('api/v1');
    app.enableCors({
        origin: webOrigins,
        credentials: true,
        methods: ['GET', 'POST', 'OPTIONS'],
        allowedHeaders: ['Content-Type'],
    });

    await app.listen(port);
}

await bootstrap();
