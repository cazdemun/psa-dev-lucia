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

const ActionScript = z.object({
  action: z.string(),
  steps: z.array(Step),
});

const Script = z.object({
  actions: z.array(ActionScript),
});

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const systemPrompt = `
- You will be given a set of tasks, your goal is to create a series of powershell commands to complete the tasks.
- You can do multiple commands to complete one task.
- The explanation of the command should indicate reasoning behind the command.
- You will have one special command, VOID, that will indicate that you do not know how to complete the task, in the explanation you will also mention what would you need from me, the user.
- As you see, you should return an array of objects, the action in ActionScript will be the task as it is written in the original list of actions, and the steps will be the commands alongside the explanation.
`;

export async function POST(req: NextRequest) {
  try {
    const { message } = await req.json();

    const completion = await client.beta.chat.completions.parse({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message },
      ],
      response_format: zodResponseFormat(Script, "script"),
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
