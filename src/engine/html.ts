export type EngineNode = { kind:'text'; text:string } | { kind:'element'; tag:string; attributes:Record<string,string>; children:EngineNode[] };

const voidTags=new Set(['area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr']);
const rawTextTags=new Set(['script','style','textarea']);
function tagEnd(source:string,start:number):number{
 let quote:'"'|"'"|null=null;
 for(let index=start;index<source.length;index++){
  const char=source[index];
  if(quote){if(char===quote)quote=null}
  else if(char==='"'||char==="'")quote=char;
  else if(char==='>')return index;
 }
 return -1;
}
const decodeEntities=(value:string)=>value.replace(/&(#x[\da-f]+|#\d+|amp|lt|gt|quot|apos|nbsp);/gi,(_,entity:string)=>{
 const named:Record<string,string>={amp:'&',lt:'<',gt:'>',quot:'"',apos:"'",nbsp:' '};
 if(entity[0]==='#'){const code=entity[1]?.toLowerCase()==='x'?parseInt(entity.slice(2),16):parseInt(entity.slice(1),10);return Number.isFinite(code)&&code>0&&code<=0x10ffff?String.fromCodePoint(code):'�'}
 return named[entity.toLowerCase()]??`&${entity};`;
});

/** An intentionally small HTML subset for the WaterWolf research engine. No scripts execute. */
export function parseHtml(source:string):EngineNode {
 const root:EngineNode={kind:'element',tag:'document',attributes:{},children:[]};
 const stack:Array<EngineNode & {kind:'element'}>=[root];
 let cursor=0;
 while(cursor<source.length){
  const current=stack.at(-1)!;
  if(rawTextTags.has(current.tag)){
   const closePattern=new RegExp(`</${current.tag}\\s*>`,'ig');closePattern.lastIndex=cursor;
   const close=closePattern.exec(source);const end=close?.index??source.length;
   current.children.push({kind:'text',text:current.tag==='textarea'?decodeEntities(source.slice(cursor,end)):source.slice(cursor,end)});
   cursor=close?closePattern.lastIndex:source.length;stack.pop();continue;
  }
  if(source.startsWith('<!--',cursor)){const end=source.indexOf('-->',cursor+4);cursor=end<0?source.length:end+3;continue}
  if(source[cursor]==='<'){
   if(!/^<[a-z!/\?]/i.test(source.slice(cursor,cursor+2))){current.children.push({kind:'text',text:'<'});cursor++;continue}
   const end=tagEnd(source,cursor+1);if(end<0){current.children.push({kind:'text',text:decodeEntities(source.slice(cursor))});break}
   const token=source.slice(cursor+1,end).trim();cursor=end+1;
   if(!token||token.startsWith('!')||token.startsWith('?'))continue;
   if(token.startsWith('/')){const tag=token.slice(1).trim().toLowerCase();let index=-1;for(let position=stack.length-1;position>0;position--){if(stack[position]!.tag===tag){index=position;break}}if(index>0)stack.length=index;continue}
   const match=/^([a-z][\w:-]*)/i.exec(token);if(!match)continue;
   const tag=match[1]!.toLowerCase();const attributes:Record<string,string>={};
   if(tag==='li'&&stack.at(-1)?.tag==='li')stack.pop();
   if(tag==='p'&&stack.at(-1)?.tag==='p')stack.pop();
   const rest=token.slice(match[0].length);const pattern=/([a-z_:][\w:.-]*)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s/>]+)))?/gi;
   for(const part of rest.matchAll(pattern))attributes[part[1]!.toLowerCase()]=decodeEntities(part[2]??part[3]??part[4]??'');
   const node:EngineNode & {kind:'element'}={kind:'element',tag,attributes,children:[]};stack.at(-1)!.children.push(node);
   if(!voidTags.has(tag)&&!token.endsWith('/'))stack.push(node);
   continue;
  }
  const next=source.indexOf('<',cursor);const end=next<0?source.length:next;
  stack.at(-1)!.children.push({kind:'text',text:decodeEntities(source.slice(cursor,end))});cursor=end;
 }
 return root;
}

export function nodeText(node:EngineNode):string{return node.kind==='text'?node.text:node.children.map(nodeText).join('')}
export function findElement(node:EngineNode,tag:string):Extract<EngineNode,{kind:'element'}>|null{
 if(node.kind==='text')return null;if(node.tag===tag)return node;
 for(const child of node.children){const found=findElement(child,tag);if(found)return found}return null;
}
