/* ===========================================================================
   Tests for the retrieval engine.   Run:  node tests/srs.test.js

   These cover the two rules the whole platform rests on, because they are
   the part a teacher cannot eyeball: the promotion rule, and the 1/3/7/14
   scheduling ladder.
   =========================================================================== */

'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

// srs.js is a browser file; give it just enough of a window to attach to.
const sandbox = { window: {} };
vm.createContext(sandbox);
vm.runInContext(
  fs.readFileSync(path.join(__dirname, '..', 'assets', 'js', 'srs.js'), 'utf8'),
  sandbox
);
const SRS = sandbox.window.EA.SRS;

let passed = 0;
const failures = [];

function ok(label, condition, detail) {
  if (condition) { passed += 1; return; }
  failures.push(label + (detail ? '  (' + detail + ')' : ''));
}

function eq(label, actual, expected) {
  ok(label, actual === expected, 'expected ' + JSON.stringify(expected) + ', got ' + JSON.stringify(actual));
}

const bucket = () => ({ words: {}, activities: {}, sessions: [] });

/* --------------------------------------------------------------------------
   Status
   -------------------------------------------------------------------------- */
{
  const b = bucket();
  eq('unseen word is red', SRS.statusOf(b.words.leave), 'red');
  ok('unseen word is due', SRS.isDue(b.words.leave));
  eq('partial record does not throw', SRS.statusOf({}), 'red');
  eq('null record does not throw', SRS.statusOf(null), 'red');
}

/* --------------------------------------------------------------------------
   THE PROMOTION RULE
   "green only after producing it correctly on two different days"
   -------------------------------------------------------------------------- */
{
  const b = bucket();

  SRS.setClock('2026-03-01');
  SRS.answer(b, 'leave', true, SRS.RECOGNITION);
  eq('recognition win -> amber', SRS.statusOf(b.words.leave), 'amber');

  SRS.setClock('2026-03-02');
  SRS.answer(b, 'leave', true, SRS.RECOGNITION);
  SRS.setClock('2026-03-03');
  SRS.answer(b, 'leave', true, SRS.RECOGNITION);
  eq('recognition can never reach green', SRS.statusOf(b.words.leave), 'amber');
}

{
  const b = bucket();
  SRS.setClock('2026-03-01');
  SRS.answer(b, 'collect', true, SRS.PRODUCTION);
  eq('one production day -> amber', SRS.statusOf(b.words.collect), 'amber');

  // Same day again must NOT count as a second day.
  SRS.answer(b, 'collect', true, SRS.PRODUCTION);
  eq('twice on one day is still amber', SRS.statusOf(b.words.collect), 'amber');
  eq('only one distinct production day recorded', b.words.collect.productionDays.length, 1);

  SRS.setClock('2026-03-04');
  SRS.answer(b, 'collect', true, SRS.PRODUCTION);
  eq('second distinct day -> green', SRS.statusOf(b.words.collect), 'green');
}

{
  const b = bucket();
  SRS.setClock('2026-03-01');
  SRS.answer(b, 'receipt', true, SRS.PRODUCTION);
  SRS.setClock('2026-03-02');
  SRS.answer(b, 'receipt', true, SRS.PRODUCTION);
  eq('green earned', SRS.statusOf(b.words.receipt), 'green');

  SRS.setClock('2026-03-09');
  SRS.answer(b, 'receipt', false, SRS.PRODUCTION);
  eq('a miss demotes a green word', SRS.statusOf(b.words.receipt), 'red');
  eq('a miss clears the production evidence', b.words.receipt.productionDays.length, 0);
  eq('a miss resets the ladder', b.words.receipt.box, 0);
}

/* --------------------------------------------------------------------------
   Self-marking from a flashcard
   -------------------------------------------------------------------------- */
{
  const b = bucket();
  SRS.setClock('2026-03-01');
  SRS.selfMark(b, 'platform', 'amber');
  eq('self-mark amber -> amber', SRS.statusOf(b.words.platform), 'amber');

  SRS.setClock('2026-03-02');
  SRS.selfMark(b, 'platform', 'amber');
  SRS.setClock('2026-03-03');
  SRS.selfMark(b, 'platform', 'amber');
  eq('self-marking can never reach green', SRS.statusOf(b.words.platform), 'amber');

  SRS.selfMark(b, 'platform', 'red');
  eq('self-mark red -> red', SRS.statusOf(b.words.platform), 'red');
}

