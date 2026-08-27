import {l} from '../public/LogicFormulaBuilder';

describe('LogicFormulaBuilder nested execution', () => {
  test('executes a conditional builder returned by an effect rule', () => {
    let executed = false;
    const conditional = l().if({
      logic: () => true,
      description: 'condition',
      then: l({
        execute: () => (executed = true),
        description: 'effect',
      }),
    });

    const result = l({
      execute: () => conditional,
      description: 'nested conditional',
    }).build();

    expect(result.pass).toBe(true);
    expect(result.value).toBe(true);
    expect(result.errors).toEqual([]);
    expect(executed).toBe(true);
  });
});
