import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { PageHeaderComponent } from './page-header.component';

describe('PageHeaderComponent', () => {
  beforeEach(() => TestBed.resetTestingModule());

  it('expose le titre comme cible de focus programmatique hors du parcours Tab', async () => {
    await TestBed.configureTestingModule({
      imports: [PageHeaderComponent],
      providers: [provideZonelessChangeDetection()],
    }).compileComponents();
    const fixture = TestBed.createComponent(PageHeaderComponent);
    fixture.componentRef.setInput('title', 'Titre de page');
    fixture.detectChanges();

    fixture.componentInstance.focusTitle();

    const title = fixture.nativeElement.querySelector('h1') as HTMLHeadingElement;
    expect(title.getAttribute('tabindex')).toBe('-1');
    expect(document.activeElement).toBe(title);
  });
});
