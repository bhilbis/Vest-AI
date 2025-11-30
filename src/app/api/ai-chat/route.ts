/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { OpenAI } from "openai";
import { AI_MODELS } from "../data";

const openai = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: process.env.OPEN_ROUTER_API,
});

export async function POST(req: NextRequest) {
  try { 
    const { message, model = 'deepseek/deepseek-r1-0528' } = await req.json();

    if (!message) {
      return NextResponse.json({ message: "No message provided." }, { status: 400 });
    }

    // Get the selected model configuration or default to DeepSeek
    const modelConfig = AI_MODELS[model as keyof typeof AI_MODELS] || AI_MODELS['deepseek/deepseek-r1-0528'];

    const completion = await openai.chat.completions.create({
      model: modelConfig.model,
      stream: modelConfig.streamable,
      messages: [
        { role: "system", content: modelConfig.systemPrompt },
        { role: "user", content: message }
      ],
    });

    if (modelConfig.streamable) {
      let fullText = "";
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        async start(controller) {
          for await (const chunk of completion as any) {
            const content = chunk.choices?.[0]?.delta?.content;
            if (content) {
              controller.enqueue(encoder.encode(content));
              fullText += content;
            }
          }
          controller.close();
        },
      });

      return new Response(stream, {
        headers: {
          "Content-Type": "text/event-stream",
        }
      });
    } else {
      const completion = await openai.chat.completions.create({
        model: modelConfig.model,
        stream: false,
        messages: [
          { role: "system", content: modelConfig.systemPrompt },
          { role: "user", content: message }
        ],
      });

      const content = completion.choices?.[0]?.message?.content || "No response.";

      return new Response(content, {
        headers: {
          "Content-Type": "text/plain",
        },
      });
    }
  } catch (error) {
    console.error("AI Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}