const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../src/app');
const { prisma } = require('../src/config/prisma');

describe('Authorization & Cross-Team Security RBAC Tests', () => {
  let alexCookie = null;
  let watsonCookie = null;
  let coreTeamProject = null;
  let researchTeam = null;

  before(async () => {
    // Login as Alex Chen (Owner of Core Platform Engineering)
    const alexRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'alex.lead@workflowx.dev', password: 'Password123!' });
    alexCookie = alexRes.headers['set-cookie'].find((c) => c.includes('workflowx_session='));

    // Login as Dr. Watson (Owner of Isolated AI Research Team)
    const watsonRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'watson.research@workflowx.dev', password: 'Password123!' });
    watsonCookie = watsonRes.headers['set-cookie'].find((c) => c.includes('workflowx_session='));

    // Find Alex's core project
    coreTeamProject = await prisma.project.findFirst({
      where: { name: { contains: 'WorkFlowX SaaS Platform' } },
    });

    // Find Dr. Watson's team
    researchTeam = await prisma.team.findFirst({
      where: { name: { contains: 'Applied AI' } },
    });
  });

  it('allows Alex to view projects in his authorized team', async () => {
    const res = await request(app)
      .get(`/api/v1/projects/${coreTeamProject.id}`)
      .set('Cookie', alexCookie)
      .expect(200);

    assert.equal(res.body.success, true);
    assert.equal(res.body.data.project.id, coreTeamProject.id);
  });

  it('STRICT SECURITY: Blocks Dr. Watson from accessing Alex’s private project with 403 Forbidden', async () => {
    const res = await request(app)
      .get(`/api/v1/projects/${coreTeamProject.id}`)
      .set('Cookie', watsonCookie)
      .expect(403);

    assert.equal(res.body.success, false);
    assert.match(res.body.message, /Access denied/i);
  });

  it('STRICT SECURITY: Blocks Alex from viewing Dr. Watson’s private team with 403 Forbidden', async () => {
    const res = await request(app)
      .get(`/api/v1/teams/${researchTeam.id}`)
      .set('Cookie', alexCookie)
      .expect(403);

    assert.equal(res.body.success, false);
    assert.match(res.body.message, /Access denied/i);
  });

  it('rejects unauthenticated requests to projects with 401', async () => {
    await request(app)
      .get(`/api/v1/projects/${coreTeamProject.id}`)
      .expect(401);
  });
});
