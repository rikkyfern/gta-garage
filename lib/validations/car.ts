import { z } from 'zod'

const optionalText = (min: number, max: number, label: string) =>
  z.preprocess(
    (value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
    z.string().trim().min(min, `${label} must be at least ${min} characters`).max(max).optional()
  )

export const createCarSchema = z.object({
  carName: z.string().trim().min(3, 'Car name must be at least 3 characters').max(100),
  carModel: optionalText(2, 100, 'Model'),
  description: optionalText(10, 1000, 'Description'),
  location: optionalText(3, 200, 'Location'),
})

export const updateCarSchema = createCarSchema.partial()

export const addPhotoSchema = z.object({
  caption: z.string().max(300).optional(),
})

export type CreateCarInput = z.infer<typeof createCarSchema>
export type UpdateCarInput = z.infer<typeof updateCarSchema>
