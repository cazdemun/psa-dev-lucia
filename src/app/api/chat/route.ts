import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import dotenv from 'dotenv';
import { z } from "zod";
import { zodResponseFormat } from "openai/helpers/zod";

dotenv.config();

const Step = z.object({
  explanation: z.string(),
  command: z.string(),
});

const Script = z.object({
  steps: z.array(Step),
});

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const { message } = await req.json();

    const completion = await client.beta.chat.completions.parse({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: message }],
      response_format: zodResponseFormat(Script, "script_steps"),
    });

    const responseMessage = completion.choices[0]?.message.parsed || 'No response';
    return NextResponse.json({ response: responseMessage });
  } catch (error) {
    console.log(error);
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}
