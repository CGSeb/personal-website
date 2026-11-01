import { describe, expect, it } from 'vitest';
import {
  buildHash,
  isWelcomeHash,
  parseHash,
  translateHash,
  welcomeHash,
} from '../../src/scene/hash';

describe('scene fragment', () => {
  it('builds the fragment in each language', () => {
    expect(buildHash({ type: 'project', id: 'lesson-folk' }, 'fr')).toBe('#projet/lesson-folk');
    expect(buildHash({ type: 'project', id: 'lesson-folk' }, 'en')).toBe('#project/lesson-folk');
    expect(buildHash({ type: 'education', id: 'master' }, 'fr')).toBe('#diplome/master');
    expect(buildHash({ type: 'experience', id: 'job' }, 'en')).toBe('#experience/job');
  });

  it('parses fragments of both languages, with or without #', () => {
    expect(parseHash('#diplome/master')).toEqual({ type: 'education', id: 'master' });
    expect(parseHash('education/master')).toEqual({ type: 'education', id: 'master' });
    expect(parseHash('#projet/lesson-folk')).toEqual({ type: 'project', id: 'lesson-folk' });
  });

  it('ignores unknown or malformed fragments', () => {
    for (const hash of [
      '',
      '#',
      '#main',
      '#unknown/x',
      '#projet/',
      '#projet/Bad_Id',
      '#projet/a/b',
    ]) {
      expect(parseHash(hash), hash).toBeNull();
    }
  });

  it('translates a fragment to the other language', () => {
    expect(translateHash('#projet/lesson-folk', 'en')).toBe('#project/lesson-folk');
    expect(translateHash('#education/master', 'fr')).toBe('#diplome/master');
    expect(translateHash('#nothing', 'fr')).toBe('');
  });

  it('builds the welcome fragment in each language', () => {
    expect(welcomeHash('fr')).toBe('#bienvenue');
    expect(welcomeHash('en')).toBe('#welcome');
  });

  it('recognises the welcome fragment of either language', () => {
    expect(isWelcomeHash('#bienvenue')).toBe(true);
    expect(isWelcomeHash('#welcome')).toBe(true);
    for (const hash of ['', '#', '#main', '#projet/lesson-folk', '#bienvenue/x']) {
      expect(isWelcomeHash(hash), hash).toBe(false);
    }
  });

  it('translates the welcome fragment', () => {
    expect(translateHash('#bienvenue', 'en')).toBe('#welcome');
    expect(translateHash('#welcome', 'fr')).toBe('#bienvenue');
    expect(translateHash('#welcome', 'en')).toBe('#welcome');
  });

  it('does not take the welcome fragment for an item', () => {
    expect(parseHash('#bienvenue')).toBeNull();
    expect(parseHash('#welcome')).toBeNull();
  });
});
