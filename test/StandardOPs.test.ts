import dayjs from 'dayjs';
import {StandardOPs} from '../public/StandardOPs';

describe('StandardOPs.oclEquals', () => {
  test('compares primitive values and preserves model-object identity', () => {
    const model = {id: 1};

    expect(StandardOPs.oclEquals(1, 1)).toBe(true);
    expect(StandardOPs.oclEquals(1, 2)).toBe(false);
    expect(StandardOPs.oclEquals(model, model)).toBe(true);
    expect(StandardOPs.oclEquals(model, {id: 1})).toBe(false);
  });

  test('compares ordered collections element by element', () => {
    const first = {id: 1};
    const second = {id: 2};

    expect(StandardOPs.oclEquals([first, second], [first, second])).toBe(true);
    expect(StandardOPs.oclEquals([first, second], [second, first])).toBe(false);
  });

  test('compares Dayjs values by their represented instant', () => {
    const instant = dayjs('2026-07-20T10:00:00.000Z');

    expect(StandardOPs.oclEquals(instant, instant.clone())).toBe(true);
    expect(StandardOPs.oclEquals(instant, instant.add(1, 'millisecond'))).toBe(false);
  });
});

describe('StandardOPs collection updates', () => {
  test('includes and insertion use OCL value equality', () => {
    const collection = [[1, 2]];

    expect(StandardOPs.includes(collection, [1, 2])).toBe(true);
    StandardOPs.includeIfAbsent(collection, [1, 2]);
    expect(collection).toHaveLength(1);
  });

  test('removal is idempotent and does not remove an unrelated last element', () => {
    const first = {id: 1};
    const second = {id: 2};
    const collection = [first, second];

    StandardOPs.removeIfPresent(collection, {id: 3});
    expect(collection).toEqual([first, second]);
    StandardOPs.removeIfPresent(collection, first);
    StandardOPs.removeIfPresent(collection, first);
    expect(collection).toEqual([second]);
  });

  test('sum aggregates numeric values and defines the empty-set result as zero', () => {
    expect(StandardOPs.sum([1, 2.5, -0.5])).toBe(3);
    expect(StandardOPs.sum([])).toBe(0);
  });
});
