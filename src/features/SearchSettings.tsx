import { useState } from 'react';
import type { SearchProvider } from '../core/desktop';

const providers: SearchProvider[] = ['DuckDuckGo', 'Google', 'Bing'];

export function SearchSettings() {
  const [provider, setProvider] = useState<SearchProvider>(() => {
    const saved = localStorage.getItem('waterwolf-search-engine');
    return saved === 'Google' || saved === 'Bing' ? saved : 'DuckDuckGo';
  });
  const choose = (next: SearchProvider) => { localStorage.setItem('waterwolf-search-engine', next); setProvider(next); };
  return <div className="search-settings"><p>Queries from the address bar open this provider's results page in a WaterWolf tab.</p><div role="radiogroup" aria-label="Default search provider">{providers.map(item => <label key={item}><input type="radio" name="search-provider" value={item} checked={provider === item} onChange={() => choose(item)}/><span><strong>{item}</strong>{item === 'DuckDuckGo' && <small>Default</small>}</span></label>)}</div><small>Your choice is saved on this device. Search queries are sent to the selected provider.</small></div>;
}
