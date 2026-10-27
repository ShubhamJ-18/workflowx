/**
 * WorkFlowX Development Database Seed
 * Generates realistic teams, projects, dependency graphs, risk scenarios, and demo accounts.
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function hashPassword(plain) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(plain, salt);
}

async function main() {
  console.log('🌱 Seeding database with realistic development data...');

  // Clean existing tables in proper relational order
  await prisma.comment.deleteMany({});
  await prisma.taskDependency.deleteMany({});
  await prisma.task.deleteMany({});
  await prisma.project.deleteMany({});
  await prisma.invitation.deleteMany({});
  await prisma.activityLog.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.teamMember.deleteMany({});
  await prisma.session.deleteMany({});
  await prisma.passwordResetToken.deleteMany({});
  await prisma.team.deleteMany({});
  await prisma.user.deleteMany({});

  const defaultPasswordHash = await hashPassword('Password123!');

  // 1. Create Users
  const alex = await prisma.user.create({
    data: {
      name: 'Alex Chen',
      email: 'alex.lead@workflowx.dev',
      passwordHash: defaultPasswordHash,
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    },
  });

  const sarah = await prisma.user.create({
    data: {
      name: 'Sarah Connor',
      email: 'sarah.eng@workflowx.dev',
      passwordHash: defaultPasswordHash,
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    },
  });

  const marcus = await prisma.user.create({
    data: {
      name: 'Marcus Brody',
      email: 'marcus.dev@workflowx.dev',
      passwordHash: defaultPasswordHash,
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    },
  });

  const elena = await prisma.user.create({
    data: {
      name: 'Elena Rostova',
      email: 'elena.design@workflowx.dev',
      passwordHash: defaultPasswordHash,
      avatarUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150',
    },
  });

  // Isolated user for cross-team authorization testing
  const drWatson = await prisma.user.create({
    data: {
      name: 'Dr. John Watson',
      email: 'watson.research@workflowx.dev',
      passwordHash: defaultPasswordHash,
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
    },
  });

  console.log('✔ Created users: Alex (Lead), Sarah (Eng), Marcus (Dev), Elena (Design), Dr. Watson');

  // 2. Create Team 1: Core Platform Team
  const coreTeam = await prisma.team.create({
    data: {
      name: 'Core Platform Engineering',
      description: 'Primary engineering team responsible for architecture, security, and the risk engine.',
      createdBy: alex.id,
    },
  });

  // Assign Team Memberships
  await prisma.teamMember.createMany({
    data: [
      { teamId: coreTeam.id, userId: alex.id, role: 'OWNER' },
      { teamId: coreTeam.id, userId: sarah.id, role: 'ADMIN' },
      { teamId: coreTeam.id, userId: marcus.id, role: 'MEMBER' },
      { teamId: coreTeam.id, userId: elena.id, role: 'MEMBER' },
    ],
  });

  // Create Team 2: Data & AI Research (Private to Dr. Watson)
  const researchTeam = await prisma.team.create({
    data: {
      name: 'Applied AI & Risk Research',
      description: 'Independent research lab for risk prediction models and heuristics.',
      createdBy: drWatson.id,
    },
  });

  await prisma.teamMember.create({
    data: { teamId: researchTeam.id, userId: drWatson.id, role: 'OWNER' },
  });

  console.log('✔ Created teams: Core Platform Engineering & Applied AI Research');

  // 3. Create Project 1: WorkFlowX SaaS MVP
  const now = new Date();
  const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
  const tomorrow = new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000);
  const inThreeDays = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const nextMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const workflowxProject = await prisma.project.create({
    data: {
      teamId: coreTeam.id,
      name: 'WorkFlowX SaaS Platform v1.0',
      description: 'End-to-end delivery of the secure team task management platform and dependency risk engine.',
      status: 'ACTIVE',
      startDate: twoDaysAgo,
      dueDate: nextMonth,
      createdBy: alex.id,
    },
  });

  const mobileCompanionProject = await prisma.project.create({
    data: {
      teamId: coreTeam.id,
      name: 'WorkFlowX Mobile Companion',
      description: 'Progressive web companion with offline support and quick push alerts.',
      status: 'PLANNING',
      startDate: nextWeek,
      dueDate: nextMonth,
      createdBy: sarah.id,
    },
  });

  console.log('✔ Created projects: WorkFlowX SaaS Platform v1.0 & Mobile Companion');

  // 4. Create Tasks illustrating realistic states, dependencies, and risk factors
  const taskAuth = await prisma.task.create({
    data: {
      projectId: workflowxProject.id,
      title: 'Architect Secure Session & Argon2 Auth',
      description: 'Implement server-side sessions stored in PostgreSQL with HttpOnly cookies and rate limiting.',
      status: 'DONE',
      priority: 'HIGH',
      assigneeId: sarah.id,
      createdBy: alex.id,
      dueDate: twoDaysAgo,
      estimatedHours: 12,
      position: 1,
    },
  });

  const taskSchema = await prisma.task.create({
    data: {
      projectId: workflowxProject.id,
      title: 'Relational Database Schema & Foreign Key Constraints',
      description: 'Design Prisma models, constraints, and indexes for teams, projects, dependencies, and audit logs.',
      status: 'DONE',
      priority: 'HIGH',
      assigneeId: alex.id,
      createdBy: alex.id,
      dueDate: twoDaysAgo,
      estimatedHours: 8,
      position: 2,
    },
  });

  const taskDepEngine = await prisma.task.create({
    data: {
      projectId: workflowxProject.id,
      title: 'Implement Task Dependency Engine & Cycle Detection',
      description: 'Build graph traversal with cycle prevention DFS algorithms to validate task relationships.',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      assigneeId: sarah.id,
      createdBy: alex.id,
      dueDate: inThreeDays,
      estimatedHours: 16,
      position: 3,
    },
  });

  const taskRiskEngine = await prisma.task.create({
    data: {
      projectId: workflowxProject.id,
      title: 'Rule-Based Task Risk Analysis Engine',
      description: 'Implement deterministic scoring based on overdue tasks, approaching deadlines, and bottleneck impact.',
      status: 'TODO',
      priority: 'HIGH',
      assigneeId: marcus.id,
      createdBy: alex.id,
      dueDate: inThreeDays,
      estimatedHours: 14,
      position: 4,
    },
  });

  const taskKanbanUI = await prisma.task.create({
    data: {
      projectId: workflowxProject.id,
      title: 'Interactive Kanban Board & Dependency Graph View',
      description: 'Frontend board with status drag/move, dependency arrows, and real-time risk indicators.',
      status: 'BLOCKED',
      priority: 'URGENT',
      assigneeId: elena.id,
      createdBy: alex.id,
      dueDate: nextWeek,
      estimatedHours: 20,
      position: 5,
    },
  });

  const taskOverdueAudit = await prisma.task.create({
    data: {
      projectId: workflowxProject.id,
      title: 'Penetration Testing & SQL/XSS Audit',
      description: 'Simulate privilege escalation, cross-team parameter tampering, and injection attacks.',
      status: 'TODO',
      priority: 'URGENT',
      assigneeId: marcus.id,
      createdBy: sarah.id,
      dueDate: twoDaysAgo, // OVERDUE!
      estimatedHours: 10,
      position: 6,
    },
  });

  const taskApproachingDeadline = await prisma.task.create({
    data: {
      projectId: workflowxProject.id,
      title: 'WCAG 2.1 AA Accessibility & Color Contrast Review',
      description: 'Ensure keyboard navigation, focus indicators, and screen reader labels pass compliance checks.',
      status: 'IN_PROGRESS',
      priority: 'MEDIUM',
      assigneeId: elena.id,
      createdBy: sarah.id,
      dueDate: tomorrow, // < 24 HOURS!
      estimatedHours: 6,
      position: 7,
    },
  });

  const taskIntegrationTests = await prisma.task.create({
    data: {
      projectId: workflowxProject.id,
      title: 'Automated Integration Tests for Rest API Endpoints',
      description: 'End-to-end tests for session expiry, rate limiting, and dependency cycle prevention.',
      status: 'TODO',
      priority: 'MEDIUM',
      assigneeId: marcus.id,
      createdBy: alex.id,
      dueDate: nextWeek,
      estimatedHours: 12,
      position: 8,
    },
  });

  console.log('✔ Created tasks with diverse statuses and priorities');

  // 5. Create Task Dependencies
  // TaskDepEngine depends on TaskAuth and TaskSchema
  await prisma.taskDependency.createMany({
    data: [
      { predecessorTaskId: taskAuth.id, successorTaskId: taskDepEngine.id },
      { predecessorTaskId: taskSchema.id, successorTaskId: taskDepEngine.id },
      // Risk engine depends on Dep engine
      { predecessorTaskId: taskDepEngine.id, successorTaskId: taskRiskEngine.id },
      // Kanban UI depends on both Dep engine and Risk engine
      { predecessorTaskId: taskDepEngine.id, successorTaskId: taskKanbanUI.id },
      { predecessorTaskId: taskRiskEngine.id, successorTaskId: taskKanbanUI.id },
      // Integration tests depend on Kanban UI and Risk engine
      { predecessorTaskId: taskRiskEngine.id, successorTaskId: taskIntegrationTests.id },
      { predecessorTaskId: taskKanbanUI.id, successorTaskId: taskIntegrationTests.id },
    ],
  });

  console.log('✔ Configured directed task dependency graph with downstream cascades');

  // 6. Create Comments
  await prisma.comment.createMany({
    data: [
      {
        taskId: taskDepEngine.id,
        authorId: sarah.id,
        content: 'Graph traversal algorithm completed with DFS cycle detection. Testing with multi-node loops.',
      },
      {
        taskId: taskKanbanUI.id,
        authorId: elena.id,
        content: 'I have prepared the visual components, but currently marked as BLOCKED pending the risk engine API endpoints.',
      },
      {
        taskId: taskOverdueAudit.id,
        authorId: alex.id,
        content: 'This task is past its original deadline. Marcus, please escalate if any blockers require assistance.',
      },
    ],
  });

  // 7. Create Activity Logs
  await prisma.activityLog.createMany({
    data: [
      {
        teamId: coreTeam.id,
        actorId: alex.id,
        entityType: 'TEAM',
        entityId: coreTeam.id,
        action: 'CREATED',
        metadata: { teamName: coreTeam.name },
      },
      {
        teamId: coreTeam.id,
        actorId: alex.id,
        entityType: 'PROJECT',
        entityId: workflowxProject.id,
        action: 'CREATED',
        metadata: { projectName: workflowxProject.name },
      },
      {
        teamId: coreTeam.id,
        actorId: sarah.id,
        entityType: 'TASK',
        entityId: taskAuth.id,
        action: 'STATUS_CHANGED',
        metadata: { from: 'IN_PROGRESS', to: 'DONE' },
      },
      {
        teamId: coreTeam.id,
        actorId: elena.id,
        entityType: 'TASK',
        entityId: taskKanbanUI.id,
        action: 'STATUS_CHANGED',
        metadata: { from: 'TODO', to: 'BLOCKED' },
      },
    ],
  });

  // 8. Create Notifications
  await prisma.notification.createMany({
    data: [
      {
        recipientId: elena.id,
        type: 'TASK_BLOCKED',
        title: 'Task Blocked: Interactive Kanban Board',
        message: 'Your task has unresolved prerequisites that are still in progress.',
        entityType: 'TASK',
        entityId: taskKanbanUI.id,
      },
      {
        recipientId: marcus.id,
        type: 'DEADLINE_APPROACHING',
        title: 'Task Overdue: Penetration Testing Audit',
        message: 'The target completion date passed 2 days ago. Action is recommended.',
        entityType: 'TASK',
        entityId: taskOverdueAudit.id,
      },
      {
        recipientId: alex.id,
        type: 'TASK_ASSIGNED',
        title: 'New Member Joined Team',
        message: 'Elena Rostova has joined Core Platform Engineering as UI/UX Lead.',
        entityType: 'TEAM',
        entityId: coreTeam.id,
        readAt: new Date(),
      },
    ],
  });

  console.log('✔ Created realistic comments, notifications, and activity logs');
  console.log('\n=============================================================');
  console.log('✅ Seed Complete! Demo Accounts:');
  console.log('-------------------------------------------------------------');
  console.log('1. Lead/Owner : alex.lead@workflowx.dev    / Password123!');
  console.log('2. Senior Eng : sarah.eng@workflowx.dev    / Password123!');
  console.log('3. Developer  : marcus.dev@workflowx.dev   / Password123!');
  console.log('4. UI/UX Lead : elena.design@workflowx.dev  / Password123!');
  console.log('5. Researcher : watson.research@workflowx.dev / Password123! (Isolated Team)');
  console.log('=============================================================\n');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
