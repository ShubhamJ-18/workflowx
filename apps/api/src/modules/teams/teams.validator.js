const { z } = require('zod');
const { ROLES } = require('@workflowx/shared');

const createTeamSchema = z.object({
  name: z.string().min(2, 'Team name must be at least 2 characters').max(100),
  description: z.string().max(500).optional().nullable(),
});

const updateTeamSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  description: z.string().max(500).optional().nullable(),
});

const inviteMemberSchema = z.object({
  email: z.string().email('Invalid email address format').toLowerCase().trim(),
  role: z.enum([ROLES.ADMIN, ROLES.MEMBER]).default(ROLES.MEMBER),
});

const updateMemberRoleSchema = z.object({
  role: z.enum([ROLES.OWNER, ROLES.ADMIN, ROLES.MEMBER]),
});

const acceptInvitationSchema = z.object({
  token: z.string().min(16, 'Invalid invitation token'),
});

module.exports = {
  createTeamSchema,
  updateTeamSchema,
  inviteMemberSchema,
  updateMemberRoleSchema,
  acceptInvitationSchema,
};
