import { useEffect,useRef,useState } from 'react';
import { layoutHtml,paintLayout } from '../engine/layout';

const sample=`<!doctype html>
<html>
<head><title>WaterWolf Engine Test</title></head>
<body>
  <h1>Built to understand the web.</h1>
  <p>This page is drawn by the <strong>WaterWolf research engine</strong>. It parses a small HTML subset and creates its own layout and display list.</p>
  <h2>First milestone</h2>
  <p>Headings, paragraphs, emphasis, links and basic line wrapping are supported. Try editing this document.</p>
  <ul><li>HTML parsing</li><li>Text layout</li><li>Canvas painting</li></ul>
  <hr>
  <p><a href="https://example.com">Links are styled, but navigation is not implemented yet.</a></p>
</body>
</html>`;

export function EngineLab(){
 const [source,setSource]=useState(sample);const [metadata,setMetadata]=useState({title:'',commands:0});
 const canvas=useRef<HTMLCanvasElement>(null);const frame=useRef<HTMLDivElement>(null);
 useEffect(()=>{
  const host=frame.current;const target=canvas.current;if(!host||!target)return;
  const draw=()=>{const context=target.getContext('2d');if(!context)return;const width=Math.max(host.clientWidth,320);const layout=layoutHtml(source,width,(text,font)=>{context.font=font;return context.measureText(text).width});const ratio=window.devicePixelRatio||1;const height=Math.max(layout.height,host.clientHeight);target.width=Math.ceil(width*ratio);target.height=Math.ceil(height*ratio);target.style.width=`${width}px`;target.style.height=`${height}px`;context.setTransform(ratio,0,0,ratio,0,0);paintLayout(context,layout,width,height);setMetadata({title:layout.title,commands:layout.commands.length})};
  const observer=new ResizeObserver(draw);observer.observe(host);draw();return()=>observer.disconnect();
 },[source]);
 return <div className="engine-lab"><div className="engine-lab-heading"><div><span className="engine-eyebrow">WATERWOLF RESEARCH</span><h1>Engine Lab</h1><p>An experimental renderer built for this project. It does not execute scripts or load external sites.</p></div><span className="status-pill">Milestone 1</span></div><div className="engine-lab-grid"><section className="engine-panel"><div className="engine-panel-header"><strong>HTML source</strong><span>Editable · local only</span></div><textarea value={source} onChange={event=>setSource(event.target.value)} spellCheck={false} aria-label="HTML source"/></section><section className="engine-panel"><div className="engine-panel-header"><strong>WaterWolf render</strong><span>{metadata.title} · {metadata.commands} drawing commands</span></div><div className="engine-viewport" ref={frame}><canvas ref={canvas} aria-label="Rendered HTML preview" role="img"/></div></section></div><p className="engine-note">Current subset: text, headings, paragraphs, lists, links, emphasis and horizontal rules. CSS, JavaScript, networking and security isolation are future milestones.</p></div>
}
