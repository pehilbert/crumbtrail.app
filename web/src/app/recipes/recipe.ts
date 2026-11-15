/** One ingredient line on a recipe. */
export interface Ingredient {
  quantity: number | null;
  unit: string | null;
  ingredient: string;
  adjective: string | null;
}

/** A recipe from GET /recipes/me: the shared shape plus `journalCount`. */
export interface RecipeSummary {
  id: string;
  author: { id: string; username: string };
  title: string;
  description: string | null;
  tags: string[];
  timeEstimateMinutes: number | null;
  ingredients: Ingredient[];
  steps: string[];
  publishedAt: Date;
  editedAt: Date | null;
  journalCount: number;
}

export type RecipeSummaryDto = Omit<RecipeSummary, 'publishedAt' | 'editedAt'> & {
  publishedAt: string;
  editedAt: string | null;
};

export function toRecipeSummary(dto: RecipeSummaryDto): RecipeSummary {
  return {
    ...dto,
    publishedAt: new Date(dto.publishedAt),
    editedAt: dto.editedAt ? new Date(dto.editedAt) : null,
  };
}

/** Cover tile colors, as the `ct-tile--*` modifier (empty for the default butter tile). */
const TILE_CLASSES = [
  '',
  'ct-tile--peach',
  'ct-tile--sage',
  'ct-tile--oat',
  'ct-tile--apricot',
  'ct-tile--honey',
];

/** A recipe's cover color, picked from its id so it always stays the same. */
export function tileClass(recipeId: string): string {
  let hash = 0;
  for (const char of recipeId) hash = (hash * 31 + char.charCodeAt(0)) | 0;
  return TILE_CLASSES[Math.abs(hash) % TILE_CLASSES.length];
}
