import { describe, expect, it } from 'vitest';
import { recordHistory } from './history';

describe('local browsing history', () => {
  it('records web visits by Space and ignores internal pages', () => {
    const first = recordHistory([], { url: 'https://example.com/', title: 'Example', spaceId: 'personal', visitedAt: '2026-10-25T10:00:00.000Z' }, 'one');
    expect(first).toHaveLength(1);
    expect(recordHistory(first, { url: 'waterwolf://settings', title: 'Settings', spaceId: 'personal', visitedAt: '2026-10-25T10:01:00.000Z' }, 'two')).toEqual(first);
    expect(recordHistory(first, { url: `https://example.com/${'a'.repeat(2049)}`, title: 'Long', spaceId: 'personal', visitedAt: '2026-10-25T10:01:00.000Z' }, 'two')).toEqual(first);
    const second = recordHistory(first, { url: 'https://example.com/', title: 'Example', spaceId: 'work', visitedAt: '2026-10-25T10:02:00.000Z' }, 'two');
    expect(second.map(entry => entry.spaceId)).toEqual(['work', 'personal']);
  });

  it('coalesces immediate duplicate navigation events but keeps later revisits', () => {
    const visit = { url: 'https://example.com/', title: 'Example', spaceId: 'personal', visitedAt: '2026-10-25T10:00:00.000Z' };
    const first = recordHistory([], visit, 'one');
    const duplicate = recordHistory(first, { ...visit, title: 'Updated', visitedAt: '2026-10-25T10:00:02.000Z' }, 'two');
    expect(duplicate).toHaveLength(1);
    expect(duplicate[0]?.title).toBe('Updated');
    expect(recordHistory(duplicate, { ...visit, visitedAt: '2026-10-25T10:05:00.000Z' }, 'three')).toHaveLength(2);
  });
});
