import {
  formatAmount,
  formatMinutes,
  formatQuantity,
  formatShortDate,
  parseQuantity,
} from './format';

describe('formatMinutes', () => {
  it('shows minutes, hours, or both', () => {
    expect(formatMinutes(40)).toBe('40m');
    expect(formatMinutes(95)).toBe('1h 35m');
    expect(formatMinutes(1080)).toBe('18h');
  });
});

describe('formatShortDate', () => {
  const now = new Date(2026, 10, 15);

  it('leaves out the year for this year', () => {
    expect(formatShortDate(new Date(2026, 9, 12), now)).toBe('Oct 12');
  });

  it('shows the year for other years', () => {
    expect(formatShortDate(new Date(2025, 9, 12), now)).toBe('Oct 12, 2025');
  });
});

describe('parseQuantity', () => {
  it('reads whole numbers, decimals and fractions', () => {
    expect(parseQuantity('2')).toBe(2);
    expect(parseQuantity('1.5')).toBe(1.5);
    expect(parseQuantity('1,5')).toBe(1.5);
    expect(parseQuantity('.5')).toBe(0.5);
    expect(parseQuantity('1/2')).toBe(0.5);
    expect(parseQuantity('1 1/2')).toBe(1.5);
    expect(parseQuantity('1½')).toBe(1.5);
    expect(parseQuantity('1 ½')).toBe(1.5);
    expect(parseQuantity('¾')).toBe(0.75);
  });

  it('returns null for an empty amount', () => {
    expect(parseQuantity('  ')).toBeNull();
  });

  it('returns NaN for amounts it can’t read or that aren’t positive', () => {
    for (const text of ['a pinch', '0', '1/0', '-1', '1..2', '2 cups']) {
      expect(parseQuantity(text)).toBeNaN();
    }
  });
});

describe('formatQuantity', () => {
  it('uses fraction glyphs where they fit', () => {
    expect(formatQuantity(2)).toBe('2');
    expect(formatQuantity(2.25)).toBe('2¼');
    expect(formatQuantity(0.75)).toBe('¾');
    expect(formatQuantity(1 / 3)).toBe('⅓');
    expect(formatQuantity(0.333)).toBe('⅓');
    expect(formatQuantity(1.999)).toBe('2');
  });

  it('falls back to two decimals', () => {
    expect(formatQuantity(1.37)).toBe('1.37');
  });
});

describe('formatAmount', () => {
  it('joins the quantity and unit, skipping what’s missing', () => {
    expect(formatAmount({ quantity: 2.25, unit: 'cups' })).toBe('2¼ cups');
    expect(formatAmount({ quantity: 1, unit: null })).toBe('1');
    expect(formatAmount({ quantity: null, unit: 'pinch' })).toBe('pinch');
    expect(formatAmount({ quantity: null, unit: null })).toBe('');
  });

  it('pluralizes word units above one, and leaves abbreviations alone', () => {
    expect(formatAmount({ quantity: 2.25, unit: 'cup' })).toBe('2¼ cups');
    expect(formatAmount({ quantity: 1, unit: 'cup' })).toBe('1 cup');
    expect(formatAmount({ quantity: 0.5, unit: 'cup' })).toBe('½ cup');
    expect(formatAmount({ quantity: 3, unit: 'clove' })).toBe('3 cloves');
    expect(formatAmount({ quantity: 2, unit: 'tbsp' })).toBe('2 tbsp');
    expect(formatAmount({ quantity: null, unit: 'pinch' })).toBe('pinch');
  });
});
