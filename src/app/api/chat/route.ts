import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import dotenv from 'dotenv';
import { z } from "zod";
import { zodResponseFormat } from "openai/helpers/zod";

dotenv.config();

const CommandNode = z.object({
  id: z.string(),
  explanation: z.string(),
  command: z.string(),
  success: z.string().optional(),
  failure: z.string().optional(),
});

const ActionStateMachine = z.object({
  action: z.string(),
  stateMachine: z.array(CommandNode),
});

const Script = z.object({
  actionStateMachines: z.array(ActionStateMachine),
});

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const systemPrompt = `
- You will be given a set of tasks, your goal is to create a series of powershell commands to complete the tasks.
- In order to do this you will create a state machine per task, where the nodes are the commands, and the transitions are the succes or failure of said command.
- You will only create one state machine per task.
- A state machine will be represented by an array of nodes. A node is an object with an id, explanation, command, success and failure.
- The explanation of the command should indicate reasoning behind the command.
- The success and failure are the transitions of the node and its value are the id of the appropriate node.
- You will have one special command, VOID, that will indicate that you do not know how to complete the task, in the explanation you will also mention what would you need from me, the user.
- The VOID command is only used if you don't know how to proceed with the task from the beginning. Do not use it in a more complex state machine.
- You will have one special command, END, that will indicate that the task is complete, you still need to add the reasoning as to why you think is the final state.
- Nor the VOID or END nodes have success or failure fields.
- VOID and END are "command" values, not a node ID.
- VOID and END are not a valid "success" or "failure" values.
- We can't make an infinite branch of error handling so set the failure to the special "failure" value: ERROR with this conditions:
  - The node already comes from a failure transition.
  - The node success transition goes back into the normal state machine flow or happy path.
  - The explanation of this node will also suggest what to do in case of failure.
- The property ActionStateMachine.action will be the task as it is written in the original list of actions
- The property ActionStateMachine.stateMachine will be the array of commands alongside their explanations.
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
