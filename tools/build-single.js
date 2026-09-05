/* ===========================================================================
   build-single.js — inline everything into one portable .html file.

   Run:  node tools/build-single.js

   Produces:
     dist/englishactivities.html   a complete standalone page. Email it to a
                                   student, put it on a USB stick, open it
                                   offline — it works with no server and no
                                   other files.
     dist/artifact-body.html       the same page as a body-only fragment, for
                                   hosts that supply their own <html>/<head>.

   The source of truth stays index.html: this script reads the <script> and
   <link> tags from it, so adding a pack there is picked up automatically.
   =========================================================================== */

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const read = p => fs.readFileSync(path.join(ROOT, p), 'utf8');

const html = read('index.html');

// Pull the asset lists straight out of index.html so the two never drift.
const cssFiles = [...html.matchAll(/<link[^>]+href="([^"]+\.css)"/g)].map(m => m[1]);
const jsFiles = [...html.matchAll(/<script src="([^"]+\.js)"><\/script>/g)].map(m => m[1]);

if (!cssFiles.length || !jsFiles.length) {
  console.error('Could not find the asset tags in index.html — did the markup change?');
  process.exit(1);
}

const title = (html.match(/<title>([^<]*)<\/title>/) || [, 'English Activities'])[1];
const favicon = (html.match(/<link rel="icon"[^>]*>/) || [''])[0];

const styles = cssFiles.map(f => '/* ' + f + ' */\n' + read(f)).join('\n\n');

// </script> inside a string literal would close the inlined tag early.
const scripts = jsFiles
  .map(f => '/* ' + f + ' */\n' + read(f).replace(/<\/script>/gi, '<\\/script>'))
  .join('\n;\n');

const body = `<main id="app" role="main">
  <noscript>
    <div style="padding:2rem;font-family:system-ui,sans-serif">
      <h2>JavaScript is switched off</h2>
      <p>These activities need JavaScript. Turn it on and reload the page.</p>
    </div>
  </noscript>
</main>`;

// Hosts that show the title in a gallery want the product name alone, not the
// name plus an explainer, so drop anything after an em dash.
const shortTitle = title.split('—')[0].trim();

const bodyFragment = `<title>${shortTitle}</title>
<style>
${styles}
</style>

${body}

<script>
${scripts}
</script>
`;

const standalone = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#0e7c86">
<title>${title}</title>
${favicon}
<style>
${styles}
</style>
</head>
<body>
${body}
<script>
${scripts}
</script>
</body>
</html>
`;

fs.mkdirSync(path.join(ROOT, 'dist'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'dist', 'englishactivities.html'), standalone);
fs.writeFileSync(path.join(ROOT, 'dist', 'artifact-body.html'), bodyFragment);

const kb = n => (n / 1024).toFixed(0) + ' KB';
console.log('Inlined ' + cssFiles.length + ' stylesheet(s) and ' + jsFiles.length + ' script(s).');
console.log('  dist/englishactivities.html  ' + kb(standalone.length));
console.log('  dist/artifact-body.html      ' + kb(bodyFragment.length));
