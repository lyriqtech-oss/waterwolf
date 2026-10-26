import { useEffect,useRef,useState } from 'react';
import { controlAt,layoutHtml,linkAt,paintLayout,type DrawCommand,type EngineLayout } from '../engine/layout';
import { currentEngineEntry,editEnginePage,moveEngineHistory,startEngineSession,visitEnginePage } from '../engine/navigation';

export function EngineLab(){
 const [session,setSession]=useState(startEngineSession);const [values,setValues]=useState<Record<string,string>>({});
 const [focusedId,setFocusedId]=useState<string|null>(null);const [selectedLink,setSelectedLink]=useState<string|null>(null);const [submission,setSubmission]=useState<string|null>(null);
 const [metadata,setMetadata]=useState({title:'',commands:0,links:[] as string[],controls:[] as Extract<DrawCommand,{kind:'control'}>[]});
 const canvas=useRef<HTMLCanvasElement>(null);const frame=useRef<HTMLDivElement>(null);const layoutRef=useRef<EngineLayout|null>(null);
 const entry=currentEngineEntry(session);
 useEffect(()=>{
  const host=frame.current;const target=canvas.current;if(!host||!target)return;
  const draw=()=>{
   const context=target.getContext('2d');if(!context)return;
   const width=Math.max(host.clientWidth,320);
   const layout=layoutHtml(entry.source,width,(text,font)=>{context.font=font;return context.measureText(text).width},values);layoutRef.current=layout;
   const ratio=window.devicePixelRatio||1;const height=Math.max(layout.height,host.clientHeight);
   target.width=Math.ceil(width*ratio);target.height=Math.ceil(height*ratio);target.style.width=`${width}px`;target.style.height=`${height}px`;
   context.setTransform(ratio,0,0,ratio,0,0);paintLayout(context,layout,width,height,focusedId);
   setMetadata({title:layout.title,commands:layout.commands.length,links:[...new Set(layout.commands.flatMap(command=>command.kind==='text'&&command.href?[command.href]:[]))],controls:layout.commands.filter((command):command is Extract<DrawCommand,{kind:'control'}>=>command.kind==='control')});
  };
  const observer=new ResizeObserver(draw);observer.observe(host);draw();return()=>observer.disconnect();
 },[entry.source,values,focusedId]);
 const resetPageState=()=>{setValues({});setFocusedId(null);setSelectedLink(null);setSubmission(null);frame.current?.scrollTo({top:0})};
 const navigate=(href:string)=>{const next=visitEnginePage(session,href);if(next){setSession(next);resetPageState()}else setSelectedLink(href)};
 const move=(delta:-1|1)=>{const next=moveEngineHistory(session,delta);if(next!==session){setSession(next);resetPageState()}};
 const submit=(formId:string|null)=>{const fields=metadata.controls.filter(control=>control.control==='input'&&control.formId===formId).map(control=>`${control.name}: ${values[control.id]??control.value}`);setSubmission(fields.length?fields.join(' · '):'Form submitted locally with no fields.')};
 const hit=(event:React.MouseEvent<HTMLCanvasElement>)=>{const rect=event.currentTarget.getBoundingClientRect();const x=event.clientX-rect.left,y=event.clientY-rect.top;return layoutRef.current?{control:controlAt(layoutRef.current,x,y),link:linkAt(layoutRef.current,x,y)}:null};
 const chooseControl=(control:Extract<DrawCommand,{kind:'control'}>)=>{if(control.control==='input'){setFocusedId(control.id);canvas.current?.focus()}else submit(control.formId)};
 const onCanvasKey=(event:React.KeyboardEvent<HTMLCanvasElement>)=>{
  if(!focusedId)return;
  const control=metadata.controls.find(item=>item.id===focusedId&&item.control==='input');if(!control)return;
  if(event.key==='Backspace'){event.preventDefault();setValues(state=>({...state,[focusedId]:(state[focusedId]??control.value).slice(0,-1)}))}
  else if(event.key==='Enter'){event.preventDefault();submit(control.formId)}
  else if(event.key.length===1&&!event.ctrlKey&&!event.metaKey&&!event.altKey){event.preventDefault();setValues(state=>({...state,[focusedId]:(state[focusedId]??control.value)+event.key}))}
 };
 return <div className="engine-lab">
  <div className="engine-lab-heading"><div><span className="engine-eyebrow">WATERWOLF RESEARCH</span><h1>Engine Lab</h1><p>Local documents, custom layout and controls. No scripts or external requests run here.</p></div><span className="status-pill">Milestone 4</span></div>
  <div className="engine-lab-nav"><button onClick={()=>move(-1)} disabled={session.index===0} aria-label="Engine back">← Back</button><button onClick={()=>move(1)} disabled={session.index===session.entries.length-1} aria-label="Engine forward">Forward →</button><span>{entry.url}</span></div>
  <div className="engine-lab-grid"><section className="engine-panel"><div className="engine-panel-header"><strong>HTML + CSS source</strong><span>Editable · local only</span></div><textarea value={entry.source} onChange={event=>{setSession(state=>editEnginePage(state,event.target.value));setSelectedLink(null)}} spellCheck={false} aria-label="HTML source"/></section>
   <section className="engine-panel"><div className="engine-panel-header"><strong>WaterWolf render</strong><span>{metadata.title} · {metadata.commands} drawing commands</span></div><div className="engine-viewport" ref={frame}><canvas ref={canvas} tabIndex={0} role="application" aria-label="Rendered HTML preview with interactive controls" onKeyDown={onCanvasKey} onMouseMove={event=>{const target=hit(event);event.currentTarget.style.cursor=target?.control||target?.link?'pointer':'default'}} onClick={event=>{const target=hit(event);if(target?.control)chooseControl(target.control);else if(target?.link)navigate(target.link)}}/></div>
    {metadata.links.length>0&&<div className="engine-links"><span>Local links</span>{metadata.links.map(href=><button key={href} onClick={()=>navigate(href)}>{href}</button>)}</div>}
    {metadata.controls.length>0&&<div className="engine-form-access"><span>Accessible form controls</span>{metadata.controls.map(control=>control.control==='input'?<label key={control.id}>{control.name}<input value={values[control.id]??control.value} onChange={event=>setValues(state=>({...state,[control.id]:event.target.value}))} onFocus={()=>setFocusedId(control.id)} placeholder={control.placeholder}/></label>:<button key={control.id} onClick={()=>submit(control.formId)}>{control.label}</button>)}</div>}
    {selectedLink&&<div className="engine-link-status" role="status">External target: <strong>{selectedLink}</strong> · not opened.</div>}
    {submission&&<div className="engine-link-status" role="status">Local form preview: <strong>{submission}</strong></div>}
   </section></div>
  <p className="engine-note">Current subset: local history, selected HTML/CSS layout, text inputs and buttons. Form values stay in memory. External networking, JavaScript and security isolation remain future milestones.</p>
 </div>
}
