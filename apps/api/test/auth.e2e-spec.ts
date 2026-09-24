import { INestApplication } from '@nestjs/common';
import { eq, inArray } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';
import request from 'supertest';

import { AppModule } from '../src/app.module.js';
import { DatabaseService } from '../src/database/database.service.js';
import {
    invitations,
    tenants,
    users,
} from '../src/database/schema/index.js';
import { createSessionToken, hashSessionToken } from '../src/modules/v1/auth/auth-security.js';
import { Test } from '@nestjs/testing';

describe('Auth API (e2e)', () => {
    let app: INestApplication;
    let database: DatabaseService;
    const workspaceSlug = `e2e-${randomUUID().slice(0, 12)}`;
    const invitedWorkspaceSlug = `e2e-invite-${randomUUID().slice(0, 8)}`;
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
                .where(inArray(tenants.slug, [workspaceSlug, invitedWorkspaceSlug]));
        }
        await app?.close();
    });

    it('registers an identity, accepts a membership invitation, selects a workspace, and revokes sessions', async () => {
        const origin = 'http://localhost:3000';
        const server = request(app.getHttpServer());

        const shortPassword = await server
            .post('/api/v1/auth/register')
            .set('Origin', origin)
            .send({
                workspaceName: 'E2E Workspace',
                workspaceSlug,
                name: 'Test Owner',
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
                name: 'Test Owner',
                email,
                password,
            })
            .expect(201);

        expect(registration.body).toMatchObject({
            success: true,
            data: {
                email,
                name: 'Test Owner',
                activeMembership: {
                    role: 'owner',
                    tenant: { slug: workspaceSlug },
                },
            },
        });
        expect(JSON.stringify(registration.body)).not.toContain('passwordHash');
        const signupCookie = registration.headers['set-cookie'][0].split(';')[0];
        expect(registration.headers['set-cookie'][0]).toContain('HttpOnly');

        const [user] = await database.db
            .select({ passwordHash: users.passwordHash })
            .from(users)
            .where(eq(users.email, email));
        expect(user.passwordHash).not.toBe(password);
        expect(user.passwordHash.startsWith('scrypt$v1$')).toBe(true);

        await server
            .get('/api/v1/auth/me')
            .set('Cookie', signupCookie)
            .expect(200)
            .expect(({ body }) => {
                expect(body.data.email).toBe(email);
                expect(body.data.activeMembership.tenant.slug).toBe(workspaceSlug);
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
            .send({ email, password })
            .expect(200);
        const loginCookie = login.headers['set-cookie'][0].split(';')[0];
        await server
            .get('/api/v1/auth/me')
            .set('Cookie', loginCookie)
            .expect(200)
            .expect(({ body }) => {
                expect(body.data.memberships).toHaveLength(1);
                expect(body.data.activeMembership.tenant.slug).toBe(workspaceSlug);
            });

        const [owner] = await database.db
            .select({ id: users.id })
            .from(users)
            .where(eq(users.email, email));
        const [invitedTenant] = await database.db
            .insert(tenants)
            .values({
                id: randomUUID(),
                name: 'Invited Workspace',
                slug: invitedWorkspaceSlug,
            })
            .returning({ id: tenants.id });
        const invitationToken = createSessionToken();
        await database.db.insert(invitations).values({
            id: randomUUID(),
            tenantId: invitedTenant.id,
            email,
            role: 'admin',
            tokenHash: hashSessionToken(invitationToken),
            invitedBy: owner.id,
            expiresAt: new Date(Date.now() + 60_000),
        });

        const acceptance = await server
            .post(`/api/v1/auth/invitations/${invitationToken}/accept`)
            .set('Origin', origin)
            .send({})
            .expect(200);
        const acceptedCookie = acceptance.headers['set-cookie'][0].split(';')[0];
        await server
            .get('/api/v1/auth/me')
            .set('Cookie', acceptedCookie)
            .expect(200)
            .expect(({ body }) => {
                expect(body.data.memberships).toHaveLength(2);
                expect(body.data.activeMembership.tenant.slug).toBe(
                    invitedWorkspaceSlug,
                );
            });

        await server
            .post('/api/v1/auth/select-workspace')
            .set('Origin', origin)
            .set('Cookie', acceptedCookie)
            .send({ tenantSlug: workspaceSlug })
            .expect(200);
        await server
            .get('/api/v1/auth/me')
            .set('Cookie', acceptedCookie)
            .expect(200)
            .expect(({ body }) => {
                expect(body.data.activeMembership.tenant.slug).toBe(workspaceSlug);
            });

        await server
            .post('/api/v1/auth/login')
            .set('Origin', origin)
            .send({ email, password: 'incorrect-password' })
            .expect(401);
    });
});
