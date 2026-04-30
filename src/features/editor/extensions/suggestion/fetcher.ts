import ky from "ky";
import { z } from "zod";
import { toast } from "sonner";

const suggestionRequestSchema = z.object({
  fileName: z.string(),
  code: z.string(),
  currentLine: z.string(),
  previousLines: z.string(),
  textBeforeCursor: z.string(),
  textAfterCursor: z.string(),
  nextLines: z.string(),
  lineNumber: z.number(),
});

const suggestionResponseSchema = z.object({
  suggestion: z.string(),
});

type SuggestionRequest = z.infer<typeof suggestionRequestSchema>;
type SuggestionResponse = z.infer<typeof suggestionResponseSchema>;

export const fetcher = async (
  payload: SuggestionRequest,
  signal: AbortSignal,
): Promise<string | null> => {
  try {
    const validatedPayload = suggestionRequestSchema.parse(payload);

    const response = await ky
      .post("/api/suggestion", {
        json: validatedPayload,
        signal,
        timeout: 15_000,
        retry: {
          limit: 1,
          methods: ["post"],
          statusCodes: [408, 429, 500, 502, 503, 504],
        },
      })
      .json<SuggestionResponse>();

    const validatedResponse = suggestionResponseSchema.parse(response);

    return validatedResponse.suggestion || null;
  } catch (error) {
    // Silently handle abort errors (user cancelled or component unmounted)
    if (error instanceof Error && error.name === "AbortError") {
      return null;
    }

    // Log detailed error for debugging
    console.error("Suggestion fetcher error:", {
      error,
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });

    // Only show toast for non-transient errors
    if (error instanceof Error && error.message.includes("401")) {
      toast.error("Authentication required. Please log in.");
    } else if (error instanceof Error && error.message.includes("429")) {
      // Rate limited - don't show error, just silently fail
      return null;
    } else if (error instanceof Error && error.message.includes("timeout")) {
      // Timeout - don't show error, just silently fail
      return null;
    } else {
      // For other errors, show a generic message but include helpful context
      console.warn("Failed to fetch AI suggestion - returning null");
    }

    return null;
  }
};
