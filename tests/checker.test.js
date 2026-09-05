/* ===========================================================================
   Tests for the answer checker.   Run:  node tests/checker.test.js

   The checker is what decides whether a student is told "wrong" or told
   "right word, wrong form". Getting that boundary wrong either flatters the
   student or punishes a near miss, so it is worth pinning down.
   =========================================================================== */

'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const sandbox = { window: {}, document: { createElement: () => ({ style: {}, dataset: {}, setAttribute() {}, addEventListener() {}, appendChild() {} }), createTextNode: () => ({}) } };
vm.createContext(sandbox);
vm.runInContext(
  fs.readFileSync(path.join(__dirname, '..', 'assets', 'js', 'util.js'), 'utf8'),
  sandbox
);
const { check, normalise, stem } = sandbox.window.EA.util;

let passed = 0;
const failures = [];

function verdict(given, expected, want, label) {
  const got = check(given, expected).verdict;
  if (got === want) { passed += 1; return; }
  failures.push((label || (given + ' vs ' + expected)) + ': expected ' + want + ', got ' + got);
}

/* ---- exact matches ------------------------------------------------------- */
verdict('platform', 'platform', 'correct');
verdict('Platform', 'platform', 'correct', 'case is ignored');
verdict('  platform  ', 'platform', 'correct', 'whitespace is trimmed');
verdict('platform.', 'platform', 'correct', 'trailing punctuation ignored');
verdict('straight on', 'straight on', 'correct', 'multi-word answers');
verdict('collect', ['collect', 'pick up'], 'correct', 'any accepted answer');
verdict('pick up', ['collect', 'pick up'], 'correct', 'second accepted answer');

/* ---- curly apostrophes from the .docx ------------------------------------ */
verdict("don't", 'don’t', 'correct', 'straight vs curly apostrophe');
verdict('don’t', "don't", 'correct', 'curly vs straight apostrophe');

/* ---- wrong FORM, right word ---------------------------------------------- */
verdict('mean', 'means', 'form');
verdict('means', 'mean', 'form');
verdict('serve', 'serves', 'form');
verdict('practising', 'practise', 'form');
verdict('collected', 'collect', 'form');

/* ---- spelling slips ------------------------------------------------------ */
verdict('recipt', 'receipt', 'spelling');
verdict('platfrom', 'platform', 'spelling');
verdict('appointmnet', 'appointment', 'spelling');
verdict('cancelled', 'canceled', 'spelling', 'one-letter variant');

/* ---- genuinely different words ------------------------------------------- */
verdict('arrive', 'leave', 'wrong');
verdict('bill', 'receipt', 'wrong');
verdict('shelf', 'drawer', 'wrong');
verdict('', 'platform', 'wrong', 'empty answer');
verdict('xyz', 'platform', 'wrong');

/* A short word must not be waved through on a single-letter edit that turns
   it into a different real word — "miss" and "kiss" are not the same answer,
   but "fit"/"fat" is the case that matters for KET. */
{
  const got = check('bill', 'ball').verdict;
  if (got === 'spelling') passed += 1;
  else failures.push('short-word edit distance: expected spelling, got ' + got);
}

/* ---- helpers -------------------------------------------------------------- */
{
  if (normalise('  The  Platform. ') === 'the platform') passed += 1;
  else failures.push('normalise collapses whitespace and punctuation');

  if (stem('leaves') === stem('leave')) passed += 1;
  else failures.push('stem: leaves/leave');

  if (stem('stopped') === 'stop') passed += 1;
  else failures.push('stem: stopped -> stop, got ' + stem('stopped'));
}

/* -------------------------------------------------------------------------- */
if (failures.length) {
  console.error('\n' + failures.length + ' FAILED, ' + passed + ' passed\n');
  failures.forEach(f => console.error('  ✗ ' + f));
  process.exit(1);
}
console.log('All ' + passed + ' assertions passed.');
