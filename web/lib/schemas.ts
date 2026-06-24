/**
 * Shared zod validation schemas for web forms.
 * Import the schema + type; pass the resolver to useForm().
 */
import { z } from "zod";

export const guestChartSchema = z.object({
  displayName: z.string().min(1, "Name is required"),
  birthDateLocal: z.string().min(1, "Birth date is required"),
  birthTimeLocal: z.string().default("12:00"),
  birthPlace: z.string().min(1, "Birth place is required"),
  birthLatitude: z.string().refine((v) => v !== "" && !isNaN(Number(v)), {
    message: "Select a place from the dropdown",
  }),
  birthLongitude: z.string().refine((v) => v !== "" && !isNaN(Number(v)), {
    message: "Select a place from the dropdown",
  }),
  birthTimezone: z.string().min(1, "Timezone is required"),
});
export type GuestChartFormValues = z.infer<typeof guestChartSchema>;

export const feedbackSchema = z.object({
  category: z.enum(["bug", "calculation", "suggestion", "review", "other"]),
  rating: z.number().nullable(),
  message: z.string().min(10, "Please write at least 10 characters"),
  isReview: z.boolean(),
  allowContact: z.boolean(),
});
export type FeedbackFormValues = z.infer<typeof feedbackSchema>;
