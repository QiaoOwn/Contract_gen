import {NextResponse} from 'next/server';
import {collaborativeOperationSchema, runCollaborativeOperation} from '@/app/service/crossClauseOperation';

export const maxDuration = 300;
export async function POST(request: Request) {
  try {
    const body = collaborativeOperationSchema.parse(await request.json());
    const encoder = new TextEncoder();
    return new NextResponse(new ReadableStream({async start(controller) {
      try { for await (const event of runCollaborativeOperation(body)) controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`)); }
      catch (error) { controller.enqueue(encoder.encode(`${JSON.stringify({phase: 'infrastructure-error', message: error instanceof Error ? error.message : String(error)})}\n`)); }
      finally {controller.close();}
    }}), {headers: {'Content-Type': 'application/x-ndjson'}});
  } catch (error) {
    return NextResponse.json({error: error instanceof Error ? error.message : String(error)}, {status: 400});
  }
}
