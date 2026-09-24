import { INestApplication } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';
import request from 'supertest';

import { AppModule } from '../src/app.module.js';
import { DatabaseService } from '../src/database/database.service.js';
import { tenants, users } from '../src/database/schema/index.js';
import { Test } from '@nestjs/testing';

describe('Auth API (e2e)', () => {
    let app: INestApplication;
    let database: DatabaseService;
    const workspaceSlug = `e2e-${randomUUID().slice(0, 12)}`;
    const email = 'owner@example.test';
    const password = 'e2e-test-password-with-12-chars';

    beforeAll(async () => {
        const moduleRef = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleRef.createNestApplication();
        app.setGlobalPrefix('api/v1');
        await app.init();
        database = app.get(DatabaseService);
    });

    afterAll(async () => {
        if (database) {
            await database.db
                .delete(tenants)
                .where(eq(tenants.slug, workspaceSlug));
        }
        await app?.close();
    });

    it('registers, persists, authenticates, logs in, and revokes a session', async () => {
        const origin = 'http://localhost:3000';
        const server = request(app.getHttpServer());

        const shortPassword = await server
            .post('/api/v1/auth/register')
            .set('Origin', origin)
            .send({
                workspaceName: 'E2E Workspace',
                workspaceSlug,
                firstName: 'Test',
                email,
                password: '12345678',
            })
            .expect(400);
        expect(shortPassword.body.success).toBe(false);
        expect(shortPassword.body.error.details.password).toBeDefined();

        const registration = await server
            .post('/api/v1/auth/register')
            .set('Origin', origin)
            .send({
                workspaceName: 'E2E Workspace',
                workspaceSlug,
                firstName: 'Test',
                email,
                password,
            })
            .expect(201);

        expect(registration.body).toMatchObject({
            success: true,
            data: {
                email,
                role: 'owner',
                tenant: { slug: workspaceSlug },
            },
        });
        expect(JSON.stringify(registration.body)).not.toContain('passwordHash');
        const signupCookie = registration.headers['set-cookie'][0].split(';')[0];
        expect(registration.headers['set-cookie'][0]).toContain('HttpOnly');

        const [user] = await database.db
            .select({ passwordHash: users.passwordHash })
            .from(users)
            .innerJoin(tenants, eq(users.tenantId, tenants.id))
            .where(eq(tenants.slug, workspaceSlug));
        expect(user.passwordHash).not.toBe(password);
        expect(user.passwordHash.startsWith('scrypt$v1$')).toBe(true);

        await server
            .get('/api/v1/auth/me')
            .set('Cookie', signupCookie)
            .expect(200)
            .expect(({ body }) => {
                expect(body.data.email).toBe(email);
                expect(body.data.tenant.slug).toBe(workspaceSlug);
            });

        await server
            .post('/api/v1/auth/logout')
            .set('Origin', origin)
            .set('Cookie', signupCookie)
            .expect(200);
        await server
            .get('/api/v1/auth/me')
            .set('Cookie', signupCookie)
            .expect(401);

        const login = await server
            .post('/api/v1/auth/login')
            .set('Origin', origin)
            .send({ workspaceSlug, email, password })
            .expect(200);
        const loginCookie = login.headers['set-cookie'][0].split(';')[0];
        await server
            .get('/api/v1/auth/me')
            .set('Cookie', loginCookie)
            .expect(200);

        await server
            .post('/api/v1/auth/login')
            .set('Origin', origin)
            .send({ workspaceSlug, email, password: 'incorrect-password' })
            .expect(401);
    });
});
