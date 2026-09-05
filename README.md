# English Activities

Interactive vocabulary practice for exam students. A generic **engine** plus
swappable **content packs** — so a new course is a new data file, not new code.

The first pack is **KET Vocabulary Rescue** (A2 Key for Schools), built from the
Riverflow English six-session intervention workbook.

---

## Run it

No build step, no dependencies, no server required.

```bash
# simplest: just open the file
open index.html

# or serve it (needed if you want it on a phone on the same network)
npx http-server -p 8080
```

To publish it for students: enable **GitHub Pages** on this repository
(Settings → Pages → deploy from branch, root folder). Students then open one
link, type their name, and start. Nothing to install, no account, no login.

---

## What the engine actually does

The workbook already teaches the method. What paper cannot do is *run* it, and
that is the whole point of this app:

### 1. The promotion rule is enforced, not suggested

> "A word becomes green only after the student produces it correctly on **two
> different days**. Seeing the answer and saying 'I knew it' does not count."

So the engine separates two kinds of evidence:

| Evidence | Activities | Best status it can earn |
|---|---|---|
| **Recognition** | Meaning match, multiple choice, self-marked flashcards | 🟠 amber — never green |
| **Production** | Gap-fill, dictation, retrieval interview | 🟢 green, after two *distinct* days |

Two correct answers on the same day count once. A miss clears the evidence and
sends the word back to 🔴 red. Nobody can talk their way to green.

### 2. The four-week retrieval plan is a real scheduler

Correct answers move a word along the workbook's ladder — **1 → 3 → 7 → 14
days** — and the home screen shows only what is actually due today, worst words
first, capped at 15 per session (the workbook's own limit).

### 3. Audio, which the paper version has no way to include

KET tests Listening and penalises spelling. `Listen and write` plays the word
and asks the student to spell it. Uses the browser's built-in speech synthesis:
no API key, no network. If a device has no voice available, the audio
activities hide themselves rather than offering a dead button.

### 4. Feedback that names the mistake

The answer checker distinguishes four outcomes, because "wrong" is useless
advice:

| Student writes | Expected | Verdict |
|---|---|---|
| `platform` | platform | **correct** |
| `serves` | serve | **form** — right word, wrong grammar |
| `recipt` | receipt | **spelling** — KET marks spelling |
| `arrive` | leave | **wrong** |

Only `correct` advances the schedule.

---

## Activities

Grouped by the workbook's own three phases.

**Entry** — Diagnostic (28 points: recognition 12, context 10, retrieval 6)

**1 · Understand**
- Rescue cards — word → meaning, chunk, contrast; self-mark red/amber
- Meaning match — recognition multiple choice
- Purpose phrases — `noun + for + person + to + verb`
- Build the meaning — compounds (black + box, ticket + office)
- LEAVE without guessing — six senses of one verb

**2 · Retrieve**
- Complete from memory — the module gap task, word bank optional
- Listen and write — dictation for spelling and listening
- Retrieval interview — meaning in, word out, with the 5-second clock

**3 · Transfer**
- Reading Part 4 — vocabulary cloze, with the reason for every answer
- Reading Part 1 — main messages, and why each distractor fails
- 55-word message — live word count and a target-word checklist
- One-minute rounds — speaking prompts with a timer

**Reference**
- Topic bank triage — 200+ A2 words; tap what blocks you to build a rescue list

---

## Adding a new course

1. Copy `packs/ket-vocabulary-rescue.js` to `packs/your-course.js`.
2. Replace the content. The shape is documented at the top of the file:
   `diagnostic`, `cases`, `modules[].words / bank / gapfill`, `examLabs`,
   `production`, `topicBank`, `plan`.
3. Add one line to `index.html`:
   ```html
   <script src="packs/your-course.js"></script>
   ```

No engine changes. Activities that a pack does not have data for hide
themselves automatically.

---

## Progress and privacy

Progress lives in the student's own browser (`localStorage`) under one key.
Nothing is uploaded anywhere; there is no server and no account.

- Several students can share one device — each picks their name on the way in.
- **Export progress** on the home screen downloads a JSON backup.
- Progress is per-browser: a student who switches from phone to laptop starts
  a fresh record on the second device.
- A private/incognito window may refuse to store anything. The app detects
  this and says so rather than silently losing the session.

---

## Tests

The scheduling rules are the part a teacher cannot eyeball, so they are pinned
down by tests:

```bash
npm test          # or: node tests/srs.test.js && node tests/checker.test.js
```

- `tests/srs.test.js` — the promotion rule, the 1/3/7/14 ladder, demotion on a
  miss, worst-first ordering, tallies and streaks.
- `tests/checker.test.js` — correct / form / spelling / wrong boundaries.

---

## Project layout

```
index.html                    app shell; lists the engine files and the packs
assets/css/app.css            one stylesheet, light + dark, mobile first
assets/js/util.js             DOM helpers + the answer checker
assets/js/store.js            profiles and progress (localStorage)
assets/js/srs.js              the retrieval engine (promotion rule + schedule)
assets/js/speech.js           text-to-speech wrapper
assets/js/ui.js               shared activity frame and sequence runner
assets/js/activities.js       every practice mode
assets/js/app.js              routing and the dashboard
packs/*.js                    course content
tests/*.test.js               node test scripts, no framework
```

Plain ES5-compatible browser JavaScript. No framework, no bundler, no
node_modules — it will still run in five years.

---

Original Riverflow English material based on the A2 Key for Schools vocabulary
guide and task format. It is not an official Cambridge examination paper.
