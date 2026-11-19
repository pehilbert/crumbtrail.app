import { recipesCurrent } from './shell';

describe('recipesCurrent', () => {
  it('marks the library as the page, and recipes inside it as current', () => {
    expect(recipesCurrent('/recipes')).toBe('page');
    expect(recipesCurrent('/recipes?x=1')).toBe('page');
    expect(recipesCurrent('/recipes/abc')).toBe('true');
    expect(recipesCurrent('/recipes/abc/edit')).toBe('true');
  });

  it('leaves New recipe and other screens alone', () => {
    expect(recipesCurrent('/recipes/new')).toBeNull();
    expect(recipesCurrent('/profile')).toBeNull();
    expect(recipesCurrent('/recipes-old')).toBeNull();
  });
});
