import {evaluateContract} from '@/app/service/evaluateContract';
import {NextResponse} from 'next/server';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const maxDuration = 300;

export const POST = async (request: Request) => {
  try {
    const body = await request.json();
    const {project, useCase, operation, contract, ocl} = body;
    if (!project || !useCase || !operation || !ocl?.precondition || !ocl?.postcondition) {
      return NextResponse.json(
        {
          error:
            'project, useCase, operation, and ocl.precondition/ocl.postcondition are required',
        },
        {status: 400}
      );
    }
    const result = await evaluateContract({project, useCase, operation, contract, ocl});
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        error: (error as Error).message,
      },
      {status: 500}
    );
  }
};
