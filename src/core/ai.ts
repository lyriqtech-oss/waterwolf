import type { AIRequest,AIMode } from './models';
export interface LocalModelProvider { isAvailable():Promise<boolean>; getCapabilities():Promise<string[]>; loadModel(id:string):Promise<void>; unloadModel():Promise<void>; generate(prompt:string):Promise<string>; embed(text:string):Promise<number[]>; summarize(text:string):Promise<string>; classify(text:string):Promise<string>; extract(text:string,schema:Record<string,string>):Promise<Record<string,unknown>>; }
export class NoLocalModelProvider implements LocalModelProvider {
  async isAvailable():Promise<boolean>{return false}
  async getCapabilities():Promise<string[]>{return []}
  async loadModel(_id:string):Promise<void>{throw new Error('No local model configured')}
  async unloadModel():Promise<void>{}
  async generate(_prompt:string):Promise<string>{throw new Error('No local model configured')}
  async embed(_text:string):Promise<number[]>{throw new Error('No local model configured')}
  async summarize(_text:string):Promise<string>{throw new Error('No local model configured')}
  async classify(_text:string):Promise<string>{throw new Error('No local model configured')}
  async extract(_text:string,_schema:Record<string,string>):Promise<Record<string,unknown>>{throw new Error('No local model configured')}
}
export interface CloudModelProvider { generate(request:AIRequest):Promise<string>; }
export type RouteDecision = {target:'deterministic'|'local'|'cloud-cheap'|'cloud-standard'|'cloud-premium'|'agent';reason:string};
/** Pure policy decision. Callers still need explicit consent and configured providers. */
export function routeAIRequest(request:AIRequest, mode:AIMode,localAvailable:boolean,budgetRemaining:number):RouteDecision {
  if(request.tier===0)return {target:'deterministic',reason:'No model needed'};
  if(mode==='off')return {target:'deterministic',reason:'AI disabled'};
  if(localAvailable && mode!=='cloud' && request.tier<=1)return {target:'local',reason:'Local-first preference'};
  if(mode==='local'||request.privacy==='local-only')return {target:'deterministic',reason:'Cloud access is disabled'};
  if(budgetRemaining<request.estimatedCost)return {target:'deterministic',reason:'Insufficient AI budget'};
  return {target:request.tier===2?'cloud-cheap':request.tier===3?'cloud-standard':'agent',reason:'Cloud route requires configured provider and approval'};
}
