/* ===========================================================================
   ui.js — shared chrome for every activity.

   Activities differ in what they ask, not in how they are framed. This file
   owns the frame (title bar, progress, feedback line, summary screen) so an
   activity file only has to render one question at a time.
   =========================================================================== */

(function () {
  'use strict';

  const { el, clear } = window.EA.util;

  const VERDICT_COPY = {
    correct:  { cls: 'is-correct',  label: 'Correct' },
    form:     { cls: 'is-partial',  label: 'Check the form' },
    spelling: { cls: 'is-partial',  label: 'Check the spelling' },
    wrong:    { cls: 'is-wrong',    label: 'Not this one' }
  };

  const UI = {
    /**
     * Builds the standard activity frame.
     * Returns { root, body, setProgress, setMeta }.
     */
    frame(opts) {
      const bar = el('i');
      const track = el('div', { class: 'progress' }, bar);
      const meta = el('span', { class: 'act__meta', text: opts.meta || '' });
      const body = el('div', { class: 'act__body' });

      const root = el('div', { class: 'act' }, [
        el('header', { class: 'act__bar' }, [
          el('button', {
            class: 'btn btn--ghost btn--icon',
            title: 'Back',
            'aria-label': 'Back',
            onclick: opts.onBack
          }, '←'),
          el('div', { class: 'act__head' }, [
            el('h2', { class: 'act__title', text: opts.title }),
            meta
          ])
        ]),
        track,
        body
      ]);

      return {
        root,
        body,
        setProgress(done, total) {
          const pct = total ? Math.round((done / total) * 100) : 0;
          bar.style.width = pct + '%';
        },
        setMeta(text) { meta.textContent = text; }
      };
    },

    /** A single question card. */
    card(children, extraClass) {
      return el('div', { class: 'qcard' + (extraClass ? ' ' + extraClass : '') }, children);
    },

    prompt(text) {
      return el('p', { class: 'qcard__prompt', text });
    },

    /** Feedback line under a question. */
    feedback(verdict, message) {
      const meta = VERDICT_COPY[verdict] || VERDICT_COPY.wrong;
      return el('div', { class: 'feedback ' + meta.cls }, [
        el('strong', { text: meta.label }),
        message ? el('span', { text: ' — ' + message }) : null
      ]);
    },

    button(label, onclick, variant) {
      return el('button', {
        class: 'btn' + (variant ? ' btn--' + variant : ''),
        onclick
      }, label);
    },

    /** Status chip: red / amber / green. */
    chip(status, label) {
      return el('span', { class: 'chip chip--' + status, text: label || status });
    },

    /**
     * End-of-activity screen.
     * @param {object} o {score, total, review:[{word,note}], onRetry, onExit, note}
     */
    summary(o) {
      const pct = o.total ? Math.round((o.score / o.total) * 100) : 0;
      const tone = pct >= 80 ? 'green' : pct >= 50 ? 'amber' : 'red';

      const reviewList = (o.review || []).length
        ? el('div', { class: 'summary__review' }, [
            el('h4', { text: 'Move these into your rescue list' }),
            el('ul', { class: 'wordlist' }, o.review.map(item =>
              el('li', {}, [
                el('strong', { text: item.word }),
                item.note ? el('span', { class: 'muted', text: ' — ' + item.note }) : null
              ])
            ))
          ])
        : el('p', { class: 'summary__clean', text: 'Nothing to rescue from this round. Good session.' });

      return el('div', { class: 'summary' }, [
        el('div', { class: 'summary__score summary__score--' + tone }, [
          el('span', { class: 'summary__num', text: String(o.score) }),
          el('span', { class: 'summary__den', text: '/ ' + o.total })
        ]),
        o.note ? el('p', { class: 'summary__note', text: o.note }) : null,
        reviewList,
        el('div', { class: 'row row--end' }, [
          o.onRetry ? this.button('Try again', o.onRetry, 'ghost') : null,
          this.button('Done', o.onExit, 'primary')
        ])
      ]);
    },

    /**
     * Generic sequence runner: hands each item to renderItem and tracks score.
     * renderItem(item, api) where api = {
     *   resolve(isCorrect, feedbackNode, reviewEntry) — grade + show Next
     *   node — the card element to append content to
     * }
     */
    run(ctx, opts) {
      const items = opts.items || [];
      let index = 0;
      let score = 0;
      const review = [];

      const frame = this.frame({
        title: opts.title,
        meta: opts.meta,
        onBack: ctx.onExit
      });

      const self = this;

      function step() {
        frame.setProgress(index, items.length);
        frame.setMeta(
          index < items.length
            ? 'Question ' + (index + 1) + ' of ' + items.length
            : 'Finished'
        );
        clear(frame.body);

        if (index >= items.length) {
          if (typeof ctx.save === 'function') ctx.save();
          frame.setProgress(1, 1);
          frame.body.appendChild(self.summary({
            score,
            total: items.length,
            review,
            note: opts.note,
            onRetry: opts.allowRetry === false ? null : function () {
              index = 0; score = 0; review.length = 0;
              if (opts.onRestart) opts.onRestart();
              step();
            },
            onExit: ctx.onExit
          }));
          return;
        }

        const item = items[index];
        const card = self.card([]);
        frame.body.appendChild(card);

        let settled = false;
        const api = {
          node: card,
          resolve(isCorrect, feedbackNode, reviewEntry) {
            if (settled) return;
            settled = true;
            if (isCorrect) score += 1;
            if (reviewEntry) review.push(reviewEntry);
            if (feedbackNode) card.appendChild(feedbackNode);
            card.appendChild(el('div', { class: 'row row--end' }, [
              self.button(index === items.length - 1 ? 'See results' : 'Next', function () {
                index += 1;
                step();
              }, 'primary')
            ]));
            if (typeof ctx.save === 'function') ctx.save();
          }
        };

        opts.renderItem(item, api, index);
      }

      step();
      return frame.root;
    }
  };

  window.EA = window.EA || {};
  window.EA.UI = UI;
})();
