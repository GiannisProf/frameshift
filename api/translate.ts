import type { VercelRequest, VercelResponse } from "@vercel/node";
import Anthropic from "@anthropic-ai/sdk";
import { SYSTEM_PROMPT, buildUserMessage } from "../src/prompts/translate";
import type { Framework } from "../src/types";

const client = new Anthropic();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { sourceFramework, targetFramework, sourceCode } = req.body as {
    sourceFramework: Framework;
    targetFramework: Framework;
    sourceCode: string;
  };

  if (!sourceFramework || !targetFramework || !sourceCode) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: buildUserMessage(sourceFramework, targetFramework, sourceCode),
        },
      ],
    });

    const content = message.content[0];
    if (content.type !== "text") {
      return res.status(500).json({ error: "api_error" });
    }

    return res.status(200).json({ raw: content.text });
  } catch (err) {
    console.error("Anthropic API error:", err);
    return res.status(500).json({ error: "api_error" });
  }
}
