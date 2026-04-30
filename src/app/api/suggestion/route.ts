import { generateText } from "ai";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { openai } from "@ai-sdk/openai";

const SUGGESTION_PROMPT = `You are a Code Suggestion Assistant.

<context>
<file_name>{fileName}</file_name>
<previous_lines>
{previousLines}
</previous_lines>
<current_line number="{lineNumber}">{currentLine}</current_line>
<before_cursor>{textBeforeCursor}</before_cursor>
<after_cursor>{textAfterCursor}</after_cursor>
<next_lines>
{nextLines}
</next_lines>
<full_code>
{code}
</full_code>
</context>

<instructions>
Follow these steps IN ORDER:

1. First, Look at next_lines. If next_lines Contains ANY code, Check if it Continues from where the Cursor is. If it Does, Return Empty String Immediately - the Code is Already Written.
2. Check if before_cursor Ends with a Complete Statement (;, }, )). If Yes, Return Empty String.
3. Only if Steps 1 and 2 Don't Apply: Suggest What Should be Typed at the Cursor Position, using Context from full_code.

Return ONLY the suggested code, with no markdown formatting, no code blocks, no explanations.
Maintain the same indentation level as the original.
Do not include triple backticks or language identifiers.

Your suggestion is inserted immediately after the cursor, so never suggest code that's already in the file.
</instructions>`;

export async function POST(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ suggestion: "" }, { status: 200 });
    }

    const {
      fileName,
      code,
      currentLine,
      previousLines,
      textBeforeCursor,
      textAfterCursor,
      nextLines,
      lineNumber,
    } = await request.json();

    if (!code) {
      return NextResponse.json({ suggestion: "" }, { status: 200 });
    }

    const prompt = SUGGESTION_PROMPT.replace("{fileName}", fileName)
      .replace("{code}", code)
      .replace("{currentLine}", currentLine)
      .replace("{previousLines}", previousLines || "")
      .replace("{textBeforeCursor}", textBeforeCursor)
      .replace("{textAfterCursor}", textAfterCursor)
      .replace("{nextLines}", nextLines || "")
      .replace("{lineNumber}", lineNumber.toString());

    const { text } = await generateText({
      model: openai("gpt-4o-mini"),
      prompt,
      temperature: 0.1,
    });

    let suggestion = text.trim();

    const codeBlockMatch = suggestion.match(/^```[\w]*\n?([\s\S]*?)\n?```$/);
    if (codeBlockMatch) {
      suggestion = codeBlockMatch[1].trim();
    }

    return NextResponse.json({ suggestion });
  } catch (error) {
    console.error("Suggestion Error: ", error);
    return NextResponse.json({ suggestion: "" }, { status: 200 });
  }
}
