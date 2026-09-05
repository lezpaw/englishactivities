/* ===========================================================================
   activities.js — every practice mode.

   Each activity is:
     { id, name, phase, blurb, scope, available(ctx), render(ctx) -> Node }

   scope   'module' = runs inside one module   |   'pack' = runs across the pack
   phase   'understand' | 'retrieve' | 'transfer' | 'reference'
           (the three-phase spine of the source workbook)

   ctx = { pack, module, bucket, save(), onExit(), srs, speech }
   =========================================================================== */

(function () {
  'use strict';

  const { el, clear, shuffle, check, normalise, stem } = window.EA.util;
  const UI = window.EA.UI;
  const SRS = window.EA.SRS;
  const Speech = window.EA.Speech;

  /* ---- shared helpers ---------------------------------------------------- */

  const wordsOf = module => module.words.map(entry => entry.word);

  /** Maps a written answer ("means") back to the tracked word ("mean"). */
  function resolveTrack(module, answer) {
    const target = normalise(answer);
    const list = wordsOf(module);
    const exact = list.find(word => normalise(word) === target);
    if (exact) return exact;
    const byStem = list.find(word => stem(normalise(word)) === stem(target));
    return byStem || target;
  }

  function audioButton(text, chunk) {
    if (!Speech.supported) return null;
    return el('button', {
      class: 'btn btn--ghost btn--icon',
      title: 'Listen',
      'aria-label': 'Listen to ' + text,
      onclick: () => Speech.sayWithChunk(text, chunk)
    }, '🔊');
  }

  /** Renders a sentence containing "___" as text + input boxes. */
  function gapSentence(text, answers, onReady) {
    const parts = String(text).split('___');
    const inputs = [];
    const line = el('p', { class: 'gapline' });

    parts.forEach((chunk, i) => {
      line.appendChild(document.createTextNode(chunk));
      if (i < parts.length - 1) {
        const input = el('input', {
          class: 'gapinput',
          type: 'text',
          autocomplete: 'off',
          autocapitalize: 'off',
          spellcheck: 'false',
          'aria-label': 'Answer ' + (i + 1)
        });
        input.addEventListener('keydown', e => {
          if (e.key === 'Enter') { e.preventDefault(); onReady(); }
        });
        inputs.push(input);
        line.appendChild(input);
      }
    });

    // A sentence may declare fewer answers than blanks only by mistake; guard.
    while (inputs.length > answers.length) answers.push('');
    return { line, inputs };
  }

  function bankChips(bank) {
    return el('div', { class: 'bank' }, [
      el('span', { class: 'bank__label', text: 'WORD BANK' }),
      el('div', { class: 'bank__chips' },
        bank.map(word => el('span', { class: 'bank__chip', text: word })))
    ]);
  }

  /** Three or four options built from sibling words in the same module. */
  function distractors(pool, answer, count) {
    return shuffle(pool.filter(x => x !== answer)).slice(0, count);
  }

  const ACT = {};

  /* =========================================================================
     UNDERSTAND
     ========================================================================= */

  ACT.flashcards = {
    id: 'flashcards',
    name: 'Rescue cards',
    phase: 'understand',
    scope: 'module',
    blurb: 'Meaning, chunk and contrast — then mark the word red or amber.',
    render(ctx) {
      const entries = shuffle(ctx.module.words.slice());
      let index = 0;

      const frame = UI.frame({
        title: 'Rescue cards',
        meta: '',
        onBack: ctx.onExit
      });

      function draw() {
        frame.setProgress(index, entries.length);
        frame.setMeta('Card ' + Math.min(index + 1, entries.length) + ' of ' + entries.length);
        clear(frame.body);

        if (index >= entries.length) {
          const tally = SRS.tally(ctx.bucket, wordsOf(ctx.module));
          frame.setProgress(1, 1);
          frame.body.appendChild(el('div', { class: 'summary' }, [
            el('p', { class: 'summary__note', text: 'Deck finished. Amber words are recognised but not yet produced — the gap-fill and dictation modes are what turn them green.' }),
            el('div', { class: 'tallyrow' }, [
              UI.chip('red', tally.red + ' red'),
              UI.chip('amber', tally.amber + ' amber'),
              UI.chip('green', tally.green + ' green')
            ]),
            el('div', { class: 'row row--end' }, [
              UI.button('Shuffle again', () => { index = 0; draw(); }, 'ghost'),
              UI.button('Done', ctx.onExit, 'primary')
            ])
          ]));
          return;
        }

        const entry = entries[index];
        const rec = SRS.record(ctx.bucket, entry.word);
        const promo = SRS.promotionProgress(rec);

        const back = el('div', { class: 'flash__back', hidden: true }, [
          el('div', { class: 'flash__row' }, [
            el('span', { class: 'flash__label', text: 'MEANING HERE' }),
            el('span', { text: entry.meaning })
          ]),
          el('div', { class: 'flash__row' }, [
            el('span', { class: 'flash__label', text: 'USEFUL CHUNK' }),
            el('span', { class: 'flash__chunk', text: entry.chunk })
          ]),
          entry.contrast ? el('div', { class: 'flash__row' }, [
            el('span', { class: 'flash__label', text: 'CONTRAST' }),
            el('span', { text: entry.word + ' ≠ ' + entry.contrast })
          ]) : null
        ]);

        const marks = el('div', { class: 'row row--end', hidden: true }, [
          UI.button('🔴 I do not understand it', () => mark('red'), 'red'),
          UI.button('🟠 I recognise it', () => mark('amber'), 'amber')
        ]);

        const reveal = UI.button('Show meaning', () => {
          back.hidden = false;
          reveal.hidden = true;
          marks.hidden = false;
        }, 'primary');

        function mark(colour) {
          SRS.selfMark(ctx.bucket, entry.word, colour);
          ctx.save();
          index += 1;
          draw();
        }

        frame.body.appendChild(UI.card([
          el('div', { class: 'flash__front' }, [
            el('h3', { class: 'flash__word', text: entry.word }),
            audioButton(entry.word, entry.chunk)
          ]),
          el('div', { class: 'flash__status' }, [
            UI.chip(SRS.statusOf(rec), SRS.statusOf(rec)),
            el('span', {
              class: 'muted',
              text: 'produced on ' + promo.have + '/' + promo.need + ' different days'
            })
          ]),
          back,
          el('div', { class: 'row row--end' }, [reveal]),
          marks
        ], 'qcard--flash'));
      }

      draw();
      return frame.root;
    }
  };

  ACT.recognise = {
    id: 'recognise',
    name: 'Meaning match',
    phase: 'understand',
    scope: 'module',
    blurb: 'Pick the word that matches the meaning. Recognition only — this cannot make a word green.',
    render(ctx) {
      const pool = wordsOf(ctx.module);
      const items = shuffle(ctx.module.words.slice()).map(entry => ({
        entry,
        options: shuffle([entry.word].concat(distractors(pool, entry.word, 2)))
      }));

      return UI.run(ctx, {
        title: 'Meaning match',
        items,
        note: 'Recognition is the easiest level. A correct guess is evidence, not mastery.',
        renderItem(item, api) {
          api.node.appendChild(UI.prompt(item.entry.meaning));
          const buttons = el('div', { class: 'options' });
          item.options.forEach(option => {
            const button = el('button', {
              class: 'option',
              onclick() {
                const ok = option === item.entry.word;
                buttons.querySelectorAll('.option').forEach(node => {
                  node.disabled = true;
                  if (node.textContent === item.entry.word) node.classList.add('option--right');
                });
                if (!ok) button.classList.add('option--wrong');
                SRS.answer(ctx.bucket, item.entry.word, ok, SRS.RECOGNITION);
                api.resolve(
                  ok,
                  UI.feedback(ok ? 'correct' : 'wrong', item.entry.chunk),
                  ok ? null : { word: item.entry.word, note: item.entry.meaning }
                );
              }
            }, option);
            buttons.appendChild(button);
          });
          api.node.appendChild(buttons);
        }
      });
    }
  };

  /* =========================================================================
     RETRIEVE
     ========================================================================= */

  ACT.gapfill = {
    id: 'gapfill',
    name: 'Complete from memory',
    phase: 'retrieve',
    scope: 'module',
    blurb: 'The workbook gap task, graded live. Counts towards green.',
    render(ctx) {
      let showBank = true;

      const wrap = el('div');

      function build() {
        clear(wrap);
        const items = shuffle(ctx.module.gapfill.slice());

        const toggle = el('label', { class: 'toggle' }, [
          el('input', {
            type: 'checkbox',
            checked: showBank ? true : null,
            onchange(e) { showBank = e.target.checked; build(); }
          }),
          el('span', { text: 'Show word bank' })
        ]);

        const runner = UI.run(ctx, {
          title: 'Complete from memory',
          items,
          note: 'Day 3 of the plan says: do this once WITHOUT the word bank.',
          onRestart() { /* items reshuffled on rebuild only */ },
          renderItem(item, api) {
            const submit = () => grade();
            const { line, inputs } = gapSentence(item.text, item.answers.slice(), submit);
            api.node.appendChild(line);
            if (showBank) api.node.appendChild(bankChips(ctx.module.bank));

            const actions = el('div', { class: 'row row--end' }, [
              UI.button('Check', submit, 'primary')
            ]);
            api.node.appendChild(actions);
            setTimeout(() => inputs[0] && inputs[0].focus(), 30);

            function grade() {
              const results = inputs.map((input, i) => check(input.value, item.answers[i]));
              const allRight = results.every(r => r.verdict === 'correct');

              results.forEach((result, i) => {
                inputs[i].disabled = true;
                inputs[i].classList.add(
                  result.verdict === 'correct' ? 'gapinput--right'
                    : result.verdict === 'wrong' ? 'gapinput--wrong'
                    : 'gapinput--partial'
                );
                if (result.verdict !== 'correct') {
                  inputs[i].value = inputs[i].value
                    ? inputs[i].value + '  →  ' + item.answers[i]
                    : item.answers[i];
                }
                const tracked = resolveTrack(ctx.module, item.answers[i]);
                SRS.answer(ctx.bucket, tracked, result.verdict === 'correct', SRS.PRODUCTION);
              });

              actions.remove();
              const worst = results.find(r => r.verdict !== 'correct');
              api.resolve(
                allRight,
                UI.feedback(worst ? worst.verdict : 'correct', worst ? worst.hint : 'Produced from memory — that counts towards green.'),
                allRight ? null : {
                  word: item.answers.filter((_, i) => results[i].verdict !== 'correct').join(', '),
                  note: 'wrote it wrong in context'
                }
              );
            }
          }
        });

        wrap.appendChild(el('div', { class: 'act__tools' }, toggle));
        wrap.appendChild(runner);
      }

      build();
      return wrap;
    }
  };

  ACT.dictation = {
    id: 'dictation',
    name: 'Listen and write',
    phase: 'retrieve',
    scope: 'module',
    blurb: 'Hear the word, spell it. Listening + spelling — KET marks both.',
    available() { return Speech.supported; },
    render(ctx) {
      const items = shuffle(ctx.module.words.slice());

      return UI.run(ctx, {
        title: 'Listen and write',
        items,
        note: 'Spelling errors cost marks in the real exam. Every miss here is a mark saved there.',
        renderItem(item, api) {
          const input = el('input', {
            class: 'bigin',
            type: 'text',
            autocomplete: 'off',
            autocapitalize: 'off',
            spellcheck: 'false',
            placeholder: 'Type what you hear',
            'aria-label': 'Type the word you hear'
          });
          input.addEventListener('keydown', e => {
            if (e.key === 'Enter') { e.preventDefault(); grade(); }
          });

          api.node.appendChild(el('div', { class: 'listenrow' }, [
            el('button', {
              class: 'btn btn--speak',
              onclick: () => Speech.say(item.word, { rate: 0.8 })
            }, '🔊 Play word'),
            el('button', {
              class: 'btn btn--ghost',
              onclick: () => Speech.say(item.chunk, { rate: 0.85 })
            }, 'Play in a sentence')
          ]));
          api.node.appendChild(input);

          const actions = el('div', { class: 'row row--end' }, [
            UI.button('Check', grade, 'primary')
          ]);
          api.node.appendChild(actions);

          Speech.say(item.word, { rate: 0.8 });
          setTimeout(() => input.focus(), 30);

          function grade() {
            const result = check(input.value, item.word);
            const ok = result.verdict === 'correct';
            input.disabled = true;
            input.classList.add(ok ? 'gapinput--right' : 'gapinput--wrong');
            SRS.answer(ctx.bucket, item.word, ok, SRS.PRODUCTION);
            actions.remove();
            api.node.appendChild(el('p', { class: 'reveal' }, [
              el('strong', { text: item.word }),
              el('span', { class: 'muted', text: ' — ' + item.meaning })
            ]));
            api.resolve(
              ok,
              UI.feedback(result.verdict, ok ? item.chunk : result.hint || ('The word was "' + item.word + '".')),
              ok ? null : { word: item.word, note: 'spelling' }
            );
          }
        }
      });
    }
  };

  ACT.retrieve = {
    id: 'retrieve',
    name: 'Retrieval interview',
    phase: 'retrieve',
    scope: 'module',
    blurb: 'Meaning in, word out. Optional 5-second clock, exactly like the workbook.',
    render(ctx) {
      const wrap = el('div');
      let timed = true;

      function start() {
        clear(wrap);
        const items = shuffle(ctx.module.words.slice());

        const toggle = el('label', { class: 'toggle' }, [
          el('input', {
            type: 'checkbox',
            checked: timed ? true : null,
            onchange(e) { timed = e.target.checked; start(); }
          }),
          el('span', { text: '5-second clock (interview mode)' })
        ]);

        const runner = UI.run(ctx, {
          title: 'Retrieval interview',
          items,
          note: 'Five seconds is the workbook standard: 2 = word + sentence, 1 = word only, 0 = nothing.',
          renderItem(item, api) {
            const input = el('input', {
              class: 'bigin',
              type: 'text',
              autocomplete: 'off',
              autocapitalize: 'off',
              spellcheck: 'false',
              placeholder: 'The word is…',
              'aria-label': 'Type the word'
            });
            input.addEventListener('keydown', e => {
              if (e.key === 'Enter') { e.preventDefault(); grade(false); }
            });

            api.node.appendChild(UI.prompt(item.meaning));
            api.node.appendChild(input);

            const clock = el('div', { class: 'clock' });
            let remaining = 5;
            let ticker = null;

            if (timed) {
              clock.textContent = remaining + 's';
              api.node.appendChild(clock);
              ticker = setInterval(() => {
                remaining -= 1;
                clock.textContent = remaining + 's';
                if (remaining <= 2) clock.classList.add('clock--urgent');
                if (remaining <= 0) grade(true);
              }, 1000);
            }

            const actions = el('div', { class: 'row row--end' }, [
              UI.button('Check', () => grade(false), 'primary')
            ]);
            api.node.appendChild(actions);
            setTimeout(() => input.focus(), 30);

            function grade(expired) {
              if (ticker) { clearInterval(ticker); ticker = null; }
              clock.remove();
              const result = check(input.value, item.word);
              const ok = result.verdict === 'correct' && !expired;
              input.disabled = true;
              input.classList.add(ok ? 'gapinput--right' : 'gapinput--wrong');
              SRS.answer(ctx.bucket, item.word, ok, SRS.PRODUCTION);
              actions.remove();
              api.node.appendChild(el('p', { class: 'reveal' }, [
                el('strong', { text: item.word }),
                el('span', { class: 'muted', text: ' — ' + item.chunk })
              ]));
              api.resolve(
                ok,
                UI.feedback(
                  expired && result.verdict === 'correct' ? 'form' : result.verdict,
                  expired ? 'Time. Recognition without speed is not retrieval yet.' : (result.hint || item.chunk)
                ),
                ok ? null : { word: item.word, note: item.meaning }
              );
            }
          }
        });

        wrap.appendChild(el('div', { class: 'act__tools' }, toggle));
        wrap.appendChild(runner);
      }

      start();
      return wrap;
    }
  };

  /* =========================================================================
     UNDERSTAND — the three case studies from the workbook
     ========================================================================= */

  ACT.polysemy = {
    id: 'polysemy',
    name: 'LEAVE without guessing',
    phase: 'understand',
    scope: 'pack',
    blurb: 'One small verb, six meanings. Choose the sense the sentence activates.',
    available(ctx) { return !!ctx.pack.cases.find(c => c.kind === 'polysemy'); },
    render(ctx) {
      const data = ctx.pack.cases.find(c => c.kind === 'polysemy');
      const items = shuffle(data.items.slice());

      const key = el('div', { class: 'senses' }, data.senses.map(sense =>
        el('div', { class: 'sense' }, [
          el('span', { class: 'sense__code', text: sense.code }),
          el('div', {}, [
            el('strong', { text: sense.label }),
            el('span', { class: 'muted', text: ' — ' + sense.example })
          ])
        ])
      ));

      const runner = UI.run(ctx, {
        title: 'LEAVE without guessing',
        items,
        note: 'One Spanish translation is never enough. The sentence decides.',
        renderItem(item, api) {
          api.node.appendChild(UI.prompt(item.text));
          const buttons = el('div', { class: 'options options--grid' });
          data.senses.forEach(sense => {
            const button = el('button', {
              class: 'option',
              onclick() {
                const ok = sense.code === item.answer;
                const right = data.senses.find(s => s.code === item.answer);
                buttons.querySelectorAll('.option').forEach(n => { n.disabled = true; });
                button.classList.add(ok ? 'option--right' : 'option--wrong');
                SRS.answer(ctx.bucket, 'leave', ok, SRS.RECOGNITION);
                api.resolve(ok, UI.feedback(ok ? 'correct' : 'wrong',
                  right.label + ' — ' + right.pattern), ok ? null : { word: 'leave (' + right.label + ')', note: right.pattern });
              }
            }, [el('span', { class: 'sense__code', text: sense.code }), ' ' + sense.label]);
            buttons.appendChild(button);
          });
          api.node.appendChild(buttons);
        }
      });

      return el('div', {}, [el('div', { class: 'act__tools' }, key), runner]);
    }
  };

  ACT.compound = {
    id: 'compound',
    name: 'Build the meaning',
    phase: 'understand',
    scope: 'pack',
    blurb: 'Split a compound into parts before deciding it is a new word.',
    available(ctx) { return !!ctx.pack.cases.find(c => c.kind === 'compound'); },
    render(ctx) {
      const data = ctx.pack.cases.find(c => c.kind === 'compound');
      const items = shuffle(data.gaps.slice());

      const builds = el('table', { class: 'buildtable' }, [
        el('thead', {}, el('tr', {}, [
          el('th', { text: 'KNOWN PART' }), el('th', { text: '+' }),
          el('th', { text: 'KNOWN PART' }), el('th', { text: 'BUILT MEANING' })
        ])),
        el('tbody', {}, data.builds.map(row => el('tr', {}, [
          el('td', { text: row[0] }), el('td', { text: '+' }),
          el('td', { text: row[1] }), el('td', { class: 'muted', text: row[2] })
        ])))
      ]);

      const runner = UI.run(ctx, {
        title: 'Build the meaning',
        items,
        note: data.explanation,
        renderItem(item, api) {
          const submit = () => grade();
          const { line, inputs } = gapSentence(item.text, item.answers.slice(), submit);
          api.node.appendChild(line);
          api.node.appendChild(bankChips(data.bank));
          const actions = el('div', { class: 'row row--end' }, [UI.button('Check', submit, 'primary')]);
          api.node.appendChild(actions);
          setTimeout(() => inputs[0] && inputs[0].focus(), 30);

          function grade() {
            const result = check(inputs[0].value, item.answers[0]);
            const ok = result.verdict === 'correct';
            inputs[0].disabled = true;
            inputs[0].classList.add(ok ? 'gapinput--right' : 'gapinput--wrong');
            if (!ok) inputs[0].value = item.answers[0];
            actions.remove();
            api.resolve(ok, UI.feedback(result.verdict, result.hint), ok ? null : { word: item.answers[0] });
          }
        }
      });

      return el('div', {}, [el('div', { class: 'act__tools' }, builds), runner]);
    }
  };

  ACT.structure = {
    id: 'structure',
    name: 'Purpose phrases',
    phase: 'understand',
    scope: 'pack',
    blurb: 'noun + for + person + to + verb — the structure behind "magazines for patients to read".',
    available(ctx) { return !!ctx.pack.cases.find(c => c.kind === 'structure'); },
    render(ctx) {
      const data = ctx.pack.cases.find(c => c.kind === 'structure');
      const items = shuffle(data.items.slice());

      return UI.run(ctx, {
        title: 'Purpose phrases',
        items,
        note: data.rule + ' — ' + data.explanation,
        renderItem(item, api) {
          const expected = item.object + ' for ' + item.person + ' to ' + item.purpose;
          api.node.appendChild(el('div', { class: 'buildcue' }, [
            el('span', { class: 'buildcue__part', text: item.object }),
            el('span', { class: 'buildcue__op', text: 'for' }),
            el('span', { class: 'buildcue__part', text: item.person }),
            el('span', { class: 'buildcue__op', text: 'to' }),
            el('span', { class: 'buildcue__part', text: item.purpose })
          ]));
          api.node.appendChild(UI.prompt('Write the complete phrase.'));

          const input = el('input', {
            class: 'bigin', type: 'text', autocomplete: 'off',
            placeholder: expected.split(' ')[0] + '…',
            'aria-label': 'Write the complete phrase'
          });
          input.addEventListener('keydown', e => {
            if (e.key === 'Enter') { e.preventDefault(); grade(); }
          });
          api.node.appendChild(input);
          const actions = el('div', { class: 'row row--end' }, [UI.button('Check', grade, 'primary')]);
          api.node.appendChild(actions);
          setTimeout(() => input.focus(), 30);

          function grade() {
            const ok = normalise(input.value) === normalise(expected);
            input.disabled = true;
            input.classList.add(ok ? 'gapinput--right' : 'gapinput--wrong');
            actions.remove();
            api.node.appendChild(el('p', { class: 'reveal' }, [el('strong', { text: expected })]));
            api.resolve(ok, UI.feedback(ok ? 'correct' : 'wrong',
              ok ? 'That is the pattern.' : 'Keep the order: thing → for → person → to → action.'),
              ok ? null : { word: expected });
          }
        }
      });
    }
  };

  /* =========================================================================
     TRANSFER — exam labs
     ========================================================================= */

  ACT.cloze = {
    id: 'cloze',
    name: 'Reading Part 4 — cloze',
    phase: 'transfer',
    scope: 'pack',
    blurb: 'Six gaps, three checks: meaning, collocation, grammar.',
    render(ctx) {
      const lab = ctx.pack.examLabs.part4;
      const wrap = el('div');
      let textIndex = 0;

      function draw() {
        clear(wrap);
        const text = lab.texts[textIndex];

        const checks = el('div', { class: 'checkrow' }, lab.checks.map(pair =>
          el('div', { class: 'checkrow__item' }, [
            el('strong', { text: pair[0] }),
            el('span', { class: 'muted', text: pair[1] })
          ])
        ));

        const picker = el('div', { class: 'pillrow' }, lab.texts.map((t, i) =>
          el('button', {
            class: 'pill' + (i === textIndex ? ' pill--on' : ''),
            onclick() { textIndex = i; draw(); }
          }, 'Text ' + (i + 1))
        ));

        // Render the passage with inline selects, graded all at once.
        const parts = text.body.split(/\((\d)\)___/);
        const passage = el('p', { class: 'passage' });
        const selects = [];
        parts.forEach((chunk, i) => {
          if (i % 2 === 0) {
            passage.appendChild(document.createTextNode(chunk));
          } else {
            const gapNo = parseInt(chunk, 10) - 1;
            const gap = text.gaps[gapNo];
            const select = el('select', { class: 'gapselect', 'aria-label': 'Gap ' + (gapNo + 1) },
              [el('option', { value: '', text: '(' + (gapNo + 1) + ')' })]
                .concat(shuffle(gap.options.map((opt, oi) => ({ opt, oi })))
                  .map(o => el('option', { value: String(o.oi), text: o.opt })))
            );
            selects.push({ select, gap, index: gapNo });
            passage.appendChild(select);
          }
        });

        const feedbackBox = el('div');
        const actions = el('div', { class: 'row row--end' }, [
          UI.button('Check all six', grade, 'primary')
        ]);

        function grade() {
          let score = 0;
          clear(feedbackBox);
          selects.forEach(entry => {
            const chosen = entry.select.value === '' ? -1 : parseInt(entry.select.value, 10);
            const ok = chosen === entry.gap.answer;
            if (ok) score += 1;
            entry.select.disabled = true;
            entry.select.classList.add(ok ? 'gapselect--right' : 'gapselect--wrong');
            const answerWord = entry.gap.options[entry.gap.answer];
            SRS.answer(ctx.bucket, normalise(answerWord), ok, SRS.RECOGNITION);
            feedbackBox.appendChild(el('div', { class: 'why ' + (ok ? 'why--ok' : 'why--no') }, [
              el('strong', { text: '(' + (entry.index + 1) + ') ' + answerWord }),
              el('span', { text: ' — ' + entry.gap.why })
            ]));
          });
          ctx.save();
          actions.remove();
          const target = score >= 5;
          feedbackBox.insertBefore(
            el('p', { class: 'scoreline' }, [
              el('strong', { text: score + ' / ' + selects.length }),
              el('span', { class: 'muted', text: target ? '  Target met (5/6).' : '  Target is 5/6 — recycle this text.' })
            ]),
            feedbackBox.firstChild
          );
          feedbackBox.appendChild(el('div', { class: 'row row--end' }, [
            UI.button('Try again', draw, 'ghost'),
            textIndex < lab.texts.length - 1
              ? UI.button('Next text', () => { textIndex += 1; draw(); }, 'primary')
              : UI.button('Done', ctx.onExit, 'primary')
          ]));
        }

        const frame = UI.frame({ title: lab.title, meta: text.title, onBack: ctx.onExit });
        frame.setProgress(textIndex + 1, lab.texts.length);
        frame.body.appendChild(picker);
        frame.body.appendChild(checks);
        frame.body.appendChild(UI.card([passage, actions, feedbackBox]));
        wrap.appendChild(frame.root);
      }

      draw();
      return wrap;
    }
  };

  ACT.mainmessage = {
    id: 'mainmessage',
    name: 'Reading Part 1 — main message',
    phase: 'transfer',
    scope: 'pack',
    blurb: 'Six notices. A wrong option repeats a word but changes the message.',
    render(ctx) {
      const lab = ctx.pack.examLabs.part1;
      const items = shuffle(lab.items.slice());

      return UI.run(ctx, {
        title: lab.title,
        items,
        note: lab.brief,
        renderItem(item, api) {
          api.node.appendChild(el('div', { class: 'notice' }, [
            el('span', { class: 'notice__label', text: item.label }),
            el('p', { class: 'notice__text', text: item.text })
          ]));

          const buttons = el('div', { class: 'options options--stack' });
          const order = shuffle(item.options.map((text, i) => ({ text, i })));
          order.forEach(option => {
            const button = el('button', {
              class: 'option option--long',
              onclick() {
                const ok = option.i === item.answer;
                buttons.querySelectorAll('.option').forEach(n => { n.disabled = true; });
                button.classList.add(ok ? 'option--right' : 'option--wrong');

                const why = el('div', { class: 'why why--ok' }, [
                  el('strong', { text: 'Why: ' }), el('span', { text: item.why })
                ]);
                const traps = el('ul', { class: 'traps' },
                  (item.traps || []).map(t => el('li', { class: 'muted', text: t })));

                api.node.appendChild(why);
                api.node.appendChild(el('p', { class: 'traps__label muted', text: 'Why the others fail:' }));
                api.node.appendChild(traps);

                api.resolve(ok, UI.feedback(ok ? 'correct' : 'wrong', ''), ok ? null : { word: item.label, note: 'reread the restriction' });
              }
            }, option.text);
            buttons.appendChild(button);
          });
          api.node.appendChild(buttons);
        }
      });
    }
  };

  /* =========================================================================
     TRANSFER — production lab
     ========================================================================= */

  ACT.writing = {
    id: 'writing',
    name: '55-word message',
    phase: 'transfer',
    scope: 'pack',
    blurb: 'Live word count and a checklist that ticks target words as you use them.',
    render(ctx) {
      const task = ctx.pack.production.writing;
      const saved = ctx.bucket.activities.writing || {};

      const area = el('textarea', {
        class: 'writer',
        rows: '10',
        placeholder: 'Hi Leo, …',
        'aria-label': 'Your message'
      });
      area.value = saved.draft || '';

      const counter = el('span', { class: 'counter' });
      const checklist = el('div', { class: 'checklist' });
      const verdict = el('div', { class: 'writerverdict' });

      function used(word) {
        const text = ' ' + normalise(area.value).replace(/[^a-z' ]/g, ' ') + ' ';
        const target = normalise(word);
        if (text.indexOf(' ' + target + ' ') !== -1) return true;
        // allow inflected forms of single words (leave/left, collect/collected)
        if (target.indexOf(' ') === -1) {
          return text.split(' ').some(token => token && stem(token) === stem(target));
        }
        return false;
      }

      function update() {
        const words = area.value.trim() ? area.value.trim().split(/\s+/).length : 0;
        const low = task.targetWords - task.tolerance;
        const high = task.targetWords + task.tolerance;
        const inRange = words >= low && words <= high;
        counter.textContent = words + ' words (target ' + low + '–' + high + ')';
        counter.className = 'counter ' + (inRange ? 'counter--ok' : 'counter--off');

        clear(checklist);
        let hit = 0;
        task.required.forEach(word => {
          const on = used(word);
          if (on) hit += 1;
          checklist.appendChild(el('span', {
            class: 'tick' + (on ? ' tick--on' : '')
          }, (on ? '✓ ' : '○ ') + word));
        });

        clear(verdict);
        const enough = hit >= task.minRequired;
        verdict.appendChild(el('p', {
          class: enough && inRange ? 'writerverdict--ok' : 'writerverdict--todo',
          text: enough && inRange
            ? 'Ready to hand in: ' + hit + ' target words, length in range.'
            : hit + ' of ' + task.minRequired + ' target words used' + (inRange ? '' : ', and the length is out of range') + '.'
        }));

        ctx.bucket.activities.writing = { draft: area.value, hit, words, at: SRS.today() };
        ctx.save();
      }

      area.addEventListener('input', update);

      const frame = UI.frame({ title: task.title, meta: 'Production lab', onBack: ctx.onExit });
      frame.setProgress(1, 1);
      frame.body.appendChild(UI.card([
        el('div', { class: 'notice' }, [
          el('span', { class: 'notice__label', text: 'SITUATION' }),
          el('p', { class: 'notice__text', text: task.situation })
        ]),
        el('p', { class: 'muted', text: 'Use at least ' + task.minRequired + ' of these:' }),
        checklist,
        area,
        el('div', { class: 'row row--between' }, [counter, el('span')]),
        verdict,
        el('div', { class: 'row row--end' }, [
          UI.button('Clear', () => { area.value = ''; update(); }, 'ghost'),
          UI.button('Done', ctx.onExit, 'primary')
        ])
      ]));

      update();
      return frame.root;
    }
  };

  ACT.speaking = {
    id: 'speaking',
    name: 'One-minute rounds',
    phase: 'transfer',
    scope: 'pack',
    blurb: 'A prompt, sixty seconds, and the words you must land.',
    render(ctx) {
      const prompts = ctx.pack.production.speaking;
      const wrap = el('div');
      let index = 0;

      function draw() {
        clear(wrap);
        const item = prompts[index];
        const frame = UI.frame({
          title: 'One-minute rounds',
          meta: 'Prompt ' + (index + 1) + ' of ' + prompts.length,
          onBack: ctx.onExit
        });
        frame.setProgress(index + 1, prompts.length);

        const ticks = el('div', { class: 'checklist' });
        const state = {};
        item.words.forEach(word => {
          state[word] = false;
          const tick = el('button', {
            class: 'tick tick--btn',
            onclick() {
              state[word] = !state[word];
              tick.className = 'tick tick--btn' + (state[word] ? ' tick--on' : '');
              tick.textContent = (state[word] ? '✓ ' : '○ ') + word;
            }
          }, '○ ' + word);
          ticks.appendChild(tick);
        });

        const clockText = el('div', { class: 'clock clock--big', text: '60s' });
        let left = 60, ticker = null;
        const startBtn = UI.button('Start 60 seconds', () => {
          if (ticker) return;
          ticker = setInterval(() => {
            left -= 1;
            clockText.textContent = left + 's';
            if (left <= 10) clockText.classList.add('clock--urgent');
            if (left <= 0) {
              clearInterval(ticker); ticker = null;
              clockText.textContent = 'Time';
            }
          }, 1000);
        }, 'primary');

        frame.body.appendChild(UI.card([
          UI.prompt(item.prompt),
          el('p', { class: 'muted', text: 'Words to try — tap each one as you use it:' }),
          ticks,
          clockText,
          el('div', { class: 'row row--end' }, [
            startBtn,
            index < prompts.length - 1
              ? UI.button('Next prompt', () => {
                  if (ticker) clearInterval(ticker);
                  index += 1; draw();
                }, 'ghost')
              : UI.button('Done', ctx.onExit, 'ghost')
          ]),
          el('p', { class: 'muted', text: 'Your teacher may interrupt with a follow-up question.' })
        ]));

        wrap.appendChild(frame.root);
      }

      draw();
      return wrap;
    }
  };

  /* =========================================================================
     ENTRY — diagnostic, and the reference topic bank
     ========================================================================= */

  ACT.diagnostic = {
    id: 'diagnostic',
    name: 'Diagnostic',
    phase: 'entry',
    scope: 'pack',
    blurb: 'Recognition, context and retrieval — 28 points that decide where to start.',
    render(ctx) {
      const d = ctx.pack.diagnostic;
      const sections = [
        { key: 'recognition', label: 'Recognition', kind: 'mcq', items: d.recognition, srs: SRS.RECOGNITION },
        { key: 'context',     label: 'Context',     kind: 'mcq', items: d.context,     srs: SRS.RECOGNITION },
        { key: 'production',  label: 'Retrieval',   kind: 'type', items: d.production, srs: SRS.PRODUCTION }
      ];

      const flat = [];
      sections.forEach(section => section.items.forEach(item => flat.push({ section, item })));

      const scores = { recognition: 0, context: 0, production: 0 };
      const missed = [];

      return UI.run(ctx, {
        title: 'Diagnostic',
        items: flat,
        allowRetry: false,
        note: 'Recognition is the easiest level. A correct guess is useful evidence, but it is not mastery.',
        renderItem(entry, api) {
          const { section, item } = entry;
          api.node.appendChild(el('span', { class: 'sectiontag', text: section.label }));

          if (section.kind === 'mcq') {
            api.node.appendChild(UI.prompt(item.q));
            const buttons = el('div', { class: 'options options--stack' });
            const order = shuffle(item.options.map((text, i) => ({ text, i })));
            order.forEach(option => {
              const button = el('button', {
                class: 'option option--long',
                onclick() {
                  const ok = option.i === item.answer;
                  buttons.querySelectorAll('.option').forEach(n => { n.disabled = true; });
                  button.classList.add(ok ? 'option--right' : 'option--wrong');
                  if (ok) scores[section.key] += 1;
                  else missed.push(item.options[item.answer]);
                  const target = section.key === 'recognition' ? item.q : item.options[item.answer];
                  SRS.answer(ctx.bucket, normalise(target), ok, section.srs);
                  api.resolve(ok, UI.feedback(ok ? 'correct' : 'wrong',
                    ok ? '' : 'Answer: ' + item.options[item.answer]),
                    ok ? null : { word: item.options[item.answer] });
                }
              }, option.text);
              buttons.appendChild(button);
            });
            api.node.appendChild(buttons);
          } else {
            api.node.appendChild(UI.prompt(item.meaning));
            const input = el('input', {
              class: 'bigin', type: 'text', autocomplete: 'off', spellcheck: 'false',
              placeholder: 'Write the English word', 'aria-label': 'Write the English word'
            });
            input.addEventListener('keydown', e => {
              if (e.key === 'Enter') { e.preventDefault(); grade(); }
            });
            api.node.appendChild(input);
            const actions = el('div', { class: 'row row--end' }, [UI.button('Check', grade, 'primary')]);
            api.node.appendChild(actions);
            setTimeout(() => input.focus(), 30);

            function grade() {
              const result = check(input.value, item.answer);
              const ok = result.verdict === 'correct';
              input.disabled = true;
              input.classList.add(ok ? 'gapinput--right' : 'gapinput--wrong');
              if (ok) scores.production += 1; else missed.push(item.answer);
              SRS.answer(ctx.bucket, item.answer, ok, SRS.PRODUCTION);
              actions.remove();
              api.node.appendChild(el('p', { class: 'reveal' }, [el('strong', { text: item.answer })]));
              api.resolve(ok, UI.feedback(result.verdict, result.hint), ok ? null : { word: item.answer });
            }
          }

          // Last item: stash the totals so the dashboard can show them.
          if (flat.indexOf(entry) === flat.length - 1) {
            setTimeout(() => {
              ctx.bucket.diagnostic = {
                recognition: scores.recognition, recognitionMax: d.recognition.length,
                context: scores.context, contextMax: d.context.length,
                production: scores.production, productionMax: d.production.length,
                total: scores.recognition + scores.context + scores.production,
                max: flat.length,
                missed,
                at: SRS.today()
              };
              ctx.save();
            }, 0);
          }
        }
      });
    }
  };

  ACT.topicbank = {
    id: 'topicbank',
    name: 'Topic bank triage',
    phase: 'reference',
    scope: 'pack',
    blurb: '200+ A2 words. Tap the ones you do not know — they become your rescue list.',
    render(ctx) {
      ctx.bucket.activities.bank = ctx.bucket.activities.bank || {};
      const marks = ctx.bucket.activities.bank;

      const frame = UI.frame({
        title: 'A2 Key topic bank',
        meta: 'Reference, not the main lesson',
        onBack: ctx.onExit
      });
      frame.setProgress(1, 1);

      const summary = el('p', { class: 'muted' });

      function refresh() {
        const reds = Object.keys(marks).filter(k => marks[k] === 'red');
        summary.textContent = reds.length
          ? reds.length + ' word' + (reds.length === 1 ? '' : 's') + ' marked red — move these into rescue cards and use them in the next lesson.'
          : 'Nothing marked yet. Do not read from the top: scan and tap only what blocks you.';
      }

      const body = el('div', { class: 'bankwrap' });
      Object.keys(ctx.pack.topicBank).forEach(category => {
        const chips = el('div', { class: 'bank__chips' });
        ctx.pack.topicBank[category].forEach(word => {
          const earned = ctx.bucket.words[word] ? SRS.statusOf(ctx.bucket.words[word]) : null;
          const chip = el('button', { class: 'bank__chip bank__chip--btn' }, word);

          function paint() {
            const mark = marks[word];
            const status = mark || (earned === 'green' ? 'green' : null);
            chip.className = 'bank__chip bank__chip--btn' + (status ? ' bank__chip--' + status : '');
          }

          chip.addEventListener('click', () => {
            // red -> amber -> unmarked. Green is never self-assigned: the
            // promotion rule requires produced evidence, not an opinion.
            const current = marks[word];
            if (!current) marks[word] = 'red';
            else if (current === 'red') marks[word] = 'amber';
            else delete marks[word];
            paint();
            refresh();
            ctx.save();
          });

          paint();
          chips.appendChild(chip);
        });

        body.appendChild(el('section', { class: 'bankcat' }, [
          el('h4', { text: category }),
          chips
        ]));
      });

      refresh();
      frame.body.appendChild(el('div', { class: 'act__tools' }, [
        el('p', { class: 'muted', text: 'Tap once = 🔴 I do not know it. Tap twice = 🟠 I recognise it. Tap again to clear. Green is only earned in the retrieval activities.' }),
        summary
      ]));
      frame.body.appendChild(body);
      return frame.root;
    }
  };

  window.EA = window.EA || {};
  window.EA.activities = ACT;
})();
