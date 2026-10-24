import type { EngineNode } from './html';
type Element=Extract<EngineNode,{kind:'element'}>;
export type CssDeclaration={property:string;value:string};
export type CssRule={selector:string;declarations:CssDeclaration[];specificity:number;order:number};
const supported=new Set(['color','background-color','font-size','font-weight','line-height','margin-top','margin-bottom']);

export function parseDeclarations(source:string):CssDeclaration[]{
 return source.split(';').map(chunk=>{const colon=chunk.indexOf(':');return colon<0?null:{property:chunk.slice(0,colon).trim().toLowerCase(),value:chunk.slice(colon+1).trim()}}).filter((item):item is CssDeclaration=>Boolean(item&&supported.has(item.property)&&item.value));
}

function compound(selector:string):{tag:string|null;id:string|null;classes:string[]}|null{
 if(!/^(?:[a-z][\w-]*)?(?:[.#][\w-]+)*$/i.test(selector)||!selector)return null;
 const tag=/^[a-z][\w-]*/i.exec(selector)?.[0]?.toLowerCase()??null;
 const id=/#([\w-]+)/.exec(selector)?.[1]??null;
 const classes=[...selector.matchAll(/\.([\w-]+)/g)].map(match=>match[1]!);
 return {tag,id,classes};
}
function specificity(selector:string):number|null{
 const parts=selector.trim().split(/\s+/);let total=0;
 for(const part of parts){const parsed=compound(part);if(!parsed)return null;total+=(parsed.tag?1:0)+(parsed.id?100:0)+parsed.classes.length*10}
 return total;
}
export function parseCss(source:string):CssRule[]{
 const clean=source.replace(/\/\*[\s\S]*?\*\//g,'');const rules:CssRule[]=[];
 const pattern=/([^{}]+)\{([^{}]*)\}/g;
 for(const match of clean.matchAll(pattern)){
  const declarations=parseDeclarations(match[2]!);if(!declarations.length)continue;
  for(const selector of match[1]!.split(',')){const normalized=selector.trim();const rank=specificity(normalized);if(rank!==null)rules.push({selector:normalized,declarations,specificity:rank,order:rules.length})}
 }
 return rules;
}
function matchesCompound(node:Element,selector:string):boolean{
 const parsed=compound(selector);if(!parsed)return false;
 if(parsed.tag&&parsed.tag!==node.tag)return false;
 if(parsed.id&&parsed.id!==node.attributes.id)return false;
 const classes=new Set((node.attributes.class??'').split(/\s+/));
 return parsed.classes.every(name=>classes.has(name));
}
export function matchesSelector(node:Element,ancestors:Element[],selector:string):boolean{
 const parts=selector.split(/\s+/);if(!matchesCompound(node,parts.at(-1)!))return false;
 let index=ancestors.length-1;
 for(let part=parts.length-2;part>=0;part--){while(index>=0&&!matchesCompound(ancestors[index]!,parts[part]!))index--;if(index<0)return false;index--}
 return true;
}
export function cascade(node:Element,ancestors:Element[],rules:CssRule[]):Record<string,string>{
 const chosen:Record<string,{value:string;rank:number;order:number}>={};
 for(const rule of rules){if(!matchesSelector(node,ancestors,rule.selector))continue;for(const item of rule.declarations){const previous=chosen[item.property];if(!previous||rule.specificity>previous.rank||rule.specificity===previous.rank&&rule.order>=previous.order)chosen[item.property]={value:item.value,rank:rule.specificity,order:rule.order}}}
 for(const item of parseDeclarations(node.attributes.style??''))chosen[item.property]={value:item.value,rank:1000,order:rules.length};
 return Object.fromEntries(Object.entries(chosen).map(([property,item])=>[property,item.value]));
}
