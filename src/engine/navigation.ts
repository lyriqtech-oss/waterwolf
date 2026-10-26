import { demoDocuments,homeUrl } from './fixtures';
export type EngineEntry={url:string;source:string};
export type EngineSession={entries:EngineEntry[];index:number};
export const startEngineSession=():EngineSession=>({entries:[{url:homeUrl,source:demoDocuments[homeUrl]!}],index:0});
export const currentEngineEntry=(session:EngineSession):EngineEntry=>session.entries[session.index]!;
export function visitEnginePage(session:EngineSession,url:string):EngineSession|null{
 const source=demoDocuments[url];if(source===undefined)return null;
 return {entries:[...session.entries.slice(0,session.index+1),{url,source}],index:session.index+1};
}
export function moveEngineHistory(session:EngineSession,delta:-1|1):EngineSession{
 const index=session.index+delta;return index<0||index>=session.entries.length?session:{...session,index};
}
export function editEnginePage(session:EngineSession,source:string):EngineSession{
 return {...session,entries:session.entries.map((entry,index)=>index===session.index?{...entry,source}:entry)};
}
