import { describe,expect,it } from 'vitest';
import { findElement,nodeText,parseHtml } from './html';
import { controlAt,layoutHtml } from './layout';

describe('WaterWolf research engine',()=>{
 it('parses nested elements, attributes and character references',()=>{
  const root=parseHtml('<body><p title="A &amp; B">Hello <strong>Wolf</strong> &lt;3</p></body>');
  const paragraph=findElement(root,'p');
  expect(paragraph?.attributes.title).toBe('A & B');
  expect(paragraph&&nodeText(paragraph)).toBe('Hello Wolf <3');
 });
 it('ignores scripts and styles in its display list',()=>{
  const page=layoutHtml('<html><head><title>Test</title><style>secret</style></head><body><h1>Hello</h1><script>danger()</script><p>World</p></body></html>',500,text=>text.length*8);
  expect(page.title).toBe('Test');
  expect(page.commands.filter(command=>command.kind==='text').map(command=>command.text).join('')).toContain('Hello');
  expect(page.commands.some(command=>command.kind==='text'&&command.text.includes('danger'))).toBe(false);
 });
 it('wraps text within a narrow viewport',()=>{
  const page=layoutHtml('<body><p>alpha beta gamma delta</p></body>',180,text=>text.length*10);
  const lines=new Set(page.commands.filter(command=>command.kind==='text').map(command=>command.y));
  expect(lines.size).toBeGreaterThan(1);
 });
 it('keeps greater-than signs inside quoted attributes',()=>{
  const root=parseHtml('<body><a title="a > b" href="/test?q=1>0">Link</a></body>');
  const link=findElement(root,'a');
  expect(link?.attributes.title).toBe('a > b');
  expect(link?.attributes.href).toBe('/test?q=1>0');
  expect(link&&nodeText(link)).toBe('Link');
 });
 it('treats script markup as text rather than document nodes',()=>{
  const root=parseHtml('<body><script>if (a < b) document.write("<h1>Injected</h1>")</script><p>Safe</p></body>');
  expect(findElement(root,'h1')).toBeNull();
  expect(findElement(root,'p')&&nodeText(findElement(root,'p')!)).toBe('Safe');
 });
 it('lays out a local text field and button with form association',()=>{
  const page=layoutHtml('<body><form id="hello"><input id="name" name="name" type="text" placeholder="Your name"><button>Send</button></form></body>',500,text=>text.length*9,{name:'Wolf'});
  const controls=page.commands.filter(command=>command.kind==='control');
  expect(controls).toHaveLength(2);
  expect(controls[0]).toMatchObject({control:'input',id:'name',name:'name',formId:'hello',value:'Wolf'});
  expect(controls[1]).toMatchObject({control:'button',formId:'hello',label:'Send'});
  const input=controls[0];if(input?.kind!=='control')throw Error('Missing input');
  expect(controlAt(page,input.x+5,input.y+5)?.id).toBe('name');
 });
 it('does not create an editable control for unsupported input types',()=>{
  const page=layoutHtml('<body><input type="password" name="secret"></body>',500,text=>text.length*8);
  expect(page.commands.some(command=>command.kind==='control')).toBe(false);
 });
});
