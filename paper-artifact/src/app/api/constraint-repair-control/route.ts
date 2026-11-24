import {NextResponse} from 'next/server';
import {
  generateConstraintRepairControl,
  constraintControlSchema,
} from '@/app/service/constraintRepairControl';
import {repairGuardErrorPayload} from '@/app/service/repairGuards';

export const maxDuration = 300;
export async function POST(request: Request) {
  try {
    const body = constraintControlSchema.parse(await request.json());
    const stream = await generateConstraintRepairControl(body);
    return new NextResponse(
      new ReadableStream({
        async start(controller) {
          try {
            for await (const event of stream) controller.enqueue(`${JSON.stringify(event)}\n`);
          } catch (error) {
            controller.enqueue(
              `${JSON.stringify({
                'Pipeline Error': {
                  stage: 'controlled_repair',
                  message: error instanceof Error ? error.message : String(error),
                  ...repairGuardErrorPayload(error),
                },
              })}\n`
            );
          } finally {
            controller.close();
          }
        },
      }),
      {headers: {'Content-Type': 'application/x-ndjson'}}
    );
  } catch (error) {
    return NextResponse.json(
      {
        'Pipeline Error': {
          stage: 'control_preflight',
          message: error instanceof Error ? error.message : String(error),
          ...repairGuardErrorPayload(error),
        },
      },
      {status: 400}
    );
  }
}
