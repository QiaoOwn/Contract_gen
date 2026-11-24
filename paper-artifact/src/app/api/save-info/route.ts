import {openAiApiKeyCookieKey} from '@/constant';
// import {checkApiKey} from '@/server-util';
import {AIMessageChunk} from '@langchain/core/messages';
import {cookies} from 'next/headers';
import {NextResponse} from 'next/server';
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
type SaveInfoError = {error: {message: string}; status?: number};
export type SaveInfoResponse = {
  success: boolean;
  message: string;
  data: AIMessageChunk | SaveInfoError;
};
export const POST = async (request: Request) => {
  const body = await request.json();
  const openAiApiKey = body[openAiApiKeyCookieKey];
  const cookieStore = await cookies();
  try {
    // const checkRes = await checkApiKey(openAiApiKey);
    cookieStore.set(openAiApiKeyCookieKey, openAiApiKey);
    return NextResponse.json({
      success: true,
      message: 'Save Success',
      data: {},
    });
  } catch (error) {
    const err = error as SaveInfoError;
    return NextResponse.json<SaveInfoResponse>(
      {
        success: false,
        message: err?.error?.message || 'Save Failed',
        data: err,
      },
      {status: err.status || 500}
    );
  }
};
