/* ===========================================================================
   app.js — shell, routing and the dashboard.

   Screens: profile gate -> pack home -> module -> activity.
   Everything is rendered imperatively into #app; there is no build step and
   no framework, so the whole thing runs from a file:// path or GitHub Pages.
   =========================================================================== */

(function () {
  'use strict';

  const { el, clear, shuffle } = window.EA.util;
  const UI = window.EA.UI;
  const SRS = window.EA.SRS;
  const Store = window.EA.Store;
  const Speech = window.EA.Speech;
  const ACT = window.EA.activities;

  const root = document.getElementById('app');
  const pack = (window.EA.packs || [])[0];

  let view = { screen: 'home', moduleId: null, activityId: null, synthetic: null };

  /* ---- derived data ------------------------------------------------------ */

  const allWords = () => pack.modules.reduce((acc, m) => acc.concat(m.words.map(w => w.word)), []);

  /**
   * The words the plan says to see today, wrapped as a synthetic module so
   * the ordinary module activities can run over them unchanged.
   */
  function buildDueModule(bucket) {
    const entries = [];
    const seen = {};
    pack.modules.forEach(module => {
      module.words.forEach(entry => {
        if (seen[entry.word]) return;
        if (SRS.isDue(bucket.words[entry.word])) {
          seen[entry.word] = true;
          entries.push(entry);
        }
      });
    });

    const rank = { red: 0, amber: 1, green: 2 };
    entries.sort((a, b) => {
      const sa = SRS.statusOf(bucket.words[a.word] || {});
      const sb = SRS.statusOf(bucket.words[b.word] || {});
      return rank[sa] - rank[sb];
    });

    const capped = entries.slice(0, 15);   // the workbook caps a session at 12-15
    const keys = capped.map(e => e.word);

    // Pull in any gap sentence that practises one of today's words.
    const gapfill = [];
    pack.modules.forEach(module => {
      module.gapfill.forEach(item => {
        if (item.answers.some(a => keys.some(k => window.EA.util.stem(window.EA.util.normalise(k)) === window.EA.util.stem(window.EA.util.normalise(a))))) {
          gapfill.push(item);
        }
      });
    });

    return {
      id: 'due',
      n: 0,
      title: 'Today’s rescue',
      why: 'These are the words the four-week plan schedules for today, worst first.',
      words: capped,
      bank: shuffle(keys),
      gapfill: shuffle(gapfill).slice(0, 8)
    };
  }

  /* ---- chrome ------------------------------------------------------------ */

  function header() {
    const profile = Store.activeProfile();
    return el('header', { class: 'top' }, [
      el('div', { class: 'top__brand' }, [
        el('span', { class: 'top__mark', text: 'EA' }),
        el('div', {}, [
          el('h1', { class: 'top__title', text: pack.title }),
          el('p', { class: 'top__tag', text: pack.tagline })
        ])
      ]),
      el('div', { class: 'top__user' }, [
        el('span', { class: 'top__name', text: profile ? profile.name : '' }),
        UI.button('Switch', () => { Store.signOut(); render(); }, 'ghost')
      ])
    ]);
  }

  /* ---- screens ----------------------------------------------------------- */

  function profileGate() {
    const profiles = Store.profiles();
    const input = el('input', {
      class: 'bigin',
      type: 'text',
      placeholder: 'Your name',
      'aria-label': 'Your name',
      maxlength: '40'
    });
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter') { e.preventDefault(); add(); }
    });

    function add() {
      if (Store.addProfile(input.value)) render();
    }

    const existing = profiles.length
      ? el('div', { class: 'gate__list' }, [
          el('p', { class: 'muted', text: 'Continue as' }),
          el('div', { class: 'pillrow' }, profiles.map(p =>
            el('button', {
              class: 'pill pill--big',
              onclick() { Store.setActive(p.id); render(); }
            }, p.name)
          ))
        ])
      : null;

    const warn = Store.storageAvailable() ? null : el('p', { class: 'warn' },
      'This browser is blocking saved data (private window?). You can still practise, but progress will not be kept.');

    return el('div', { class: 'gate' }, [
      el('div', { class: 'gate__card' }, [
        el('h2', { text: pack.title }),
        el('p', { class: 'muted', text: pack.blurb }),
        warn,
        existing,
        el('p', { class: 'muted', text: profiles.length ? 'Or add a new student' : 'Who is practising?' }),
        el('div', { class: 'row' }, [input, UI.button('Start', add, 'primary')]),
        el('p', { class: 'gate__foot muted', text: 'Progress is stored in this browser only. Nothing is uploaded.' })
      ])
    ]);
  }

  function statusBar(tally) {
    const total = Math.max(tally.total, 1);
    const seg = (status, count) => count
      ? el('i', { class: 'bar__seg bar__seg--' + status, style: 'width:' + ((count / total) * 100) + '%' })
      : null;
    return el('div', { class: 'bar' }, [
      seg('green', tally.green), seg('amber', tally.amber), seg('red', tally.red)
    ]);
  }

  function home() {
    const bucket = Store.progress(pack.id);
    Store.touchSession(pack.id);

    const words = allWords();
    const tally = SRS.tally(bucket, words);
    const streak = SRS.streak(bucket);
    const due = buildDueModule(bucket);

    /* --- today's session ------------------------------------------------- */
    const todayCard = el('section', { class: 'panel panel--hero' }, [
      el('div', { class: 'panel__head' }, [
        el('h3', { text: 'Today’s rescue' }),
        el('span', { class: 'muted', text: due.words.length + ' word' + (due.words.length === 1 ? '' : 's') + ' scheduled' })
      ]),
      due.words.length
        ? el('div', {}, [
            el('div', { class: 'bank__chips bank__chips--tight' },
              due.words.slice(0, 12).map(entry => {
                const status = SRS.statusOf(bucket.words[entry.word] || {});
                return el('span', { class: 'bank__chip bank__chip--' + status, text: entry.word });
              })),
            el('div', { class: 'row row--wrap' }, [
              UI.button('Retrieval interview', () => open('retrieve', due), 'primary'),
              Speech.supported ? UI.button('Listen and write', () => open('dictation', due), 'ghost') : null,
              due.gapfill.length ? UI.button('Mixed gap task', () => open('gapfill', due), 'ghost') : null,
              UI.button('Rescue cards', () => open('flashcards', due), 'ghost')
            ])
          ])
        : el('p', { class: 'muted', text: 'Nothing is due today. Come back tomorrow, or open a module below to learn new words.' })
    ]);

    /* --- progress -------------------------------------------------------- */
    const diagnostic = bucket.diagnostic;
    const progressCard = el('section', { class: 'panel' }, [
      el('div', { class: 'panel__head' }, [
        el('h3', { text: 'Progress' }),
        streak ? el('span', { class: 'streak', text: '🔥 ' + streak + '-day streak' }) : null
      ]),
      statusBar(tally),
      el('div', { class: 'tallyrow' }, [
        UI.chip('red', tally.red + ' red'),
        UI.chip('amber', tally.amber + ' amber'),
        UI.chip('green', tally.green + ' green'),
        el('span', { class: 'muted', text: 'of ' + tally.total + ' tracked words' })
      ]),
      el('p', { class: 'rule muted' },
        'Promotion rule: a word turns green only after you produce it correctly on two different days.'),
      diagnostic
        ? el('p', { class: 'muted' }, 'Diagnostic: ' + diagnostic.total + '/' + diagnostic.max +
            ' (recognition ' + diagnostic.recognition + '/' + diagnostic.recognitionMax +
            ', context ' + diagnostic.context + '/' + diagnostic.contextMax +
            ', retrieval ' + diagnostic.production + '/' + diagnostic.productionMax + ')')
        : el('div', { class: 'row' }, [
            el('p', { class: 'muted', text: 'No diagnostic yet — 28 points that decide where to start.' }),
            UI.button('Take the diagnostic', () => open('diagnostic'), 'ghost')
          ])
    ]);

    /* --- modules --------------------------------------------------------- */
    const moduleGrid = el('div', { class: 'grid' }, pack.modules.map(module => {
      const moduleTally = SRS.tally(bucket, module.words.map(w => w.word));
      return el('button', {
        class: 'tile',
        onclick() { view = { screen: 'module', moduleId: module.id }; render(); }
      }, [
        el('span', { class: 'tile__n', text: String(module.n) }),
        el('span', { class: 'tile__title', text: module.title }),
        statusBar(moduleTally),
        el('span', { class: 'tile__meta', text: moduleTally.green + '/' + moduleTally.total + ' green' })
      ]);
    }));

    /* --- pack-level activities ------------------------------------------- */
    function packSection(title, phase, note) {
      const list = Object.keys(ACT)
        .map(key => ACT[key])
        .filter(a => a.scope === 'pack' && a.phase === phase)
        .filter(a => !a.available || a.available({ pack }));
      if (!list.length) return null;
      return el('section', { class: 'panel' }, [
        el('div', { class: 'panel__head' }, [el('h3', { text: title })]),
        note ? el('p', { class: 'muted', text: note }) : null,
        el('div', { class: 'grid grid--acts' }, list.map(activity =>
          el('button', {
            class: 'tile tile--act',
            onclick() { open(activity.id); }
          }, [
            el('span', { class: 'tile__title', text: activity.name }),
            el('span', { class: 'tile__meta', text: activity.blurb })
          ])
        ))
      ]);
    }

    return el('div', { class: 'page' }, [
      header(),
      todayCard,
      progressCard,
      el('section', { class: 'panel' }, [
        el('div', { class: 'panel__head' }, [
          el('h3', { text: 'Modules' }),
          el('span', { class: 'muted', text: '1 UNDERSTAND · 2 RETRIEVE · 3 TRANSFER' })
        ]),
        moduleGrid
      ]),
      packSection('How vocabulary works', 'understand', 'The three case studies: purpose phrases, compounds, and the many meanings of LEAVE.'),
      packSection('Exam transfer', 'transfer', 'Target: 5/6 on each task before returning to the programme.'),
      packSection('Reference', 'reference'),
      el('footer', { class: 'foot' }, [
        el('p', { class: 'muted', text: pack.footer }),
        el('div', { class: 'row row--wrap' }, [
          UI.button('Export progress', exportProgress, 'ghost'),
          UI.button('Reset this pack', () => {
            if (confirm('Delete all progress for this student on this pack?')) {
              Store.resetPack(pack.id); render();
            }
          }, 'ghost')
        ])
      ])
    ]);
  }

  function moduleScreen() {
    const module = pack.modules.find(m => m.id === view.moduleId);
    if (!module) { view = { screen: 'home' }; return home(); }

    const bucket = Store.progress(pack.id);
    const tally = SRS.tally(bucket, module.words.map(w => w.word));

    const table = el('table', { class: 'wordtable' }, [
      el('thead', {}, el('tr', {}, [
        el('th', { text: 'WORD' }), el('th', { text: 'SIMPLE MEANING' }),
        el('th', { text: 'USE IT LIKE THIS' }), el('th', { text: '' })
      ])),
      el('tbody', {}, module.words.map(entry => {
        const status = SRS.statusOf(bucket.words[entry.word] || {});
        return el('tr', {}, [
          el('td', {}, [
            el('strong', { text: entry.word }),
            entry.contrast ? el('span', { class: 'muted', text: ' ≠ ' + entry.contrast }) : null
          ]),
          el('td', { class: 'muted', text: entry.meaning }),
          el('td', { class: 'chunk', text: entry.chunk }),
          el('td', {}, [UI.chip(status, ''), audio(entry)])
        ]);
      }))
    ]);

    function audio(entry) {
      if (!Speech.supported) return null;
      return el('button', {
        class: 'btn btn--ghost btn--icon',
        title: 'Listen',
        'aria-label': 'Listen to ' + entry.word,
        onclick: () => Speech.sayWithChunk(entry.word, entry.chunk)
      }, '🔊');
    }

    const activities = Object.keys(ACT)
      .map(key => ACT[key])
      .filter(a => a.scope === 'module')
      .filter(a => !a.available || a.available({ pack, module }));

    return el('div', { class: 'page' }, [
      header(),
      el('div', { class: 'crumb' }, [
        UI.button('← All modules', () => { view = { screen: 'home' }; render(); }, 'ghost')
      ]),
      el('section', { class: 'panel' }, [
        el('div', { class: 'panel__head' }, [
          el('h3', { text: 'Module ' + module.n + ' — ' + module.title }),
          el('span', { class: 'muted', text: tally.green + '/' + tally.total + ' green' })
        ]),
        el('p', { class: 'why', text: module.why }),
        statusBar(tally),
        el('div', { class: 'grid grid--acts' }, activities.map(activity =>
          el('button', {
            class: 'tile tile--act tile--' + activity.phase,
            onclick() { open(activity.id, module); }
          }, [
            el('span', { class: 'tile__phase', text: activity.phase }),
            el('span', { class: 'tile__title', text: activity.name }),
            el('span', { class: 'tile__meta', text: activity.blurb })
          ])
        ))
      ]),
      el('section', { class: 'panel' }, [
        el('div', { class: 'panel__head' }, [el('h3', { text: 'The words' })]),
        el('div', { class: 'tablewrap' }, table),
        el('p', { class: 'rule muted', text: 'Cover the first column. Read the meaning and example. Say the missing word. Then cover the example and build a new one.' })
      ])
    ]);
  }

  function activityScreen() {
    const activity = ACT[view.activityId];
    const module = view.synthetic || pack.modules.find(m => m.id === view.moduleId) || null;
    const bucket = Store.progress(pack.id);

    const ctx = {
      pack,
      module,
      bucket,
      srs: SRS,
      speech: Speech,
      save() { Store.save(); },
      onExit() {
        Speech.stop();
        view = view.moduleId && !view.synthetic
          ? { screen: 'module', moduleId: view.moduleId }
          : { screen: 'home' };
        render();
      }
    };

    let node;
    try {
      node = activity.render(ctx);
    } catch (err) {
      node = el('div', { class: 'panel' }, [
        el('h3', { text: 'This activity could not start' }),
        el('p', { class: 'muted', text: String(err && err.message ? err.message : err) }),
        el('div', { class: 'row row--end' }, [UI.button('Back', ctx.onExit, 'primary')])
      ]);
    }

    return el('div', { class: 'page' }, [header(), node]);
  }

  /* ---- actions ----------------------------------------------------------- */

  function open(activityId, module) {
    const activity = ACT[activityId];
    if (!activity) return;
    view = {
      screen: 'activity',
      activityId,
      moduleId: module ? module.id : null,
      synthetic: module && module.id === 'due' ? module : null
    };
    render();
  }

  function exportProgress() {
    try {
      const blob = new Blob([Store.exportJSON()], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = el('a', {
        href: url,
        download: 'englishactivities-progress-' + SRS.today() + '.json'
      });
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (e) {
      alert('Could not export here. Copy this instead:\n\n' + Store.exportJSON().slice(0, 2000));
    }
  }

  /* ---- render ------------------------------------------------------------ */

  function render() {
    clear(root);
    if (!pack) {
      root.appendChild(el('div', { class: 'gate' }, el('div', { class: 'gate__card' }, [
        el('h2', { text: 'No pack loaded' }),
        el('p', { class: 'muted', text: 'Add a pack file in /packs and include it with a <script> tag in index.html.' })
      ])));
      return;
    }
    if (!Store.activeProfile()) { root.appendChild(profileGate()); return; }

    let screen;
    if (view.screen === 'module') screen = moduleScreen();
    else if (view.screen === 'activity') screen = activityScreen();
    else screen = home();

    root.appendChild(screen);
    window.scrollTo(0, 0);
  }

  render();
})();
