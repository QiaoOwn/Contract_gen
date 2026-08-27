import * as allProjects from '@/rm2pt/project';
import {buildOperationInput, formatOperationSignature} from '@/app/service/createOperationInput';
import {listBenchmarkRequirementKeys} from '@/rm2pt/benchmarkRequirements';

describe('canonical operation input', () => {
  test('covers every benchmark operation with a structured requirement', () => {
    const operationKeys: string[] = [];
    for (const [project, projectModule] of Object.entries(allProjects)) {
      for (const [useCase, useCaseObject] of Object.entries(projectModule.useCase)) {
        for (const operation of useCaseObject.relatedService.operations) {
          operationKeys.push([project, useCase, operation.name].join('/'));
        }
      }
    }
    expect(operationKeys).toHaveLength(114);
    expect(listBenchmarkRequirementKeys()).toEqual(operationKeys.sort());
  });

  test('builds an explicit, versioned input without oracle clauses', () => {
    const input = buildOperationInput({
      project: 'LibraryManagementSystem',
      useCase: 'borrowBook',
      operation: 'borrowBook',
    });
    expect(input.content).toContain('Signature: borrowBook(uid: String, barcode: String): Boolean');
    expect(input.content).toContain('Operation intent:');
    expect(input.content).toContain('Preconditions:');
    expect(input.content).toContain('Postconditions:');
    expect(input.modelContext).toContain(
      'Environment Values (read-only; captured once per operation invocation)'
    );
    expect(input.modelContext).toContain('Today: Date');
    expect(input.modelContext).toContain('Now: Date');
    expect(input.content).toContain(
      'Reference the declared environment values directly as Today or Now'
    );
    expect(input.metadata.schemaVersion).toBe('contractgen-operation-input-v3');
    expect(input.content).not.toContain('user:User = User.allInstance');
    expect(input.metadata.inputHash).toMatch(/^[a-f0-9]{64}$/);
  });

  test('omits a return suffix for operations without a return type', () => {
    expect(formatOperationSignature({name: 'tick'})).toBe('tick()');
  });

  test('rejects generic or unstructured user overrides', () => {
    expect(() =>
      buildOperationInput({
        project: 'LibraryManagementSystem',
        useCase: 'borrowBook',
        operation: 'borrowBook',
        userInput: 'Borrow one book.',
      })
    ).toThrow('Invalid structured operation requirement');
  });
});
