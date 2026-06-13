import type { ErrorHandler } from "hono";
import { ZodError } from "zod";
import { logger } from "../utils/logger";

export const errorHandler: ErrorHandler = (err, c) => {
  if (err instanceof ZodError) {
    return c.json(
      {
        error: "Validation failed",
        code: "VALIDATION_ERROR",
        issues: err.flatten().fieldErrors,
      },
      400,
    );
  }

  logger.error({ err, path: c.req.path }, "Unhandled error");

  return c.json(
    {
      error: "Internal server error",
      code: "INTERNAL_ERROR",
    },
    500,
  );
};
