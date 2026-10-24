import { cascade,parseCss,type CssRule } from './css';
import { findElement,nodeText,parseHtml,type EngineNode } from './html';
export type DrawCommand={kind:'text';text:string;x:number;y:number;width:number;height:number;font:string;color:string;href?:string}|{kind:'rule';x:number;y:number;width:number;color:string}|{kind:'box';x:number;y:number;width:number;height:number;background:string|null;borderWidth:number;borderColor:string};
export type EngineLayout={title:string;height:number;background:string;commands:DrawCommand[]};
export type MeasureText=(text:string,font:string)=>number;
type Element=Extract<EngineNode,{kind:'element'}>;
type Style={size:number;weight:number;color:string;lineHeight:number;marginTop:number;marginBottom:number;width:number|null;padding:number;borderWidth:number;borderColor:string};
const blockTags=new Set(['article','aside','blockquote','body','div','footer','h1','h2','h3','header','li','main','ol','p','section','ul']);
const hiddenTags=new Set(['head','meta','link','script','style','svg','template']);
const base:Style={size:16,weight:400,color:'#24364b',lineHeight:25,marginTop:0,marginBottom:0,width:null,padding:0,borderWidth:0,borderColor:'#d8e2ed'};
const font=(style:Style)=>`${style.weight} ${style.size}px Arial, sans-serif`;
const colors:Record<string,string>={black:'#000000',white:'#ffffff',red:'#ff0000',blue:'#0000ff',green:'#008000',navy:'#000080',gray:'#808080',grey:'#808080'};
const cssColor=(value:string|undefined)=>{if(!value)return null;const normalized=value.trim().toLowerCase();return /^#(?:[\da-f]{3}|[\da-f]{6})$/.test(normalized)?normalized:colors[normalized]??null};
const cssPx=(value:string|undefined,min:number,max:number)=>{const match=value&&/^(-?\d+(?:\.\d+)?)px$/i.exec(value.trim());return match?Math.min(max,Math.max(min,Number(match[1]))):null};
function collectStyles(node:EngineNode):string[]{return node.kind==='text'?[]:[...(node.tag==='style'?[nodeText(node)]:[]),...node.children.flatMap(collectStyles)]}
function applyCss(node:Element,parent:Style,ancestors:Element[],rules:CssRule[]):{style:Style;background:string|null}{
 const style:Style={...parent,marginTop:0,marginBottom:0,width:null,padding:0,borderWidth:0,borderColor:'#d8e2ed'};const values=cascade(node,ancestors,rules);
 const size=cssPx(values['font-size'],8,72);if(size!==null){style.size=size;style.lineHeight=Math.round(size*1.5)}
 const lineHeight=cssPx(values['line-height'],10,120);if(lineHeight!==null)style.lineHeight=lineHeight;
 const color=cssColor(values.color);if(color)style.color=color;
 const weight=values['font-weight'];if(weight==='bold')style.weight=700;else if(weight==='normal')style.weight=400;else if(weight&&/^[1-9]00$/.test(weight))style.weight=Number(weight);
 style.marginTop=cssPx(values['margin-top'],0,100)??0;style.marginBottom=cssPx(values['margin-bottom'],0,100)??(['h1','h2','h3','p','li','blockquote'].includes(node.tag)?node.tag==='h1'?12:8:0);
 style.width=cssPx(values.width,0,1600);style.padding=cssPx(values.padding,0,100)??0;
 const border=/^(\d+(?:\.\d+)?)px\s+solid\s+(#[\da-f]{3,6}|[a-z]+)$/i.exec(values.border??'');
 if(border){style.borderWidth=Math.min(20,Number(border[1]));style.borderColor=cssColor(border[2])??style.borderColor}
 return {style,background:cssColor(values['background-color'])};
}

/** Produces a display list from the supported HTML subset. This is not a browser layout algorithm. */
export function layoutHtml(source:string,width:number,measure:MeasureText):EngineLayout{
 const document=parseHtml(source);const title=findElement(document,'title');const body=findElement(document,'body')??document;
 const rules=parseCss(collectStyles(document).join('\n'));const commands:DrawCommand[]=[];const margin=28;let left=margin,right=Math.max(width-margin,margin+160),x=left,y=32;let lineHeight=base.lineHeight;let background='#ffffff';
 const nextLine=()=>{x=left;y+=lineHeight;lineHeight=base.lineHeight};
 const gap=(amount:number)=>{if(x>left)nextLine();y+=amount};
 const write=(text:string,style:Style,href?:string)=>{
  const words=text.replace(/\s+/g,' ').split(/( )/).filter(Boolean);
  for(const word of words){if(word===' '&&x===left)continue;const advance=measure(word,font(style));if(x+advance>right&&x>left)nextLine();if(word===' '&&x===left)continue;commands.push({kind:'text',text:word,x,y,width:advance,height:style.lineHeight,font:font(style),color:style.color,...(href?{href}:{})});x+=advance;lineHeight=Math.max(lineHeight,style.lineHeight)}
 };
 const visit=(node:EngineNode,style:Style,ancestors:Element[],href?:string)=>{
  if(node.kind==='text'){write(node.text,style,href);return}
  if(hiddenTags.has(node.tag))return;
  const isBlock=blockTags.has(node.tag);if(isBlock&&x>left)nextLine();
  let next=style;
  if(node.tag==='h1')next={...style,size:30,weight:700,lineHeight:42};
  else if(node.tag==='h2')next={...style,size:24,weight:700,lineHeight:35};
  else if(node.tag==='h3')next={...style,size:19,weight:700,lineHeight:29};
  else if(node.tag==='strong'||node.tag==='b')next={...style,weight:700};
  else if(node.tag==='a')next={...style,color:'#1175cf'};
  const computed=applyCss(node,next,ancestors,rules);next=computed.style;
  if(isBlock)y+=next.marginTop;
  const parentLeft=left,parentRight=right;
  const outerWidth=isBlock?Math.min(parentRight-parentLeft,next.width===null?parentRight-parentLeft:next.width+2*(next.padding+next.borderWidth)):0;
  const inset=next.padding+next.borderWidth;
  const boxX=left,boxY=y-next.size;const insertAt=commands.length;
  if(isBlock&&node.tag!=='body'&&inset){left=boxX+inset;right=boxX+Math.max(outerWidth,inset*2+32)-inset;x=left;y+=inset}
  else if(isBlock&&next.width!==null){right=boxX+Math.max(outerWidth,32);x=left}
  if(node.tag==='body'&&computed.background)background=computed.background;
  const activeHref=node.tag==='a'?node.attributes.href:href;
  if(node.tag==='li')write('•  ',next,activeHref);
  if(node.tag==='br'){nextLine();return}
  if(node.tag==='hr'){gap(9);commands.push({kind:'rule',x:left,y,width:right-left,color:'#d8e2ed'});y+=15;return}
  for(const child of node.children)visit(child,next,[...ancestors,node],activeHref);
  if(isBlock){
   if(x>left)nextLine();
   y+=inset;
   if(node.tag!=='body'&&(computed.background||next.borderWidth))commands.splice(insertAt,0,{kind:'box',x:boxX,y:boxY,width:outerWidth,height:Math.max(next.lineHeight,y-boxY),background:computed.background,borderWidth:next.borderWidth,borderColor:next.borderColor});
   left=parentLeft;right=parentRight;x=left;y+=next.marginBottom;
  }
 };
 visit(body,base,[]);
 return {title:title?nodeText(title).trim():'Untitled page',height:Math.max(y+28,120),background,commands};
}

export function paintLayout(context:CanvasRenderingContext2D,layout:EngineLayout,width:number,height:number){
 context.clearRect(0,0,width,height);context.fillStyle=layout.background;context.fillRect(0,0,width,height);
 for(const command of layout.commands){
  if(command.kind==='text'){context.font=command.font;context.fillStyle=command.color;context.fillText(command.text,command.x,command.y)}
  else if(command.kind==='rule'){context.fillStyle=command.color;context.fillRect(command.x,command.y,command.width,1)}
  else{if(command.background){context.fillStyle=command.background;context.fillRect(command.x,command.y,command.width,command.height)}if(command.borderWidth){context.lineWidth=command.borderWidth;context.strokeStyle=command.borderColor;context.strokeRect(command.x+command.borderWidth/2,command.y+command.borderWidth/2,command.width-command.borderWidth,command.height-command.borderWidth)}}
 }
}

export function linkAt(layout:EngineLayout,x:number,y:number):string|null{
 for(let index=layout.commands.length-1;index>=0;index--){const command=layout.commands[index]!;if(command.kind==='text'&&command.href&&x>=command.x&&x<=command.x+command.width&&y>=command.y-command.height&&y<=command.y+4)return command.href}
 return null;
}