/* --------------------------------------------------------------------------
   THE FOUR-WEEK LADDER: 1 -> 3 -> 7 -> 14
   -------------------------------------------------------------------------- */
{
  const b = bucket();
  SRS.setClock('2026-03-01');

  SRS.answer(b, 'delayed', true, SRS.PRODUCTION);
  eq('first win schedules +1 day', b.words.delayed.due, '2026-03-02');

  SRS.setClock('2026-03-02');
  SRS.answer(b, 'delayed', true, SRS.PRODUCTION);
  eq('second win schedules +3 days', b.words.delayed.due, '2026-03-05');

  SRS.setClock('2026-03-05');
  SRS.answer(b, 'delayed', true, SRS.PRODUCTION);
  eq('third win schedules +7 days', b.words.delayed.due, '2026-03-12');

  SRS.setClock('2026-03-12');
  SRS.answer(b, 'delayed', true, SRS.PRODUCTION);
  eq('fourth win schedules +14 days', b.words.delayed.due, '2026-03-26');

  SRS.setClock('2026-03-26');
  SRS.answer(b, 'delayed', true, SRS.PRODUCTION);
  eq('ladder caps at 14 days', b.words.delayed.due, '2026-04-09');

  // Not due before its date, due on it.
  SRS.setClock('2026-04-01');
  ok('not due before the date', !SRS.isDue(b.words.delayed));
  SRS.setClock('2026-04-09');
  ok('due on the date', SRS.isDue(b.words.delayed));
}

/* --------------------------------------------------------------------------
   dueWords ordering: red first, then amber, then green
   -------------------------------------------------------------------------- */
{
  const b = bucket();
  SRS.setClock('2026-03-01');
  SRS.answer(b, 'green1', true, SRS.PRODUCTION);
  SRS.setClock('2026-03-02');
  SRS.answer(b, 'green1', true, SRS.PRODUCTION);
  SRS.answer(b, 'amber1', true, SRS.RECOGNITION);
  SRS.answer(b, 'red1', false, SRS.PRODUCTION);

  SRS.setClock('2026-06-01');   // far future: everything is due
  const order = SRS.dueWords(b, ['green1', 'amber1', 'red1', 'unseen1']);
  ok('worst-first ordering', order.indexOf('red1') < order.indexOf('amber1'), order.join(','));
  ok('amber before green', order.indexOf('amber1') < order.indexOf('green1'), order.join(','));
  ok('unseen words are included', order.indexOf('unseen1') !== -1, order.join(','));
}

/* --------------------------------------------------------------------------
   tally + streak
   -------------------------------------------------------------------------- */
{
  const b = bucket();
  SRS.setClock('2026-03-01');
  SRS.answer(b, 'a', true, SRS.PRODUCTION);
  SRS.setClock('2026-03-02');
  SRS.answer(b, 'a', true, SRS.PRODUCTION);
  SRS.answer(b, 'bb', true, SRS.RECOGNITION);

  const t = SRS.tally(b, ['a', 'bb', 'cc']);
  eq('tally green', t.green, 1);
  eq('tally amber', t.amber, 1);
  eq('tally red (never seen)', t.red, 1);
  eq('tally total', t.total, 3);

  b.sessions = ['2026-02-28', '2026-03-01', '2026-03-02'];
  SRS.setClock('2026-03-02');
  eq('streak counts consecutive days', SRS.streak(b), 3);

  b.sessions = ['2026-02-20', '2026-03-01', '2026-03-02'];
  eq('streak breaks on a gap', SRS.streak(b), 2);

  SRS.setClock('2026-03-20');
  eq('a stale streak is zero', SRS.streak(b), 0);
}

SRS.setClock(null);

/* -------------------------------------------------------------------------- */
if (failures.length) {
  console.error('\n' + failures.length + ' FAILED, ' + passed + ' passed\n');
  failures.forEach(f => console.error('  ✗ ' + f));
  process.exit(1);
}
console.log('All ' + passed + ' assertions passed.');
