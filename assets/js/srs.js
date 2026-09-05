/* ===========================================================================
   srs.js — the retrieval engine.

   This is the part the paper workbook can only *describe*. It enforces two
   rules that are stated in the source document:

   1. THE PROMOTION RULE
      "A word becomes green only after the student PRODUCES it correctly on
       two different days. Seeing the answer and saying 'I knew it' does not
       count."
      -> Recognition-type wins (multiple choice, self-marked flashcards) can
         raise a word to AMBER but never to GREEN. Only production-type wins
         (typing the word from memory: gap-fill, dictation, meaning->word)
         count towards green, and they must land on two distinct calendar days.

   2. THE FOUR-WEEK RETRIEVAL PLAN
      Day 1 -> 3 -> 7 -> 14. A correct answer advances the word one step; a
      wrong answer sends it back to the start of the ladder.
   =========================================================================== */

(function () {
  'use strict';

  const INTERVALS = [1, 3, 7, 14];      // days, straight from the workbook
  const GREEN_DAYS_REQUIRED = 2;        // "two different days"

  const RECOGNITION = 'recognition';    // MCQ, self-marked flashcard
  const PRODUCTION = 'production';      // typed from memory

  // Overridable so tests (and a classroom demo of the 14-day plan) can
  // travel in time without waiting two weeks. Set SRS.setClock('2026-03-01').
  let clockOverride = null;

  function today() {
    return clockOverride || new Date().toISOString().slice(0, 10);
  }

  function addDays(isoDate, days) {
    const d = new Date(isoDate + 'T00:00:00');
    d.setDate(d.getDate() + days);
    return d.toISOString().slice(0, 10);
  }

  function blankRecord() {
    return {
      status: 'red',
      box: 0,                 // index into INTERVALS
      due: today(),
      productionDays: [],     // distinct ISO dates with a correct production answer
      seen: 0,
      correct: 0,
      wrong: 0,
      lastSeen: null,
      lastResult: null
    };
  }

  const SRS = {
    INTERVALS,
    RECOGNITION,
    PRODUCTION,

    today,

    /** @param {string|null} isoDate  null restores the real clock. */
    setClock(isoDate) { clockOverride = isoDate; },

    record(bucket, word) {
      if (!bucket.words[word]) bucket.words[word] = blankRecord();
      const rec = bucket.words[word];
      // Migrate any older/partial record shape without losing history.
      if (!Array.isArray(rec.productionDays)) rec.productionDays = [];
      if (typeof rec.box !== 'number') rec.box = 0;
      if (!rec.due) rec.due = today();
      return rec;
    },

    /**
     * Register one answer.
     * @param {object} bucket  progress bucket from Store.progress()
     * @param {string} word    the target word
     * @param {boolean} ok     was the answer correct
     * @param {string} kind    SRS.RECOGNITION or SRS.PRODUCTION
     */
    answer(bucket, word, ok, kind) {
      const rec = this.record(bucket, word);
      const day = today();

      rec.seen += 1;
      rec.lastSeen = day;
      rec.lastResult = ok ? 'correct' : 'wrong';

      if (ok) {
        rec.correct += 1;
        if (kind === PRODUCTION && rec.productionDays.indexOf(day) === -1) {
          rec.productionDays.push(day);
        }
        // Schedule with the CURRENT rung, then step up: the first win is
        // reviewed tomorrow (+1), not in three days.
        rec.due = addDays(day, INTERVALS[rec.box]);
        rec.box = Math.min(rec.box + 1, INTERVALS.length - 1);
      } else {
        rec.wrong += 1;
        // A miss drops the word back to the bottom of the ladder and, if it
        // had been promoted, back down to amber. Green is never free.
        rec.box = 0;
        rec.due = day;
        rec.productionDays = [];
      }

      rec.status = this.statusOf(rec);
      return rec;
    },

    /**
     * Marks a word straight from a flashcard self-assessment.
     * 'red' and 'amber' are honest self-reports and are respected as-is.
     * 'green' is NOT accepted here — the promotion rule requires produced
     * evidence, so a student calling a word green only gets amber.
     */
    selfMark(bucket, word, colour) {
      const rec = this.record(bucket, word);
      const day = today();
      rec.seen += 1;
      rec.lastSeen = day;

      if (colour === 'red') {
        rec.box = 0;
        rec.due = day;
        rec.productionDays = [];
        rec.lastResult = 'wrong';
      } else {
        // "I recognise it" — schedule it, but it stays amber until produced.
        rec.due = addDays(day, INTERVALS[rec.box]);
        rec.box = Math.min(rec.box + 1, INTERVALS.length - 1);
        rec.lastResult = 'correct';
        rec.correct += 1;
      }

      rec.status = this.statusOf(rec);
      return rec;
    },

    // Tolerates a missing or partial record: callers routinely pass
    // bucket.words[word] for a word that has never been studied.
    statusOf(rec) {
      if (!rec || !rec.seen) return 'red';
      const produced = Array.isArray(rec.productionDays) ? rec.productionDays.length : 0;
      if (produced >= GREEN_DAYS_REQUIRED) return 'green';
      // A miss always drops the word back to red, however good its history —
      // otherwise a word that has started failing keeps flattering the tally.
      if (rec.lastResult === 'wrong') return 'red';
      if (rec.correct > 0) return 'amber';
      return 'red';
    },

    /** How far a word is through the promotion rule, for the UI. */
    promotionProgress(rec) {
      const have = rec && Array.isArray(rec.productionDays) ? rec.productionDays.length : 0;
      return { have: Math.min(have, GREEN_DAYS_REQUIRED), need: GREEN_DAYS_REQUIRED };
    },

    isDue(rec) {
      if (!rec || rec.seen === 0) return true;      // never studied = due now
      if (rec.status === 'green') return rec.due <= today();
      return rec.due <= today();
    },

    /**
     * The words the student should see today, worst-first:
     * red before amber before green, and older due dates first.
     */
    dueWords(bucket, words) {
      const rank = { red: 0, amber: 1, green: 2 };
      return words
        .filter(word => this.isDue(bucket.words[word]))
        .sort((a, b) => {
          const ra = bucket.words[a], rb = bucket.words[b];
          const sa = ra ? this.statusOf(ra) : 'red';
          const sb = rb ? this.statusOf(rb) : 'red';
          if (rank[sa] !== rank[sb]) return rank[sa] - rank[sb];
          const da = ra && ra.due ? ra.due : '0000-00-00';
          const db = rb && rb.due ? rb.due : '0000-00-00';
          return da < db ? -1 : da > db ? 1 : 0;
        });
    },

    /** Counts for the dashboard rings. */
    tally(bucket, words) {
      const out = { red: 0, amber: 0, green: 0, due: 0, total: words.length };
      words.forEach(word => {
        const rec = bucket.words[word];
        const status = rec ? this.statusOf(rec) : 'red';
        out[status] += 1;
        if (this.isDue(rec)) out.due += 1;
      });
      return out;
    },

    /** Consecutive-day streak, from the recorded session dates. */
    streak(bucket) {
      const days = (bucket.sessions || []).slice().sort();
      if (!days.length) return 0;
      let streak = 1;
      for (let i = days.length - 1; i > 0; i--) {
        if (addDays(days[i - 1], 1) === days[i]) streak += 1;
        else break;
      }
      // A streak only counts if it reaches today or yesterday.
      const last = days[days.length - 1];
      const t = today();
      if (last !== t && addDays(last, 1) !== t) return 0;
      return streak;
    }
  };

  window.EA = window.EA || {};
  window.EA.SRS = SRS;
})();
