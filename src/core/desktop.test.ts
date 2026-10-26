import { describe, expect, it } from 'vitest';
import { addressToUrl, searchUrl } from './desktop';

describe('desktop address bar', () => {
  it('routes a query to the selected provider', () => {
    expect(searchUrl(' notícias de tecnologia ')).toBe('https://duckduckgo.com/?q=not%C3%ADcias%20de%20tecnologia');
    expect(searchUrl('example', 'Google')).toBe('https://www.google.com/search?q=example');
    expect(searchUrl('example', 'Bing')).toBe('https://www.bing.com/search?q=example');
  });

  it('recognizes addresses without turning ordinary phrases into hosts', () => {
    expect(addressToUrl('example.com')).toBe('https://example.com/');
    expect(addressToUrl('localhost:5173')).toBe('http://localhost:5173/');
    expect(addressToUrl('research this topic')).toBeNull();
  });
});
