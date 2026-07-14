import { z } from "zod";

const categories = [
  "DevOps",
  "AI/ML",
  "Web Development",
  "Mobile",
  "Cloud",
  "Security",
  "Other",
] as const;

export const createEventSchema = z
  .object({
    title: z.string().min(5).max(100),
    shortDescription: z.string().min(1).max(150),
    fullDescription: z.string().min(50),
    date: z.coerce.date(),
    location: z.string().min(1),
    price: z.coerce.number().min(0),
    category: z.enum(categories),
    capacity: z.coerce.number().min(1).optional().default(100),
    images: z.array(z.string().url()).optional().default([]),
    image: z.string().url().optional(),
  })
  .transform((data) => ({
    ...data,
    images: data.images?.length
      ? data.images
      : data.image
        ? [data.image]
        : [],
  }));
