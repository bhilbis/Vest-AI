/* eslint-disable @typescript-eslint/no-explicit-any */
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { OpenAI } from "openai";
import { AI_MODELS } from "../data";

const openai = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: process.env.OPEN_ROUTER_API,
})

export async function POST(req: NextRequest) {
   try { 
    const { assets, marketPrices, message, model = 'deepseek/deepseek-v3-base' } = await req.json()

    if (!assets || assets.length === 0) {
      return NextResponse.json({ message: "No asset data provided." }, { status: 400 })
    }

    const modelConfig = AI_MODELS[model as keyof typeof AI_MODELS] || AI_MODELS['deepseek/deepseek-v3-base'];

    let formattedAssets = "No asset data available."
    if (Array.isArray(assets)) {
        formattedAssets = assets.map((a: any) => {
          const market = marketPrices?.[a.id]
          return `- ${a.name}, Amount: ${a.amount}, Purchase Price: ${a.buyPrice}${market ? `, Current Market Price: ${market}` : ''}`
        }).join("\n")
    }

    const userQuery = message || "Analyze my portfolio and provide insights."

    const prompt = `
        Based on the following asset data:
        ${formattedAssets}
        
        User query: ${userQuery}
        
        Please provide:
        1. A detailed analysis of the portfolio
        2. Potential gains/losses
        3. Investment recommendations based on current market conditions
        4. Risk assessment
        
        Format your response in a clear, structured way with sections for Analysis, Insights, and Recommendations.
        Use plain language that is accessible to non-technical users.
        If you identify specific actions (buy/sell), please be explicit about the asset, amount, and your confidence level.
    `

    const completion = await openai.chat.completions.create({
      model: modelConfig.model,
      stream: true,
      messages: [
        { role: "system", content: modelConfig.systemPrompt },
        { role: "user", content: prompt }
      ],
    });

    let fullText = ""
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        for await (const chunk of completion as any) {
          const content = chunk.choices?.[0]?.delta?.content
          if (content) {
            controller.enqueue(encoder.encode(content))
            fullText += content
          }
        }
        controller.close()
      },
    })

    const cleaned = fullText.replace(/<think>[\s\S]*?<\/think>/g, "")

    // Save the analysis to the database
    try {
      await prisma.analysis.create({
        data: {
          userId: "",
          content: cleaned,
          assets: JSON.stringify(assets),
        }
      })
    } catch (dbError) {
      console.error("Database error:", dbError)
      // Continue even if database save fails
    }

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
      }
    })

   } catch (error) {
    console.error("AI Error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}