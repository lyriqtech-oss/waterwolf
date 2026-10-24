import { findElement,nodeText,parseHtml,type EngineNode } from './html';
export type DrawCommand={kind:'text';text:string;x:number;y:number;font:string;color:string}|{kind:'rule';x:number;y:number;width:number;color:string};
export type EngineLayout={title:string;height:number;commands:DrawCommand[]};
export type MeasureText=(text:string,font:string)=>number;
type Style={size:number;weight:number;color:string;lineHeight:number};
const blockTags=new Set(['article','aside','blockquote','body','div','footer','h1','h2','h3','header','li','main','ol','p','section','ul']);
const hiddenTags=new Set(['head','meta','link','script','style','svg','template']);
const base:Style={size:16,weight:400,color:'#24364b',lineHeight:25};
const font=(style:Style)=>`${style.weight} ${style.size}px Arial, sans-serif`;

/** Produces a display list from the supported HTML subset. This is not a browser layout algorithm. */
export function layoutHtml(source:string,width:number,measure:MeasureText):EngineLayout{
 const document=parseHtml(source);const title=findElement(document,'title');const body=findElement(document,'body')??document;
 const commands:DrawCommand[]=[];const margin=28;const maxWidth=Math.max(160,width-margin*2);let x=margin,y=32;let lineHeight=base.lineHeight;
 const nextLine=()=>{x=margin;y+=lineHeight;lineHeight=base.lineHeight};
 const gap=(amount:number)=>{if(x>margin)nextLine();y+=amount};
 const write=(text:string,style:Style)=>{
  const words=text.replace(/\s+/g,' ').split(/( )/).filter(Boolean);
  for(const word of words){if(word===' '&&x===margin)continue;const width=measure(word,font(style));if(x+width>margin+maxWidth&&x>margin)nextLine();if(word===' '&&x===margin)continue;commands.push({kind:'text',text:word,x,y,font:font(style),color:style.color});x+=width;lineHeight=Math.max(lineHeight,style.lineHeight)}
 };
 const visit=(node:EngineNode,style:Style)=>{
  if(node.kind==='text'){write(node.text,style);return}
  if(hiddenTags.has(node.tag))return;
  const isBlock=blockTags.has(node.tag);if(isBlock&&x>margin)nextLine();
  let next=style;
  if(node.tag==='h1')next={...style,size:30,weight:700,lineHeight:42};
  else if(node.tag==='h2')next={...style,size:24,weight:700,lineHeight:35};
  else if(node.tag==='h3')next={...style,size:19,weight:700,lineHeight:29};
  else if(node.tag==='strong'||node.tag==='b')next={...style,weight:700};
  else if(node.tag==='a')next={...style,color:'#1175cf'};
  if(node.tag==='li')write('•  ',next);
  if(node.tag==='br'){nextLine();return}
  if(node.tag==='hr'){gap(9);commands.push({kind:'rule',x:margin,y,width:maxWidth,color:'#d8e2ed'});y+=15;return}
  for(const child of node.children)visit(child,next);
  if(isBlock){if(x>margin)nextLine();if(['h1','h2','h3','p','li','blockquote'].includes(node.tag))y+=node.tag==='h1'?12:8}
 };
 visit(body,base);
 return {title:title?nodeText(title).trim():'Untitled page',height:Math.max(y+28,120),commands};
}

export function paintLayout(context:CanvasRenderingContext2D,layout:EngineLayout,width:number,height:number){
 context.clearRect(0,0,width,height);context.fillStyle='#ffffff';context.fillRect(0,0,width,height);
 for(const command of layout.commands){if(command.kind==='text'){context.font=command.font;context.fillStyle=command.color;context.fillText(command.text,command.x,command.y)}else{context.fillStyle=command.color;context.fillRect(command.x,command.y,command.width,1)}}
}
