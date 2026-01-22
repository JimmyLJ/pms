import { Context } from "hono";
import { ZodSchema, ZodError, ZodIssue } from "zod";

interface ValidationErrorDetail {
  field: string;
  message: string;
}

interface ValidationErrorResponse {
  error: string;
  details: ValidationErrorDetail[];
}

function formatZodError(error: ZodError<unknown>): ValidationErrorResponse {
  const details = error.issues.map((issue: ZodIssue) => ({
    field: issue.path.join(".") || "root",
    message: issue.message,
  }));

  return {
    error: "Validation failed",
    details,
  };
}

export async function validateBody<T>(c: Context, schema: ZodSchema<T>): Promise<T | null> {
  try {
    const body = await c.req.json();
    return schema.parse(body);
  } catch (error) {
    if (error instanceof ZodError) {
      c.status(400);
      return null;
    }
    c.status(400);
    return null;
  }
}

export function validateQuery<T>(c: Context, schema: ZodSchema<T>): T | null {
  try {
    const query = c.req.query();
    return schema.parse(query);
  } catch (error) {
    if (error instanceof ZodError) {
      c.status(400);
      return null;
    }
    c.status(400);
    return null;
  }
}

// Alternative versions that return the error response directly
export async function validateBodyWithError<T>(
  c: Context,
  schema: ZodSchema<T>
): Promise<{ data: T; error: null } | { data: null; error: ValidationErrorResponse }> {
  try {
    const body = await c.req.json();
    const data = schema.parse(body);
    return { data, error: null };
  } catch (error) {
    if (error instanceof ZodError) {
      return { data: null, error: formatZodError(error) };
    }
    return {
      data: null,
      error: {
        error: "Invalid request body",
        details: [{ field: "body", message: "Could not parse request body as JSON" }],
      },
    };
  }
}

export function validateQueryWithError<T>(
  c: Context,
  schema: ZodSchema<T>
): { data: T; error: null } | { data: null; error: ValidationErrorResponse } {
  try {
    const query = c.req.query();
    const data = schema.parse(query);
    return { data, error: null };
  } catch (error) {
    if (error instanceof ZodError) {
      return { data: null, error: formatZodError(error) };
    }
    return {
      data: null,
      error: {
        error: "Invalid query parameters",
        details: [{ field: "query", message: "Could not parse query parameters" }],
      },
    };
  }
}
