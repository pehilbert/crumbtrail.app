/** A journal entry: a note about one time a recipe was made. */
export interface JournalEntry {
  id: string;
  recipeId: string;
  content: string;
  postedAt: Date;
  editedAt: Date | null;
}

export type JournalEntryDto = Omit<JournalEntry, 'postedAt' | 'editedAt'> & {
  postedAt: string;
  editedAt: string | null;
};

export function toJournalEntry(dto: JournalEntryDto): JournalEntry {
  return {
    ...dto,
    postedAt: new Date(dto.postedAt),
    editedAt: dto.editedAt ? new Date(dto.editedAt) : null,
  };
}

/** Sticky-note looks, as `ct-note--*` modifiers, cycled through so neighbors differ. */
const NOTE_CLASSES = [
  'ct-note--tilt-left',
  'ct-note--blush ct-note--tilt-right',
  'ct-note--sage ct-note--tilt-left',
  'ct-note--sky ct-note--tilt-right',
];

export function noteClass(index: number): string {
  return NOTE_CLASSES[index % NOTE_CLASSES.length];
}
