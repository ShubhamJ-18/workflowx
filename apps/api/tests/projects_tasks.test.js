const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../src/app');
const { prisma } = require('../src/config/prisma');

describe('Projects, Tasks & Dependency API Integration Tests', () => {
  let userCookie = null;
  let testProject = null;
  let taskAId = null;
  let taskBId = null;

  before(async () => {
    // Login as Alex Chen
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'alex.lead@workflowx.dev', password: 'Password123!' });
    userCookie = res.headers['set-cookie'].find((c) => c.includes('workflowx_session='));

    testProject = await prisma.project.findFirst({
      where: { name: { contains: 'WorkFlowX SaaS Platform' } },
    });
  });

  after(async () => {
    if (taskAId || taskBId) {
      await prisma.taskDependency.deleteMany({
        where: {
          OR: [
            { predecessorTaskId: { in: [taskAId, taskBId].filter(Boolean) } },
            { successorTaskId: { in: [taskAId, taskBId].filter(Boolean) } },
          ],
        },
      });
      if (taskBId) await prisma.task.delete({ where: { id: taskBId } }).catch(() => {});
      if (taskAId) await prisma.task.delete({ where: { id: taskAId } }).catch(() => {});
    }
  });

  it('creates two tasks successfully', async () => {
    // Create Task A
    const resA = await request(app)
      .post('/api/v1/tasks')
      .set('Cookie', userCookie)
      .send({
        projectId: testProject.id,
        title: 'Integration Test Task A (Predecessor)',
        description: 'First task in chain',
        status: 'TODO',
        priority: 'HIGH',
      })
      .expect(201);

    assert.equal(resA.body.success, true);
    taskAId = resA.body.data.task.id;

    // Create Task B
    const resB = await request(app)
      .post('/api/v1/tasks')
      .set('Cookie', userCookie)
      .send({
        projectId: testProject.id,
        title: 'Integration Test Task B (Successor)',
        description: 'Second task in chain',
        status: 'TODO',
        priority: 'MEDIUM',
      })
      .expect(201);

    assert.equal(resB.body.success, true);
    taskBId = resB.body.data.task.id;
  });

  it('rejects assigning task to an outsider not in the team', async () => {
    // Dr. Watson is not in Core Platform Engineering team
    const drWatson = await prisma.user.findUnique({
      where: { email: 'watson.research@workflowx.dev' },
    });

    const res = await request(app)
      .post('/api/v1/tasks')
      .set('Cookie', userCookie)
      .send({
        projectId: testProject.id,
        title: 'Invalid Assignment Task',
        assigneeId: drWatson.id,
      })
      .expect(400);

    assert.equal(res.body.success, false);
    assert.match(res.body.message, /authorized member/i);
  });

  it('creates a valid dependency (Task A -> Task B)', async () => {
    const res = await request(app)
      .post(`/api/v1/tasks/${taskBId}/dependencies`)
      .set('Cookie', userCookie)
      .send({ predecessorTaskId: taskAId })
      .expect(201);

    assert.equal(res.body.success, true);
    assert.equal(res.body.data.dependency.predecessorTaskId, taskAId);
    assert.equal(res.body.data.dependency.successorTaskId, taskBId);
  });

  it('rejects circular dependency (Task B -> Task A) with 400 Bad Request', async () => {
    const res = await request(app)
      .post(`/api/v1/tasks/${taskAId}/dependencies`)
      .set('Cookie', userCookie)
      .send({ predecessorTaskId: taskBId })
      .expect(400);

    assert.equal(res.body.success, false);
    assert.match(res.body.message, /circular dependency rejected/i);
  });

  it('adds a comment to a task', async () => {
    const res = await request(app)
      .post(`/api/v1/tasks/${taskAId}/comments`)
      .set('Cookie', userCookie)
      .send({ content: 'Testing task comment functionality.' })
      .expect(201);

    assert.equal(res.body.success, true);
    assert.equal(res.body.data.comment.content, 'Testing task comment functionality.');
  });
});
