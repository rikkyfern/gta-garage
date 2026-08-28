import { z } from 'zod'

export const updateProfileSchema = z.object({
  username: z
    .string()
    .min(3)
    .max(20)
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores')
    .optional(),
  bio: z.string().max(300).optional(),
})

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>
