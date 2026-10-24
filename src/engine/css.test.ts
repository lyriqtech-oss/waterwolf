import { describe,expect,it } from 'vitest';
import { cascade,parseCss } from './css';
import { findElement,parseHtml } from './html';
import { layoutHtml } from './layout';

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
});
