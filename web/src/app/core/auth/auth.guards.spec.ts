import { HOME_URL, safeReturnUrl } from './auth.guards';

describe('safeReturnUrl', () => {
  it('keeps paths inside the app', () => {
    expect(safeReturnUrl('/profile/edit')).toBe('/profile/edit');
  });

  it('falls back to home for anything else', () => {
    for (const url of [null, '', 'https://evil.example', '//evil.example', '/\\evil.example']) {
      expect(safeReturnUrl(url)).toBe(HOME_URL);
    }
  });
});
