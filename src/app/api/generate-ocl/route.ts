import {generateOCL} from '@/app/service/generateOCL';
import {openAiApiKeyCookieKey} from '@/constant';
import {cookies} from 'next/headers';
import {NextResponse} from 'next/server';
/** Long-running LangGraph (OCL → contract → TS → tests); raise if experiments time out. */
export const maxDuration = 300;
export const POST = async (request: Request) => {
  try {
    const body = await request.json();
    const cookieStore = await cookies();
    const apiKey =
      typeof body.apiKey === 'string' && body.apiKey.length > 0
        ? body.apiKey
        : cookieStore.get(openAiApiKeyCookieKey)?.value;
    const stream = await generateOCL({...body, apiKey});
    const transformStream = new ReadableStream({
      async start(controller) {
        const processes = [];
        try {
          for await (const value of stream) {
            console.log('---STEP---');
            console.log(value);
            processes.push(value);
            // NDJSON: one JSON object per line so the client can parse chunk boundaries safely.
            controller.enqueue(`${JSON.stringify(value)}\n`);
            console.log('---END STEP---');
          }
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          console.error('Contract Gen pipeline failed:', error);
          controller.enqueue(
            `${JSON.stringify({
              'Pipeline Error': {
                stage: 'generation_or_validation',
                message,
              },
            })}\n`
          );
        } finally {
          controller.close();
        }
      },
    });
    return new NextResponse(transformStream);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Contract Gen request initialization failed:', error);
    return NextResponse.json(
      {
        'Pipeline Error': {
          stage: 'request_initialization',
          message,
        },
      },
      {status: 500}
    );
  }
};
