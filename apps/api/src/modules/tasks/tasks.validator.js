const { z } = require('zod');
const { TASK_STATUS, TASK_PRIORITY } = require('@workflowx/shared');

const createTaskSchema = z.object({
  projectId: z.string().uuid('Invalid project ID'),
  title: z.string().min(2, 'Task title must be at least 2 characters').max(150),
  description: z.string().max(3000).optional().nullable(),
  status: z.nativeEnum(TASK_STATUS).default(TASK_STATUS.TODO),
  priority: z.nativeEnum(TASK_PRIORITY).default(TASK_PRIORITY.MEDIUM),
  assigneeId: z.string().uuid('Invalid assignee ID').optional().nullable(),
  dueDate: z.string().datetime({ offset: true }).optional().nullable().or(z.string().regex(/^\d{4}-\d{2}-\d{2}/).optional().nullable()),
  estimatedHours: z.number().min(0).max(1000).optional().default(0),
  position: z.number().int().optional().default(0),
});

const updateTaskSchema = z.object({
  title: z.string().min(2).max(150).optional(),
  description: z.string().max(3000).optional().nullable(),
  status: z.nativeEnum(TASK_STATUS).optional(),
  priority: z.nativeEnum(TASK_PRIORITY).optional(),
  assigneeId: z.string().uuid().optional().nullable(),
  dueDate: z.string().datetime({ offset: true }).optional().nullable().or(z.string().regex(/^\d{4}-\d{2}-\d{2}/).optional().nullable()),
  estimatedHours: z.number().min(0).max(1000).optional(),
  position: z.number().int().optional(),
});

const updateTaskStatusSchema = z.object({
  status: z.nativeEnum(TASK_STATUS),
  position: z.number().int().optional(),
});

const createCommentSchema = z.object({
  content: z.string().min(1, 'Comment cannot be empty').max(2000),
});

const addDependencySchema = z.object({
  predecessorTaskId: z.string().uuid('Invalid predecessor task ID'),
});

module.exports = {
  createTaskSchema,
  updateTaskSchema,
  updateTaskStatusSchema,
  createCommentSchema,
  addDependencySchema,
};
