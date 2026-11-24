import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../../../app.module';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import {
  ISessionTokenCodec,
  SESSION_TOKEN_CODEC_PORT,
} from '../../github-integration/domain/ports/github-integration.port';
import { GITHUB_SESSION_COOKIE } from '../../github-integration/presentation/session-auth.guard';
import { DomainExceptionFilter } from '../presentation/domain-exception.filter';

describe('VereditoSec API Multi-User Integration (AppModule + PostgreSQL)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let sessionCodec: ISessionTokenCodec;

  const userA = 'test-user-a-1001';
  const userB = 'test-user-b-2002';
  let cookieA: string;
  let cookieB: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalFilters(new DomainExceptionFilter());
    await app.init();

    prisma = moduleRef.get(PrismaService);
    sessionCodec = moduleRef.get<ISessionTokenCodec>(SESSION_TOKEN_CODEC_PORT);

    cookieA = `${GITHUB_SESSION_COOKIE}=${encodeURIComponent(
      sessionCodec.seal({
        githubUserId: userA,
        login: 'user-a',
        avatarUrl: null,
        accessToken: 'gho_fake_a',
        issuedAt: Date.now(),
        expiresAt: Date.now() + 600_000,
      }),
    )}`;

    cookieB = `${GITHUB_SESSION_COOKIE}=${encodeURIComponent(
      sessionCodec.seal({
        githubUserId: userB,
        login: 'user-b',
        avatarUrl: null,
        accessToken: 'gho_fake_b',
        issuedAt: Date.now(),
        expiresAt: Date.now() + 600_000,
      }),
    )}`;
  });

  afterAll(async () => {
    if (prisma) {
      await prisma.probeAuditLog.deleteMany({
        where: { ownerGithubUserId: { in: [userA, userB] } },
      });
      await prisma.scan.deleteMany({
        where: { ownerGithubUserId: { in: [userA, userB] } },
      });
      await prisma.targetAuthorization.deleteMany({
        where: { ownerGithubUserId: { in: [userA, userB] } },
      });
    }
    if (app) {
      await app.close();
    }
  });

  it('GET /api/health remains public and reports database up', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/health')
      .expect(200);

    expect(res.body).toMatchObject({
      service: 'veredito-sec-api',
      status: 'ok',
      database: 'up',
    });
  });

  it('rejects unauthenticated requests to scans and authorizations with 401', async () => {
    await request(app.getHttpServer()).get('/api/scans').expect(401);
    await request(app.getHttpServer()).get('/api/authorizations').expect(401);
    await request(app.getHttpServer())
      .post('/api/scans')
      .send({ repositoryUrl: 'manifest://unauth' })
      .expect(401);
  });

  it('isolates scans, authorizations and audit logs strictly per authenticated GitHub user', async () => {
    // 1. User A creates & verifies a target authorization
    const authCreateRes = await request(app.getHttpServer())
      .post('/api/authorizations')
      .set('Cookie', cookieA)
      .send({
        targetUrl: 'http://localhost:3999',
        method: 'LOCAL_DEV_SANDBOX',
      })
      .expect(201);

    const authIdA = authCreateRes.body.authorization.id as string;
    await request(app.getHttpServer())
      .post(`/api/authorizations/${authIdA}/verify`)
      .set('Cookie', cookieA)
      .expect(201);

    // 2. User B cannot see or reuse User A's authorization
    const listAuthB = await request(app.getHttpServer())
      .get('/api/authorizations')
      .set('Cookie', cookieB)
      .expect(200);
    expect(listAuthB.body).toEqual([]);

    await request(app.getHttpServer())
      .post('/api/scans')
      .set('Cookie', cookieB)
      .send({
        repositoryUrl: 'manifest://b-hijack-attempt',
        manifestFiles: [
          { path: 'package.json', content: '{"dependencies":{"lodash":"4.17.20"}}' },
        ],
        targetUrl: 'http://localhost:3999',
        authorizationId: authIdA,
      })
      .expect(403);

    // 3. User A creates a scan; User B cannot see or fetch it
    const scanCreateRes = await request(app.getHttpServer())
      .post('/api/scans')
      .set('Cookie', cookieA)
      .send({
        repositoryUrl: 'manifest://user-a-private-history',
        manifestFiles: [
          { path: 'package.json', content: '{"dependencies":{}}' },
        ],
      })
      .expect(201);

    const scanIdA = scanCreateRes.body.id as string;

    const listA = await request(app.getHttpServer())
      .get('/api/scans')
      .set('Cookie', cookieA)
      .expect(200);
    expect(listA.body.some((s: { id: string }) => s.id === scanIdA)).toBe(true);

    const listB = await request(app.getHttpServer())
      .get('/api/scans')
      .set('Cookie', cookieB)
      .expect(200);
    expect(listB.body).toEqual([]);

    await request(app.getHttpServer())
      .get(`/api/scans/${scanIdA}`)
      .set('Cookie', cookieB)
      .expect(404);

    // 4. User B cannot revoke/delete User A's authorization; User A permanently removes it
    await request(app.getHttpServer())
      .delete(`/api/authorizations/${authIdA}`)
      .set('Cookie', cookieB)
      .expect(404);

    const deleteRes = await request(app.getHttpServer())
      .delete(`/api/authorizations/${authIdA}`)
      .set('Cookie', cookieA)
      .expect(200);
    expect(deleteRes.body).toMatchObject({
      id: authIdA,
      deleted: true,
      status: 'REVOKED',
    });

    const listAuthAfterDelete = await request(app.getHttpServer())
      .get('/api/authorizations')
      .set('Cookie', cookieA)
      .expect(200);
    expect(listAuthAfterDelete.body).toEqual([]);

    // 5. User B cannot delete User A's scan; User A permanently deletes it from history
    await request(app.getHttpServer())
      .delete(`/api/scans/${scanIdA}`)
      .set('Cookie', cookieB)
      .expect(404);

    const deleteScanRes = await request(app.getHttpServer())
      .delete(`/api/scans/${scanIdA}`)
      .set('Cookie', cookieA)
      .expect(200);
    expect(deleteScanRes.body).toEqual({ id: scanIdA, deleted: true });

    await request(app.getHttpServer())
      .get(`/api/scans/${scanIdA}`)
      .set('Cookie', cookieA)
      .expect(404);
  });
});
