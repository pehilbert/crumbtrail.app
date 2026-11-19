import { TestBed } from '@angular/core/testing';
import { PronounPicker } from './pronoun-picker';

describe('PronounPicker', () => {
  function setup(saved: string | null = null) {
    const fixture = TestBed.createComponent(PronounPicker);
    const picker = fixture.componentInstance;
    const changes: (string | null)[] = [];
    picker.registerOnChange((value) => changes.push(value));
    picker.writeValue(saved);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const chip = (label: string) =>
      [...el.querySelectorAll('button')].find((b) => b.textContent?.trim() === label)!;
    const tap = (label: string) => {
      chip(label).click();
      fixture.detectChanges();
    };
    return { picker, el, chip, tap, changes, fixture };
  }

  it('saves one chip as the full set', () => {
    const { tap, changes } = setup();
    tap('she/her');
    expect(changes.at(-1)).toBe('she/her');
  });

  it('joins two or more chips by first word, in the order tapped', () => {
    const { tap, changes } = setup();
    tap('they/them');
    tap('she/her');
    expect(changes.at(-1)).toBe('they/she');
  });

  it('saves null when nothing is picked', () => {
    const { tap, changes, el } = setup();
    tap('he/him');
    tap('he/him');
    expect(changes.at(-1)).toBeNull();
    expect(el.textContent).toContain('No pronouns will show on your profile.');
  });

  it('uses the typed text for "Write my own"', () => {
    const { tap, changes, el, fixture } = setup('she/her');
    tap('Write my own');
    const input = el.querySelector('input')!;
    input.value = '  xe/xem ';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(changes.at(-1)).toBe('xe/xem');
    expect(el.querySelector('[aria-pressed="true"]')?.textContent?.trim()).toBe('Write my own');
  });

  it('starts from a saved full set', () => {
    const { chip, picker } = setup('they/them');
    expect(chip('they/them').getAttribute('aria-pressed')).toBe('true');
    expect(picker.value()).toBe('they/them');
  });

  it('starts from a saved combination, keeping its order', () => {
    const { chip, picker } = setup('he/they');
    expect(chip('he/him').getAttribute('aria-pressed')).toBe('true');
    expect(chip('they/them').getAttribute('aria-pressed')).toBe('true');
    expect(picker.value()).toBe('he/they');
  });

  it('opens "Write my own" for anything else', () => {
    const { chip, el } = setup('any/all');
    expect(chip('Write my own').getAttribute('aria-pressed')).toBe('true');
    expect(el.querySelector('input')?.value).toBe('any/all');
  });
});
