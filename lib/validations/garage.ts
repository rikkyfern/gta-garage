import { z } from 'zod'

const optionalText = (min: number, max: number, label: string) =>
  z.preprocess(
    (value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
    z.string().trim().min(min, `${label} must be at least ${min} characters`).max(max).optional()
  )

export const createGarageSchema = z.object({
  garageName: z.string().trim().min(3, 'Garage name must be at least 3 characters').max(100),
  location: optionalText(3, 200, 'Location'),
  description: optionalText(10, 1000, 'Description'),
})

export const updateGarageSchema = createGarageSchema.partial()

export type CreateGarageInput = z.infer<typeof createGarageSchema>
export type UpdateGarageInput = z.infer<typeof updateGarageSchema>
