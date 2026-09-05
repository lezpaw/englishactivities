/* ===========================================================================
   util.js — DOM helpers and the answer checker.

   The answer checker is deliberately more informative than right/wrong.
   KET penalises spelling, and the workbook keeps saying "change the form when
   necessary", so the student needs to know WHICH kind of mistake they made:

     correct   exact match
     form      right word, wrong grammatical form  (mean / means / meant)
     spelling  one keystroke away                  (recieve / receipt)
     wrong     a different word

   Only "correct" advances the SRS. "form" and "spelling" get a targeted
   nudge and a second look instead of a silent fail.
   =========================================================================== */

(function () {
  'use strict';

  /* ---- tiny DOM helpers ------------------------------------------------- */

  function el(tag, attrs, children) {
    const node = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(key => {
        const value = attrs[key];
        if (value === null || value === undefined || value === false) return;
        if (key === 'class') node.className = value;
        else if (key === 'html') node.innerHTML = value;
        else if (key === 'text') node.textContent = value;
        else if (key.indexOf('on') === 0 && typeof value === 'function') {
          node.addEventListener(key.slice(2).toLowerCase(), value);
        } else if (key === 'dataset') {
          Object.keys(value).forEach(d => { node.dataset[d] = value[d]; });
        } else {
          node.setAttribute(key, value === true ? '' : value);
        }
      });
    }
    (Array.isArray(children) ? children : children ? [children] : [])
      .forEach(child => {
        if (child === null || child === undefined || child === false) return;
        node.appendChild(typeof child === 'string' ? document.createTextNode(child) : child);
      });
    return node;
  }

  function clear(node) {
    while (node.firstChild) node.removeChild(node.firstChild);
    return node;
  }

  function shuffle(list) {
    const out = list.slice();
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = out[i]; out[i] = out[j]; out[j] = tmp;
    }
    return out;
  }

  function escapeHTML(str) {
    return String(str).replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
  }

  /* ---- answer checking --------------------------------------------------- */

  function normalise(str) {
    return String(str == null ? '' : str)
      .toLowerCase()
      .replace(/[‘’]/g, "'")   // curly apostrophes from the .docx
      .replace(/[“”]/g, '"')
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/[.,!?;:]+$/g, '')
      .trim();
  }

  // Crude but sufficient stemmer for A2 vocabulary: we only need to know
  // whether two strings are plausibly the same lexical item.
  function stem(word) {
    let s = word;
    if (s.length > 4 && /ies$/.test(s)) s = s.slice(0, -3) + 'y';
    else if (s.length > 4 && /(ses|xes|zes|ches|shes)$/.test(s)) s = s.slice(0, -2);
    else if (s.length > 3 && /s$/.test(s) && !/(ss|us|is)$/.test(s)) s = s.slice(0, -1);

    if (s.length > 4 && /ing$/.test(s)) s = s.slice(0, -3);
    else if (s.length > 3 && /ed$/.test(s)) s = s.slice(0, -2);

    if (s.length > 3 && /([bdfglmnprt])\1$/.test(s)) s = s.slice(0, -1);  // stopp -> stop
    if (s.length > 3 && /e$/.test(s)) s = s.slice(0, -1);                 // serve -> serv
    return s;
  }

  /**
   * The regular inflections of a base form. Used to separate "you wrote the
   * right word in the wrong grammatical form" (serve / serves) from "you
   * wrote the right word and misspelled it" (cancelled / canceled) — two
   * mistakes that need completely different advice.
   */
  function inflectionsOf(base) {
    const out = new Set();
    const b = base;
    if (!b || b.length < 2) return out;

    const add = x => { if (x && x !== b) out.add(x); };

    if (/[^aeiou]y$/.test(b)) {
      const trunk = b.slice(0, -1);
      add(trunk + 'ies'); add(trunk + 'ied'); add(b + 'ing');
    } else if (/e$/.test(b)) {
      const trunk = b.slice(0, -1);
      add(b + 's'); add(b + 'd'); add(trunk + 'ing');
    } else {
      add(b + 's');
      if (/(s|x|z|ch|sh)$/.test(b)) add(b + 'es');
      add(b + 'ed'); add(b + 'ing');
      // one-syllable consonant doubling: stop -> stopped / stopping
      const last = b.slice(-1);
      if (/[bdfglmnprt]/.test(last) && /[aeiou]/.test(b.slice(-2, -1))) {
        add(b + last + 'ed'); add(b + last + 'ing');
      }
    }
    return out;
  }

  function isFormOf(a, b) {
    return inflectionsOf(a).has(b) || inflectionsOf(b).has(a);
  }

  function levenshtein(a, b) {
    if (a === b) return 0;
    if (!a.length) return b.length;
    if (!b.length) return a.length;
    let prev = new Array(b.length + 1);
    for (let j = 0; j <= b.length; j++) prev[j] = j;
    for (let i = 1; i <= a.length; i++) {
      const curr = [i];
      for (let j = 1; j <= b.length; j++) {
        curr[j] = Math.min(
          prev[j] + 1,
          curr[j - 1] + 1,
          prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
        );
      }
      prev = curr;
    }
    return prev[b.length];
  }

  /**
   * @param  {string} given     what the student typed
   * @param  {string|string[]} expected  accepted answer(s)
   * @return {{verdict:string, expected:string, hint:string}}
   */
  function check(given, expected) {
    const answers = (Array.isArray(expected) ? expected : [expected]).map(normalise);
    const g = normalise(given);
    const primary = Array.isArray(expected) ? expected[0] : expected;

    if (!g) return { verdict: 'wrong', expected: primary, hint: 'Write something — a guess is evidence too.' };

    for (const a of answers) {
      if (g === a) return { verdict: 'correct', expected: primary, hint: '' };
    }
    // A real inflection of the target is a GRAMMAR mistake, not a typo.
    for (const a of answers) {
      if (isFormOf(g, a)) {
        return {
          verdict: 'form',
          expected: primary,
          hint: 'Right word, wrong form. Does the grammar of the sentence fit?'
        };
      }
    }
    // Otherwise a near miss is a spelling slip — including variants like
    // canceled / cancelled, where the form is fine and only the letters differ.
    for (const a of answers) {
      if (levenshtein(g, a) <= (a.length > 6 ? 2 : 1)) {
        return {
          verdict: 'spelling',
          expected: primary,
          hint: 'Almost — check the spelling. KET marks spelling.'
        };
      }
    }
    for (const a of answers) {
      if (stem(g) === stem(a)) {
        return {
          verdict: 'form',
          expected: primary,
          hint: 'Right word, wrong form. Does the grammar of the sentence fit?'
        };
      }
    }
    return { verdict: 'wrong', expected: primary, hint: '' };
  }

  window.EA = window.EA || {};
  window.EA.util = { el, clear, shuffle, escapeHTML, normalise, stem, inflectionsOf, isFormOf, check, levenshtein };
})();
