import { JournalEntry, JournalEntryDto, toJournalEntry } from '../journals/journal';

/** One ingredient line on a recipe. */
export interface Ingredient {
  quantity: number | null;
  unit: string | null;
  ingredient: string;
  adjective: string | null;
}

/** The fields every recipe response shares. */
interface RecipeBase {
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
}

/** A recipe from GET /recipes/me: the shared shape plus `journalCount`. */
export interface RecipeSummary extends RecipeBase {
  journalCount: number;
}

/** A recipe from GET /recipes/{id}, POST and PATCH: the shared shape plus its journal. */
export interface Recipe extends RecipeBase {
  /** Newest first. */
  journals: JournalEntry[];
}

/** POST /recipes. */
export interface RecipeInput {
  title: string;
  description: string | null;
  tags: string[];
  timeEstimateMinutes: number | null;
  ingredients: Ingredient[];
  steps: string[];
}

/** PATCH /recipes/{id}: omitted fields stay unchanged; arrays replace the whole list. */
export type RecipeUpdate = Partial<RecipeInput>;

type Dated<T> = Omit<T, 'publishedAt' | 'editedAt'> & {
  publishedAt: string;
  editedAt: string | null;
};

export type RecipeSummaryDto = Dated<RecipeSummary>;
export type RecipeDto = Omit<Dated<Recipe>, 'journals'> & { journals: JournalEntryDto[] };

function toDates(dto: { publishedAt: string; editedAt: string | null }) {
  return {
    publishedAt: new Date(dto.publishedAt),
    editedAt: dto.editedAt ? new Date(dto.editedAt) : null,
  };
}

export function toRecipeSummary(dto: RecipeSummaryDto): RecipeSummary {
  return { ...dto, ...toDates(dto) };
}

export function toRecipe(dto: RecipeDto): Recipe {
  return { ...dto, ...toDates(dto), journals: dto.journals.map(toJournalEntry) };
}

/** Cover tile colors: the `ct-tile--*` modifier (empty for the default butter tile) and token. */
const TILES = [
  { modifier: '', token: '--tile-butter' },
  { modifier: 'ct-tile--peach', token: '--tile-peach' },
  { modifier: 'ct-tile--sage', token: '--tile-sage' },
  { modifier: 'ct-tile--oat', token: '--tile-oat' },
  { modifier: 'ct-tile--apricot', token: '--tile-apricot' },
  { modifier: 'ct-tile--honey', token: '--tile-honey' },
];

/** A recipe's cover color, picked from its id so it always stays the same. */
function tile(recipeId: string) {
  let hash = 0;
  for (const char of recipeId) hash = (hash * 31 + char.charCodeAt(0)) | 0;
  return TILES[Math.abs(hash) % TILES.length];
}

/** A recipe's cover color as a `ct-tile--*` class. */
export function tileClass(recipeId: string): string {
  return tile(recipeId).modifier;
}

/** A recipe's cover color as a CSS value, for accents beyond the tile itself. */
export function tileColor(recipeId: string): string {
  return `var(${tile(recipeId).token})`;
}
