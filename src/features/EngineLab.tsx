import { useEffect,useRef,useState } from 'react';
import { layoutHtml,linkAt,paintLayout,type EngineLayout } from '../engine/layout';

const sample=`<!doctype html>
<html>
<head><title>WaterWolf Engine Test</title>
<style>
  body { background-color: #f8fbff; color: #20344f; }
  h1 { color: #0b67bd; }
  .feature { width: 500px; padding: 14px; border: 1px solid #bdd8f2; background-color: #e8f2ff; margin-top: 12px; margin-bottom: 16px; }
  .feature strong { color: #075da9; }
</style></head>
<body>
  <h1>Built to understand the web.</h1>
  <p class="feature">This page is drawn by the <strong>WaterWolf research engine</strong>. It parses a small HTML and CSS subset and creates its own layout and display list.</p>
  <h2>First milestone</h2>
  <p>Headings, paragraphs, emphasis, links, colors and basic line wrapping are supported. Try editing this document.</p>
  <ul><li>HTML parsing</li><li>Text layout</li><li>Canvas painting</li></ul>
  <hr>
  <p><a href="https://example.com">Links are styled, but navigation is not implemented yet.</a></p>
</body>
</html>`;

export function EngineLab(){
 const [source,setSource]=useState(sample);const [metadata,setMetadata]=useState({title:'',commands:0,links:[] as string[]});const [selectedLink,setSelectedLink]=useState<string|null>(null);
 const canvas=useRef<HTMLCanvasElement>(null);const frame=useRef<HTMLDivElement>(null);const layoutRef=useRef<EngineLayout|null>(null);
 useEffect(()=>{
  const host=frame.current;const target=canvas.current;if(!host||!target)return;
  const draw=()=>{const context=target.getContext('2d');if(!context)return;const width=Math.max(host.clientWidth,320);const layout=layoutHtml(source,width,(text,font)=>{context.font=font;return context.measureText(text).width});layoutRef.current=layout;const ratio=window.devicePixelRatio||1;const height=Math.max(layout.height,host.clientHeight);target.width=Math.ceil(width*ratio);target.height=Math.ceil(height*ratio);target.style.width=`${width}px`;target.style.height=`${height}px`;context.setTransform(ratio,0,0,ratio,0,0);paintLayout(context,layout,width,height);setMetadata({title:layout.title,commands:layout.commands.length,links:[...new Set(layout.commands.flatMap(command=>command.kind==='text'&&command.href?[command.href]:[]))]})};
  const observer=new ResizeObserver(draw);observer.observe(host);draw();return()=>observer.disconnect();
 },[source]);
 const targetAt=(event:React.MouseEvent<HTMLCanvasElement>)=>{const rect=event.currentTarget.getBoundingClientRect();return layoutRef.current?linkAt(layoutRef.current,event.clientX-rect.left,event.clientY-rect.top):null};
 return <div className="engine-lab"><div className="engine-lab-heading"><div><span className="engine-eyebrow">WATERWOLF RESEARCH</span><h1>Engine Lab</h1><p>An experimental renderer built for this project. It does not execute scripts or load external sites.</p></div><span className="status-pill">Milestone 3</span></div><div className="engine-lab-grid"><section className="engine-panel"><div className="engine-panel-header"><strong>HTML + CSS source</strong><span>Editable · local only</span></div><textarea value={source} onChange={event=>{setSource(event.target.value);setSelectedLink(null)}} spellCheck={false} aria-label="HTML source"/></section><section className="engine-panel"><div className="engine-panel-header"><strong>WaterWolf render</strong><span>{metadata.title} · {metadata.commands} drawing commands</span></div><div className="engine-viewport" ref={frame}><canvas ref={canvas} aria-label="Rendered HTML preview" role="img" onMouseMove={event=>{event.currentTarget.style.cursor=targetAt(event)?'pointer':'default'}} onClick={event=>{const href=targetAt(event);if(href)setSelectedLink(href)}}/></div>{metadata.links.length>0&&<div className="engine-links"><span>Links in this page</span>{metadata.links.map(href=><button key={href} onClick={()=>setSelectedLink(href)}>{href}</button>)}</div>}{selectedLink&&<div className="engine-link-status" role="status">Target: <strong>{selectedLink}</strong> · navigation is not connected yet.</div>}</section></div><p className="engine-note">Current subset: basic HTML, CSS selectors, box width, padding, borders, colors and clickable link targets. JavaScript, networking and security isolation remain future milestones.</p></div>
}
