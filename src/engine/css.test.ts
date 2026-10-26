import { describe,expect,it } from 'vitest';
import { cascade,parseCss } from './css';
import { findElement,parseHtml } from './html';
import { layoutHtml,linkAt } from './layout';

describe('WaterWolf CSS subset',()=>{
 it('applies selector specificity and inline styles',()=>{
  const root=parseHtml('<body><p id="intro" class="feature" style="color: green">Hi</p></body>');
  const body=findElement(root,'body')!;const paragraph=findElement(root,'p')!;
  const rules=parseCss('p { color: red } .feature { color: blue } #intro { font-size: 20px }');
  expect(cascade(paragraph,[body],rules)).toEqual({color:'green','font-size':'20px'});
 });
 it('matches descendant rules without matching unrelated ancestors',()=>{
  const root=parseHtml('<body><section class="card"><strong>One</strong></section><strong>Two</strong></body>');
  const body=findElement(root,'body')!;const section=findElement(root,'section')!;const strong=findElement(section,'strong')!;
  const rules=parseCss('.card strong { color: blue }');
  expect(cascade(strong,[body,section],rules).color).toBe('blue');
  expect(cascade((body.children[1] as typeof strong),[body],rules).color).toBeUndefined();
 });
 it('paints supported colors and spacing through WaterWolf layout',()=>{
  const page=layoutHtml('<head><style>body { background-color: #eef6ff } h1 { color: red; font-size: 24px; margin-top: 10px }</style></head><body><h1>Wolf</h1></body>',500,text=>text.length*8);
  expect(page.background).toBe('#eef6ff');
  const heading=page.commands.find(command=>command.kind==='text'&&command.text==='Wolf');
  expect(heading).toMatchObject({color:'#ff0000',font:'700 24px Arial, sans-serif'});
  expect(heading?.y).toBeGreaterThan(32);
 });
 it('ignores unsupported selectors and properties',()=>{
  const rules=parseCss('p:hover { color: red } p { position: fixed; color: blue }');
  expect(rules).toHaveLength(1);
  expect(rules[0]?.declarations).toEqual([{property:'color',value:'blue'}]);
 });
 it('allows a zero bottom margin to override the default paragraph gap',()=>{
  const normal=layoutHtml('<body><p>One</p><p>Two</p></body>',500,text=>text.length*8);
  const compact=layoutHtml('<head><style>p { margin-bottom: 0px }</style></head><body><p>One</p><p>Two</p></body>',500,text=>text.length*8);
  const second=(page:typeof normal)=>page.commands.find(command=>command.kind==='text'&&command.text==='Two')?.y??0;
  expect(second(compact)).toBeLessThan(second(normal));
 });
 it('lays out text inside a padded, bordered box with an explicit width',()=>{
  const page=layoutHtml('<head><style>.card { width: 120px; padding: 12px; border: 2px solid blue; background-color: #eef6ff }</style></head><body><div class="card">alpha beta gamma delta</div></body>',500,text=>text.length*10);
  const box=page.commands.find(command=>command.kind==='box');
  const words=page.commands.filter(command=>command.kind==='text');
  expect(box).toMatchObject({x:28,width:148,borderWidth:2,borderColor:'#0000ff',background:'#eef6ff'});
  expect(words.every(command=>command.kind==='text'&&command.x>=42&&command.x<176)).toBe(true);
  expect(new Set(words.map(command=>command.y)).size).toBeGreaterThan(1);
 });
 it('keeps nested block text within its parent content edge',()=>{
  const page=layoutHtml('<body><section style="padding: 20px; border: 1px solid navy"><p>Inside</p></section><p>Outside</p></body>',500,text=>text.length*8);
  const inside=page.commands.find(command=>command.kind==='text'&&command.text==='Inside');
  const outside=page.commands.find(command=>command.kind==='text'&&command.text==='Outside');
  expect(inside?.x).toBe(49);
  expect(outside?.x).toBe(28);
 });
 it('identifies a painted link without treating surrounding text as a link',()=>{
  const page=layoutHtml('<body><p>Before <a href="https://example.com">Visit</a> after</p></body>',500,text=>text.length*9);
  const link=page.commands.find(command=>command.kind==='text'&&command.text==='Visit');
  const before=page.commands.find(command=>command.kind==='text'&&command.text==='Before');
  if(link?.kind!=='text'||before?.kind!=='text')throw Error('Expected text commands');
  expect(linkAt(page,link.x+2,link.y-2)).toBe('https://example.com');
  expect(linkAt(page,before.x+2,before.y-2)).toBeNull();
 });
 it('ends a form box before the following paragraph',()=>{
  const page=layoutHtml('<body><form style="padding: 18px; border: 1px solid blue"><input id="name" type="text"><button>Send</button></form><p>Outside</p></body>',500,text=>text.length*8);
  const box=page.commands.find(command=>command.kind==='box');
  const outside=page.commands.find(command=>command.kind==='text'&&command.text==='Outside');
  if(box?.kind!=='box'||outside?.kind!=='text')throw Error('Expected box and paragraph');
  expect(box.y+box.height).toBeLessThan(outside.y-8);
 });
});
