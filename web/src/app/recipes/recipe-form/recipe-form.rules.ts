/** The API's limits for a recipe (docs/api/endpoints/recipes.txt). */
export const LIMITS = {
  title: 120,
  description: 2000,
  tags: 20,
  tag: 30,
  maxMinutes: 10080,
  ingredients: 100,
  unit: 30,
  ingredient: 100,
  adjective: 50,
  steps: 100,
  step: 5000,
} as const;

/** The unit dropdown's choices, in singular form; amounts over one show them pluralized. */
export const UNIT_OPTIONS = [
  'cup',
  'tbsp',
  'tsp',
  'g',
  'kg',
  'oz',
  'lb',
  'ml',
  'l',
  'pinch',
  'clove',
  'can',
  'slice',
];

/** The dropdown value that reveals a free-text unit field. */
export const OTHER_UNIT = 'other';

/** The unit to save from the dropdown and the free-text field. */
export function chosenUnit(choice: string, other: string): string | null {
  if (choice === OTHER_UNIT) return other.trim() || null;
  return choice || null;
}

/**
 * Splits typed tag text on commas. Everything before the last comma becomes tags (trimmed,
 * lowercased, deduplicated, as the API stores them); what follows it stays as the draft.
 */
export function splitTags(
  text: string,
  existing: string[],
): { tags: string[]; rest: string; error: string | null } {
  const parts = text.split(',');
  const rest = parts.pop() ?? '';
  const tags = [...existing];
  let error: string | null = null;
  for (const part of parts) {
    const tag = part.trim().toLowerCase();
    if (!tag || tags.includes(tag)) continue;
    if (tag.length > LIMITS.tag) {
      error = `Keep each tag to ${LIMITS.tag} characters.`;
    } else if (tags.length >= LIMITS.tags) {
      error = `A recipe can have up to ${LIMITS.tags} tags.`;
    } else {
      tags.push(tag);
    }
  }
  return { tags, rest, error };
}

/** The total time in minutes, or `null` if neither field is filled in. */
export function toMinutes(hours: string, minutes: string): number | null {
  if (!hours.trim() && !minutes.trim()) return null;
  return Number(hours || 0) * 60 + Number(minutes || 0);
}

/** Why the hours and minutes can't be saved, or `null` if they can (including both empty). */
export function timeError(hours: string, minutes: string): string | null {
  const whole = (value: string) => !value.trim() || /^\d+$/.test(value.trim());
  if (!whole(hours) || !whole(minutes)) return 'Use whole numbers for hours and minutes.';
  const total = toMinutes(hours, minutes);
  if (total === null) return null;
  if (total < 1) return 'Leave the time empty, or make it at least a minute.';
  if (total > LIMITS.maxMinutes) return 'Keep the time under a week (168 hours).';
  return null;
}
