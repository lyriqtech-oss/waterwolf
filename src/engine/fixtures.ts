export const homeUrl='engine://home';
export const demoDocuments:Record<string,string>={
 'engine://home':`<!doctype html>
<html><head><title>WaterWolf Engine Home</title><style>
body { background-color: #f8fbff; color: #20344f; }
h1 { color: #0b67bd; }
.feature { width: 500px; padding: 14px; border: 1px solid #bdd8f2; background-color: #e8f2ff; margin-top: 12px; margin-bottom: 16px; }
.feature strong { color: #075da9; }
</style></head><body>
<h1>Built to understand the web.</h1>
<p class="feature">This page is drawn by the <strong>WaterWolf research engine</strong>. It parses a small HTML and CSS subset and creates its own layout and display list.</p>
<h2>Explore the local engine</h2>
<p>These links navigate between controlled documents inside the Engine Lab.</p>
<ul><li><a href="engine://guide">Rendering guide</a></li><li><a href="engine://forms">Form controls</a></li></ul>
<hr><p>External sites remain disconnected until the network and security layers exist.</p>
</body></html>`,
 'engine://guide':`<!doctype html>
<html><head><title>Rendering guide</title><style>
body { background-color: #fffdf9; color: #263547; }
h1 { color: #0b67bd; }
.card { width: 480px; padding: 16px; border: 1px solid #d7dce5; background-color: #f4f7fb; margin-bottom: 18px; }
</style></head><body>
<h1>Rendering guide</h1>
<p class="card">WaterWolf lays out this card, paints the border and wraps its text within the content area.</p>
<h2>Current support</h2>
<ul><li>HTML tree and text</li><li>Selected CSS selectors and properties</li><li>Canvas display list</li></ul>
<p><a href="engine://forms">Try a local form</a> or <a href="engine://home">return home</a>.</p>
</body></html>`,
 'engine://forms':`<!doctype html>
<html><head><title>Form controls</title><style>
body { background-color: #f8fbff; color: #20344f; }
h1 { color: #0b67bd; }
form { width: 430px; padding: 18px; border: 1px solid #bfd6ee; background-color: #eaf3ff; margin-top: 18px; }
</style></head><body>
<h1>Form controls</h1>
<p>This form stays entirely inside the local Engine Lab. It does not send data anywhere.</p>
<form id="hello"><p><label>Your name</label></p><input id="name" name="name" type="text" placeholder="Type a name"><button type="submit">Preview greeting</button></form>
<p><a href="engine://home">Return home</a></p>
</body></html>`
};
