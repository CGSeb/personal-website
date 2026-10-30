import { describe, expect, it } from 'vitest';
import { buildHash, parseHash, translateHash } from '../../src/scene/hash';

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
});
