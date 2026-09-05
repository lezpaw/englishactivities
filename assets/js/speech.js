/* ===========================================================================
   speech.js — text-to-speech wrapper.

   This is the dimension the paper workbook cannot have: KET tests Listening
   and penalises spelling, so the student needs to hear a word and write it.
   Uses the browser's built-in speechSynthesis (no network, no API key).

   Voice loading is asynchronous and inconsistent across browsers, so the
   whole thing is written to degrade quietly: if no voice is ever available,
   Speech.supported stays false and the UI hides the audio activities rather
   than offering a button that does nothing.
   =========================================================================== */

(function () {
  'use strict';

  const synth = window.speechSynthesis || null;
  let voices = [];
  let chosen = null;

  function pickVoice() {
    if (!synth) return null;
    voices = synth.getVoices() || [];
    if (!voices.length) return null;
    // Prefer a British voice (KET is a Cambridge exam), then any English one.
    const byLang = pattern => voices.find(v => pattern.test(v.lang || ''));
    chosen =
      voices.find(v => /en[-_]GB/i.test(v.lang || '') && /female|kate|serena|libby|sonia/i.test(v.name || '')) ||
      byLang(/en[-_]GB/i) ||
      byLang(/en[-_]AU/i) ||
      byLang(/en/i) ||
      voices[0];
    return chosen;
  }

  if (synth) {
    pickVoice();
    if (typeof synth.onvoiceschanged !== 'undefined') {
      synth.onvoiceschanged = pickVoice;
    }
  }

  const Speech = {
    get supported() {
      return !!synth && typeof synth.speak === 'function';
    },

    get voiceName() {
      return chosen ? chosen.name : '';
    },

    /**
     * @param {string} text
     * @param {object} [opts]  {rate, pitch, onend}
     */
    say(text, opts) {
      if (!this.supported || !text) return false;
      const options = opts || {};
      try {
        synth.cancel();
        const utterance = new SpeechSynthesisUtterance(String(text));
        if (!chosen) pickVoice();
        if (chosen) {
          utterance.voice = chosen;
          utterance.lang = chosen.lang;
        } else {
          utterance.lang = 'en-GB';
        }
        utterance.rate = options.rate == null ? 0.92 : options.rate;
        utterance.pitch = options.pitch == null ? 1 : options.pitch;
        if (typeof options.onend === 'function') utterance.onend = options.onend;
        synth.speak(utterance);
        return true;
      } catch (e) {
        return false;
      }
    },

    /** Says the word, then the example chunk, so the word is heard in context. */
    sayWithChunk(word, chunk) {
      if (!this.supported) return false;
      const text = chunk ? word + '. ' + chunk : word;
      return this.say(text, { rate: 0.88 });
    },

    stop() {
      if (this.supported) {
        try { synth.cancel(); } catch (e) { /* nothing useful to do */ }
      }
    }
  };

  window.EA = window.EA || {};
  window.EA.Speech = Speech;
})();
