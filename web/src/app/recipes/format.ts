import { Ingredient } from './recipe';

/** "40m", "1h 35m", "18h". */
export function formatMinutes(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (!hours) return `${rest}m`;
  return rest ? `${hours}h ${rest}m` : `${hours}h`;
}

/** "Oct 12" this year, "Oct 12, 2025" otherwise. */
export function formatShortDate(date: Date, now = new Date()): string {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() === now.getFullYear() ? undefined : 'numeric',
  });
}

/** "1 journal entry", "3 journal entries". */
export function plural(count: number, one: string, many: string): string {
  return `${count} ${count === 1 ? one : many}`;
}

const FRACTIONS: Record<string, number> = {
  '¼': 1 / 4,
  '½': 1 / 2,
  '¾': 3 / 4,
  '⅓': 1 / 3,
  '⅔': 2 / 3,
  '⅕': 1 / 5,
  '⅖': 2 / 5,
  '⅗': 3 / 5,
  '⅘': 4 / 5,
  '⅙': 1 / 6,
  '⅚': 5 / 6,
  '⅛': 1 / 8,
  '⅜': 3 / 8,
  '⅝': 5 / 8,
  '⅞': 7 / 8,
};

/**
 * Reads an amount the way people write it: "2", "1.5", "1/2", "1 1/2", "1½" or "½". Returns
 * `null` for an empty amount and `NaN` for one that can't be read or isn't positive.
 */
export function parseQuantity(text: string): number | null {
  const value = text.trim().replace(',', '.');
  if (!value) return null;

  const glyph = value.match(/^(\d+)?\s*([¼½¾⅓⅔⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞])$/);
  if (glyph) return positive(Number(glyph[1] ?? 0) + FRACTIONS[glyph[2]]);

  const mixed = value.match(/^(?:(\d+)\s+)?(\d+)\s*\/\s*(\d+)$/);
  if (mixed) {
    const denominator = Number(mixed[3]);
    if (!denominator) return NaN;
    return positive(Number(mixed[1] ?? 0) + Number(mixed[2]) / denominator);
  }

  return /^\d*\.?\d+$/.test(value) ? positive(Number(value)) : NaN;
}

function positive(value: number): number {
  return value > 0 && Number.isFinite(value) ? value : NaN;
}

/** Shows an amount with a fraction glyph where one fits: 2.25 → "2¼", 0.333… → "⅓". */
export function formatQuantity(value: number): string {
  const whole = Math.floor(value);
  const part = value - whole;
  if (part < 0.005) return String(whole);
  if (part > 0.995) return String(whole + 1);
  for (const [glyph, fraction] of Object.entries(FRACTIONS)) {
    if (Math.abs(part - fraction) < 0.002) return whole ? `${whole}${glyph}` : glyph;
  }
  return String(Math.round(value * 100) / 100);
}

/** Units that read as words and take a plural; abbreviations like "tbsp" and "g" don't. */
const PLURALS: Record<string, string> = {
  cup: 'cups',
  pinch: 'pinches',
  clove: 'cloves',
  can: 'cans',
  slice: 'slices',
};

/** The amount column of an ingredient line: "2¼ cups", "1", "pinch", or "". */
export function formatAmount(ingredient: Pick<Ingredient, 'quantity' | 'unit'>): string {
  const { quantity, unit } = ingredient;
  const shownUnit = unit && quantity !== null && quantity > 1 ? (PLURALS[unit] ?? unit) : unit;
  return [quantity === null ? null : formatQuantity(quantity), shownUnit].filter(Boolean).join(' ');
}
