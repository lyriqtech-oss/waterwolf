import { describe,expect,it } from 'vitest';
import { currentEngineEntry,editEnginePage,moveEngineHistory,startEngineSession,visitEnginePage } from './navigation';

describe('local engine navigation',()=>{
 it('visits known fixtures and preserves back and forward entries',()=>{
  const home=startEngineSession();const guide=visitEnginePage(home,'engine://guide')!;
  expect(currentEngineEntry(guide).url).toBe('engine://guide');
  expect(currentEngineEntry(moveEngineHistory(guide,-1)).url).toBe('engine://home');
  expect(currentEngineEntry(moveEngineHistory(moveEngineHistory(guide,-1),1)).url).toBe('engine://guide');
 });
 it('drops forward history after a new visit',()=>{
  const guide=visitEnginePage(startEngineSession(),'engine://guide')!;
  const forms=visitEnginePage(moveEngineHistory(guide,-1),'engine://forms')!;
  expect(forms.entries.map(entry=>entry.url)).toEqual(['engine://home','engine://forms']);
 });
 it('keeps edits with their history entry and rejects unknown targets',()=>{
  const edited=editEnginePage(startEngineSession(),'<body>Edited</body>');
  expect(currentEngineEntry(edited).source).toBe('<body>Edited</body>');
  expect(visitEnginePage(edited,'https://example.com')).toBeNull();
 });
});
