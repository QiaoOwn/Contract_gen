import {NextResponse} from 'next/server';
import {runV4Rq3PairedRepair, v4Rq3RequestSchema} from '@/app/service/v4Rq3PairedRepair';

export const maxDuration = 300;

export async function POST(request: Request) {
  try {
    const body = v4Rq3RequestSchema.parse(await request.json());
    const stream = runV4Rq3PairedRepair(body);
    return new NextResponse(new ReadableStream({
      async start(controller) {
        try {
          for await (const event of stream) controller.enqueue(`${JSON.stringify(event)}\n`);
        } catch (error) {
          controller.enqueue(`${JSON.stringify({phase: 'infrastructure-error', message:
            error instanceof Error ? error.message : String(error)})}\n`);
        } finally {
          controller.close();
        }
      },
    }), {headers: {'Content-Type': 'application/x-ndjson'}});
  } catch (error) {
    return NextResponse.json({error: error instanceof Error ? error.message : String(error)}, {status: 400});
  }
}
