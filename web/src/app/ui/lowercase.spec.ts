import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Lowercase } from './lowercase';

@Component({
  imports: [ReactiveFormsModule, Lowercase],
  template: '<input ctLowercase [formControl]="control" />',
})
class Host {
  readonly control = new FormControl('');
}

describe('Lowercase', () => {
  it('lowercases what is typed, in the input and the form value', () => {
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const input = (fixture.nativeElement as HTMLElement).querySelector('input')!;

    input.value = 'SamCooks';
    input.dispatchEvent(new Event('input'));

    expect(input.value).toBe('samcooks');
    expect(fixture.componentInstance.control.value).toBe('samcooks');
  });
});
