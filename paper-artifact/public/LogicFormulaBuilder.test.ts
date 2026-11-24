import {
  errorSeparator,
  Rule,
  buildFailedPrefix,
  LogicFormulaBuilder,
  l,
} from './LogicFormulaBuilder';

describe('LogicFormulaBuilder', () => {
  const trueRule1: Rule = {
    logic: () => 1 + 1 === 2,
    description: '1+1 should be 2',
  };

  const falseRule1: Rule = {
    ...trueRule1,
    logic: () => 1 + 1 === 3,
  };
  const trueRule2: Rule = {
    logic: () => 2 + 2 === 4,
    description: '2+2 should be 4',
  };

  const falseRule2: Rule = {
    ...trueRule2,
    logic: () => 2 + 2 === 5,
  };

  const trueRule3: Rule = {
    logic: () => 3 + 3 === 6,
    description: '3+3 should be 6',
  };

  const falseRule3: Rule = {
    ...trueRule3,
    logic: () => 3 + 3 === 7,
  };

  it('will pass when provide 2 simple `true` `and`', () => {
    const {pass} = new LogicFormulaBuilder(trueRule1).and(trueRule2).build();
    expect(pass).toBe(true);
  });

  it('will throw error when provide 2 simple `and` with 1 `false`', () => {
    let {errorMessage} = new LogicFormulaBuilder(trueRule1).and(falseRule2).build();
    expect(errorMessage).toBe(`(${buildFailedPrefix} ${falseRule2.description})`);
    errorMessage = new LogicFormulaBuilder(falseRule1).and(trueRule2).build().errorMessage;
    expect(errorMessage).toBe(`(${buildFailedPrefix} ${falseRule1.description})`);
  });

  it('will pass when provide 2 `and` `false` and 1 `true` `or`', () => {
    const {pass} = new LogicFormulaBuilder(falseRule1).and(falseRule2).or(trueRule3).build();
    expect(pass).toBe(true);
  });

  it('will throw error when provide 2 `and` `false` and 1 `false` `or`', () => {
    const {errorMessage} = new LogicFormulaBuilder(falseRule1)
      .and(falseRule2)
      .or(falseRule3)
      .build();
    expect(errorMessage).toBe(
      `(${buildFailedPrefix} ${falseRule1.description})${errorSeparator}(${buildFailedPrefix} ${falseRule3.description})`
    );
  });

  it('will pass when the if rule pass', () => {
    const {pass} = new LogicFormulaBuilder()
      .if({
        logic: trueRule1.logic!,
        description: trueRule1.description,
        then: trueRule2,
        else: trueRule3,
      })
      .build();
    expect(pass).toBe(true);
  });

  it('will throw error when the if value pass but then failed', () => {
    const {errorMessage} = new LogicFormulaBuilder()
      .if({
        logic: trueRule1.logic!,
        description: trueRule1.description,
        then: falseRule1,
        else: trueRule3,
      })
      .build();
    expect(errorMessage).toBe(`(${buildFailedPrefix} ${falseRule1.description})`);
  });

  it('will throw error when the if value not pass but else failed', () => {
    const {errorMessage} = new LogicFormulaBuilder()
      .if({
        logic: falseRule1.logic!,
        description: trueRule1.description,
        then: trueRule1,
        else: falseRule2,
      })
      .build();
    expect(errorMessage).toBe(`(${buildFailedPrefix} ${falseRule2.description})`);
  });

  it('will pass when all value failed but the or if passed', () => {
    const {pass} = new LogicFormulaBuilder(falseRule1)
      .and(falseRule2)
      .and(falseRule3)
      .or(
        new LogicFormulaBuilder().if({
          logic: trueRule1.logic!,
          description: trueRule1.description,
          then: trueRule2,
          else: trueRule3,
        })
      )
      .build();
    expect(pass).toBe(true);
  });

  it('will pass with the complex case', () => {
    const {pass} = new LogicFormulaBuilder({...falseRule1, description: '1'})
      .and({...falseRule2, description: '2'})
      .and({...falseRule3, description: '3'})
      .and(
        new LogicFormulaBuilder({...falseRule1, description: '4'})
          .and({...falseRule2, description: '5'})
          .or({...trueRule3, description: '6'})
      )
      .or(
        new LogicFormulaBuilder({...trueRule2, description: '7'}).if({
          logic: trueRule1.logic!,
          description: trueRule1.description,
          then: {...trueRule2, description: '8'},
          else: {...trueRule3, description: '9'},
        })
      )
      .if({
        logic: () => false,
        description: 'false',
        then: {...falseRule1, description: '10'},
        else: new LogicFormulaBuilder()
          .and({...trueRule1, description: '11'})
          .and({...trueRule3, description: '12'}),
      })
      .build();
    expect(pass).toBe(true);
  });
  it('will return the execute value', () => {
    const {value} = new LogicFormulaBuilder({execute: () => 1, description: '1'}).build();
    expect(value).toBe(1);
  });
  it('will return the execute value in and', () => {
    const {value} = new LogicFormulaBuilder({execute: () => 1, description: '1'})
      .and({execute: () => 2, description: '2'})
      .build();
    expect(value).toBe(2);
  });
  it('will return the execute value in or', () => {
    const {value} = new LogicFormulaBuilder({logic: () => false, description: '1'})
      .or({execute: () => 2, description: '2'})
      .build();
    expect(value).toBe(2);
  });
  it('will return the execute value in then', () => {
    const {value} = new LogicFormulaBuilder()
      .if({logic: () => true, description: 'true', then: {execute: () => 1, description: '1'}})
      .build();
    expect(value).toBe(1);
  });
  it('will return the execute value in else', () => {
    const {value} = new LogicFormulaBuilder()
      .if({
        logic: () => false,
        description: 'false',
        then: {execute: () => 1, description: '1'},
        else: {execute: () => 2, description: '2'},
      })
      .build();
    expect(value).toBe(2);
  });
  it('will pass in and for a new l', () => {
    const {pass} = new LogicFormulaBuilder()
      .and({
        logic: () => new LogicFormulaBuilder({execute: () => true, description: 'true'}),
        description: 'new l',
      })
      .build();
    expect(pass).toBe(true);
  });
  it('will return the execute for a new l in then', () => {
    const {value} = new LogicFormulaBuilder()
      .if({
        logic: () => true,
        description: 'true',
        then: new LogicFormulaBuilder({execute: () => 1, description: '1'}),
      })
      .build();
    expect(value).toBe(1);
  });
  it('will pass for a false if without else', () => {
    const {pass} = l()
      .if({
        logic: () => false,
        description: 'true',
        then: new LogicFormulaBuilder({execute: () => 1, description: '1'}),
      })
      .build();
    expect(pass).toBe(true);
  });
});
