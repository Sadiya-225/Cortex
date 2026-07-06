import { generateText } from "ai";
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { openai } from "@ai-sdk/openai";

import { firecrawl } from "@/lib/firecrawl";

const URL_REGEX = /https?:\/\/[^\s)>\]]+/g;

const QUICK_EDIT_PROMPT = `You are a code editing assistant. Edit the selected code based on the user's instruction.

<context>
<selected_code>
{selectedCode}
</selected_code>
<full_code_context>
{fullCode}
</full_code_context>
</context>

{documentation}

<instruction>
{instruction}
</instruction>

<instructions>
Return ONLY the edited version of the selected code, with no markdown formatting, no code blocks, no explanations.
Maintain the same indentation level as the original.
Do not include triple backticks or language identifiers.
Do not include any explanations or comments unless requested.
If the instruction is unclear or cannot be applied, return the original code unchanged.
</instructions>`;

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    const { selectedCode, fullCode, instruction } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 400 });
    }

    if (!selectedCode) {
      return NextResponse.json(
        { error: "Selected Code is Required" },
        { status: 400 },
      );
    }

    if (!instruction) {
      return NextResponse.json(
        { error: "Instruction is Required" },
        { status: 400 },
      );
    }

    const urls: string[] = instruction.match(URL_REGEX) || [];
    let documentationContext = "";

    if (urls.length > 0) {
      const scrapedResults = await Promise.all(
        urls.map(async (url) => {
          try {
            const result = await firecrawl.scrape(url, {
              formats: ["markdown"],
            });

            if (result.markdown) {
              return `<doc url="${url}">\n${result.markdown}\n</doc>`;
            }

            return null;
          } catch {
            return null;
          }
        }),
      );

      const validResults = scrapedResults.filter(Boolean);

      if (validResults.length > 0) {
        documentationContext = `<documentation>\n${validResults.join("\n\n")}\n</documentation>`;
      }
    }

    const prompt = QUICK_EDIT_PROMPT.replace("{selectedCode}", selectedCode)
      .replace("{fullCode}", fullCode || "")
      .replace("{instruction}", instruction)
      .replace("{documentation}", documentationContext);

    const { text } = await generateText({
      model: openai("gpt-4o-mini"),
      prompt,
      temperature: 0.2,
    });

    let editedCode = text.trim();

    const codeBlockMatch = editedCode.match(/^```[\w]*\n?([\s\S]*?)\n?```$/);
    if (codeBlockMatch) {
      editedCode = codeBlockMatch[1].trim();
    }

    return NextResponse.json({ editedCode });
  } catch (error) {
    console.error("Edit error:", {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    if (error instanceof Error && error.message.includes("timeout")) {
      return NextResponse.json(
        { error: "Request Timed Out. Please Try Again." },
        { status: 408 },
      );
    }

    if (error instanceof Error && error.message.includes("401")) {
      return NextResponse.json(
        { error: "OpenAI API Authentication Failed" },
        { status: 401 },
      );
    }

    return NextResponse.json(
      { error: "Failed to Generate Edit. Please Try Again." },
      { status: 500 },
    );
  }
}
