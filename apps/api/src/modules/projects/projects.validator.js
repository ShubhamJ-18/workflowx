const { z } = require('zod');
const { PROJECT_STATUS } = require('@workflowx/shared');

const createProjectSchema = z.object({
  teamId: z.string().uuid('Invalid team ID format'),
  name: z.string().min(2, 'Project name must be at least 2 characters').max(120),
  description: z.string().max(1000).optional().nullable(),
  status: z.nativeEnum(PROJECT_STATUS).default(PROJECT_STATUS.ACTIVE),
  startDate: z.string().datetime({ offset: true }).optional().nullable().or(z.string().regex(/^\d{4}-\d{2}-\d{2}/).optional().nullable()),
  dueDate: z.string().datetime({ offset: true }).optional().nullable().or(z.string().regex(/^\d{4}-\d{2}-\d{2}/).optional().nullable()),
});

const updateProjectSchema = z.object({
  name: z.string().min(2).max(120).optional(),
  description: z.string().max(1000).optional().nullable(),
  status: z.nativeEnum(PROJECT_STATUS).optional(),
  startDate: z.string().datetime({ offset: true }).optional().nullable().or(z.string().regex(/^\d{4}-\d{2}-\d{2}/).optional().nullable()),
  dueDate: z.string().datetime({ offset: true }).optional().nullable().or(z.string().regex(/^\d{4}-\d{2}-\d{2}/).optional().nullable()),
});

module.exports = {
  createProjectSchema,
  updateProjectSchema,
};
