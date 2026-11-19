import { OTHER_UNIT, chosenUnit, splitTags, timeError, toMinutes } from './recipe-form.rules';

describe('splitTags', () => {
  it('turns text before the last comma into tags and keeps the rest as the draft', () => {
    expect(splitTags('Baking, Cake,  past', [])).toEqual({
      tags: ['baking', 'cake'],
      rest: '  past',
      error: null,
    });
  });

  it('skips empty and duplicate tags', () => {
    expect(splitTags(' , baking,BAKING,', ['baking']).tags).toEqual(['baking']);
  });

  it('rejects long tags and stops at 20', () => {
    expect(splitTags(`${'a'.repeat(31)},`, []).error).toMatch(/30 characters/);
    const full = Array.from({ length: 20 }, (_, i) => `tag${i}`);
    const result = splitTags('one more,', full);
    expect(result.tags).toHaveLength(20);
    expect(result.error).toMatch(/up to 20/);
  });
});

describe('toMinutes', () => {
  it('adds hours and minutes, and is null when both are empty', () => {
    expect(toMinutes('1', '35')).toBe(95);
    expect(toMinutes('', '40')).toBe(40);
    expect(toMinutes('2', '')).toBe(120);
    expect(toMinutes(' ', '')).toBeNull();
  });
});

describe('timeError', () => {
  it('allows an empty time or one up to a week', () => {
    expect(timeError('', '')).toBeNull();
    expect(timeError('1', '5')).toBeNull();
    expect(timeError('168', '')).toBeNull();
  });

  it('rejects fractions, zero, and more than a week', () => {
    expect(timeError('1.5', '')).toMatch(/whole numbers/);
    expect(timeError('0', '0')).toMatch(/at least a minute/);
    expect(timeError('168', '1')).toMatch(/under a week/);
  });
});

describe('chosenUnit', () => {
  it('uses the dropdown, or the free-text field for "other"', () => {
    expect(chosenUnit('cup', 'ignored')).toBe('cup');
    expect(chosenUnit('', '')).toBeNull();
    expect(chosenUnit(OTHER_UNIT, ' bunch ')).toBe('bunch');
    expect(chosenUnit(OTHER_UNIT, '  ')).toBeNull();
  });
});
