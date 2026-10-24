import type { Tab } from './models';
/** Chromium/CEF implementations replace this boundary without changing browser UI. */
export interface BrowserEngineAdapter {
  navigate(tabId:string,url:string):Promise<void>; back(tabId:string):Promise<void>; forward(tabId:string):Promise<void>;
  reload(tabId:string):Promise<void>; stop(tabId:string):Promise<void>; createTab(url?:string):Promise<Tab>;
  closeTab(tabId:string):Promise<void>; moveTab(tabId:string,index:number):Promise<void>; getTabs():Promise<Tab[]>;
  getHistory():Promise<{title:string;url:string;visitedAt:string}[]>; getBookmarks():Promise<{title:string;url:string}[]>;
  download(url:string):Promise<void>; getPageContent(tabId:string):Promise<string>; getSelection(tabId:string):Promise<string>;
  getPageMetadata(tabId:string):Promise<{title:string;url:string;description?:string}>;
}
export class EngineUnavailableError extends Error { constructor(){super('Browser engine is not connected in this UI foundation.')} }
/** Honest preview adapter: no external navigation or privileged page access. */
export const previewEngine:BrowserEngineAdapter={
  navigate:async()=>{throw new EngineUnavailableError()},back:async()=>{throw new EngineUnavailableError()},forward:async()=>{throw new EngineUnavailableError()},reload:async()=>{},stop:async()=>{},
  createTab:async()=>{throw new EngineUnavailableError()},closeTab:async()=>{},moveTab:async()=>{},getTabs:async()=>[],getHistory:async()=>[],getBookmarks:async()=>[],download:async()=>{throw new EngineUnavailableError()},
  getPageContent:async()=>{throw new EngineUnavailableError()},getSelection:async()=>{throw new EngineUnavailableError()},getPageMetadata:async()=>{throw new EngineUnavailableError()}
};
