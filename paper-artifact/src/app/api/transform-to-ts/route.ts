import {generateTypescriptServiceFile} from '@/app/service/generateTypescriptCode';
import {removeFileExportsAndImports} from '@/app/service/operationCodeShared';
import {formatTypescript} from '@/app/util';
import {UseCase} from '@/rm2pt/model/UseCase';
import * as project from '@/rm2pt/project';
import generate from '@babel/generator';
import {NextResponse} from 'next/server';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const POST = async (request: Request) => {
  const body = await request.json();
  const {project: key, useCase: uc, operation: op, contract} = body;
  const p = project[key as keyof typeof project];
  const useCase = p.useCase[uc as keyof typeof p.useCase] as UseCase;
  const service = useCase.relatedService;
  const operation = service.operations.find((o) => o.name === op)!;
  const {file} = generateTypescriptServiceFile(service, [{...operation, ...contract}]);
  removeFileExportsAndImports(file);

  return NextResponse.json({
    code: await formatTypescript(generate(file).code.replaceAll(' End*/', ' End*/\n')),
  });
};
