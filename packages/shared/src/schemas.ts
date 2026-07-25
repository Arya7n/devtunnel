import { z } from 'zod';

export const exposeOptionsSchema = z.object({
  port: z.coerce.number().int().min(1).max(65535),
  subdomain: z
    .string()
    .min(3)
    .max(63)
    .regex(/^[a-z0-9-]+$/)
    .optional(),
});

export type ExposeOptions = z.infer<typeof exposeOptionsSchema>;
