import type { z } from "zod";

// The auth screen and the lobby show a failed input's error message to players as is,
// so tRPC inputs keep the issue list and wording zod 3 produced. zod 4 changed both:
// different issue codes, keys and default messages.

type Issue = z.core.$ZodIssue & { input?: unknown };
type LegacyIssue = Record<string, unknown>;

// zod 3's ZodParsedType names for the received value.
function parsedType(value: unknown): string {
  switch (typeof value) {
    case "undefined":
      return "undefined";
    case "string":
      return "string";
    case "number":
      return Number.isNaN(value) ? "nan" : "number";
    case "boolean":
      return "boolean";
    case "function":
      return "function";
    case "bigint":
      return "bigint";
    case "symbol":
      return "symbol";
  }
  if (Array.isArray(value)) return "array";
  if (value === null) return "null";
  if (value instanceof Date) return "date";
  if (value instanceof Map) return "map";
  if (value instanceof Set) return "set";
  if (value instanceof Promise) return "promise";
  return "object";
}

function joinValues(values: readonly unknown[]): string {
  return values
    .map((value) => (typeof value === "string" ? `'${value}'` : String(value)))
    .join(" | ");
}

function lengthWord(inclusive: boolean, exact: boolean, below: boolean): string {
  if (exact) return "exactly";
  if (below) return inclusive ? "at most" : "under";
  return inclusive ? "at least" : "over";
}

// zod 3's default English messages. Schema-level messages still win over these.
function legacyMessage(issue: z.core.$ZodRawIssue): string | undefined {
  switch (issue.code) {
    case "invalid_type":
      return issue.input === undefined
        ? "Required"
        : `Expected ${issue.expected}, received ${parsedType(issue.input)}`;
    case "invalid_value":
      return typeof issue.input === "string"
        ? `Invalid enum value. Expected ${joinValues(issue.values)}, received '${issue.input}'`
        : issue.input === undefined
          ? "Required"
          : `Expected ${joinValues(issue.values)}, received ${parsedType(issue.input)}`;
    case "too_small":
    case "too_big":
      if (issue.origin !== "string") return undefined;
      return `String must contain ${lengthWord(issue.inclusive ?? false, false, issue.code === "too_big")} ${
        issue.code === "too_big" ? issue.maximum : issue.minimum
      } character(s)`;
    case "invalid_format":
      return issue.format === "regex" ? "Invalid" : undefined;
    default:
      return undefined;
  }
}

// Rebuild each issue with zod 3's keys in zod 3's order, since the order shows in the JSON.
function legacyIssue(issue: Issue): LegacyIssue {
  const { path, message } = issue;
  switch (issue.code) {
    case "invalid_type":
      return {
        code: "invalid_type",
        expected: issue.expected,
        received: parsedType(issue.input),
        path,
        message,
      };
    case "invalid_value":
      if (typeof issue.input === "string") {
        return {
          received: issue.input,
          code: "invalid_enum_value",
          options: issue.values,
          path,
          message,
        };
      }
      return {
        expected: joinValues(issue.values),
        received: parsedType(issue.input),
        code: "invalid_type",
        path,
        message,
      };
    case "too_small":
      if (issue.origin !== "string") break;
      return {
        code: "too_small",
        minimum: issue.minimum,
        type: "string",
        inclusive: issue.inclusive,
        exact: false,
        message,
        path,
      };
    case "too_big":
      if (issue.origin !== "string") break;
      return {
        code: "too_big",
        maximum: issue.maximum,
        type: "string",
        inclusive: issue.inclusive,
        exact: false,
        message,
        path,
      };
    case "invalid_format":
      if (issue.format !== "regex") break;
      return { validation: "regex", code: "invalid_string", message, path };
  }
  const { input: _input, ...rest } = issue;
  return rest;
}

export class InputValidationError extends Error {
  override name = "ZodError";

  constructor(readonly issues: LegacyIssue[]) {
    super(JSON.stringify(issues, null, 2));
  }
}

/**
 * Wraps a zod schema for `.input()`. tRPC still infers input and output types from the
 * schema, and a failure throws an error whose message matches zod 3 byte for byte.
 */
export function zodInput<Schema extends z.ZodType>(schema: Schema) {
  return {
    "~standard": schema["~standard"],
    async parseAsync(value: unknown): Promise<z.output<Schema>> {
      const result = await schema.safeParseAsync(value, {
        error: legacyMessage,
        reportInput: true,
      });
      if (result.success) return result.data;
      throw new InputValidationError((result.error.issues as Issue[]).map(legacyIssue));
    },
  };
}
