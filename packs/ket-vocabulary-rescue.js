/* ===========================================================================
   PACK: KET Vocabulary Rescue
   Source: "Fabrizio_KET_Vocabulary_Rescue_Student.docx" (Riverflow English)
   Original Riverflow English material based on the A2 Key for Schools
   vocabulary guide and task format. Not an official Cambridge paper.

   This file is CONTENT ONLY. The engine in /assets/js is generic:
   to add another course, copy this shape into a new pack file and add a
   <script> tag for it in index.html. No engine changes required.
   =========================================================================== */

(function () {
  'use strict';

  // ---- helper so the word tables stay readable -----------------------------
  const w = (word, meaning, chunk, contrast) => ({ word, meaning, chunk, contrast });

  const PACK = {
    id: 'ket-vocabulary-rescue',
    title: 'KET Vocabulary Rescue',
    tagline: 'Understand It. Retrieve It. Use It.',
    level: 'A2 Key for Schools',
    blurb: 'A six-session intervention: 120+ high-value words and chunks for notices, short texts, listening and speaking.',
    source: 'Riverflow English',

    /* -----------------------------------------------------------------------
       0. DIAGNOSTIC — find the real starting point
       ----------------------------------------------------------------------- */
    diagnostic: {
      recognition: [
        { q: 'magazine',    options: ['A person receiving medical care', 'A publication with articles and pictures', 'A travel bag'], answer: 1 },
        { q: 'patient',     options: ['A person receiving medical care', 'A person who repairs cars', 'A school subject'], answer: 0 },
        { q: 'leave',       options: ['Arrive at a place', 'Go away from a place', 'Wait for someone'], answer: 1 },
        { q: 'out-of-date', options: ['No longer current', 'Very expensive', 'Available online'], answer: 0 },
        { q: 'receipt',     options: ['A paper showing what you paid', 'A short school exam', 'A train ticket'], answer: 0 },
        { q: 'platform',    options: ['A place to wait for a train', 'A place to swim', 'A place to repair cars'], answer: 0 },
        { q: 'delayed',     options: ['Earlier than planned', 'Later than planned', 'Not happening at all'], answer: 1 },
        { q: 'collect',     options: ['Go and get something', 'Give something away', 'Pay for something'], answer: 0 },
        { q: 'instructions',options: ['Words telling you what to do', 'News about sport', 'A school score'], answer: 0 },
        { q: 'available',   options: ['Ready to use or buy', 'Broken and unsafe', 'Already returned'], answer: 0 },
        { q: 'fit',         options: ['Be the correct size', 'Cost less money', 'Look up a word'], answer: 0 },
        { q: 'miss',        options: ['Be too late for transport', 'Get on transport in time', 'Repair transport'], answer: 0 }
      ],
      context: [
        { q: 'The 8:15 train leaves from ___ 3.',                                  options: ['receipt', 'platform', 'shelf'],            answer: 1 },
        { q: 'The swimming lesson is ___ because the pool is closed.',             options: ['cancelled', 'available', 'fit'],           answer: 0 },
        { q: 'Please ___ your school card here tomorrow.',                         options: ['miss', 'bring', 'spend'],                  answer: 1 },
        { q: 'You can ___ the book from the library for two weeks.',               options: ['borrow', 'lend', 'order'],                 answer: 0 },
        { q: 'The jacket is the right size. It ___ me.',                           options: ['checks', 'fits', 'remains'],               answer: 1 },
        { q: 'Return the form ___ Friday.',                                        options: ['until', 'during', 'by'],                   answer: 2 },
        { q: 'The bus is twenty minutes ___.',                                     options: ['delayed', 'required', 'current'],          answer: 0 },
        { q: 'Ask the ___ where the doctor is.',                                   options: ['passenger', 'receptionist', 'customer'],   answer: 1 },
        { q: 'The cafe is opposite the bank, on the other side of the ___.',       options: ['road', 'drawer', 'screen'],                answer: 0 },
        { q: 'Keep the ___ if you may need to return the shoes.',                  options: ['receipt', 'bill', 'mark'],                 answer: 0 }
      ],
      production: [
        { meaning: 'a publication with articles and pictures',   answer: 'magazine' },
        { meaning: 'go away from a place',                       answer: 'leave' },
        { meaning: 'a person receiving medical care',            answer: 'patient' },
        { meaning: 'later than planned',                         answer: 'delayed' },
        { meaning: 'go and get something',                       answer: 'collect' },
        { meaning: 'a place where passengers wait for a train',  answer: 'platform' }
      ]
    },

    /* -----------------------------------------------------------------------
       CASE STUDIES — the UNDERSTAND phase (how vocabulary works)
       ----------------------------------------------------------------------- */
    cases: [
      {
        id: 'case-structure',
        kind: 'structure',
        title: 'Magazines for patients to read',
        rule: 'noun + for + person + to + verb',
        explanation: 'Something that a person can or should use for a purpose.',
        examples: [
          ['chairs for visitors to sit on', 'Visitors can sit on the chairs.'],
          ['a form for students to complete', 'Students need to complete the form.'],
          ['water for players to drink', 'Players can drink the water.'],
          ['a box for people to leave magazines in', 'People put magazines inside the box.']
        ],
        items: [
          { object: 'a bench',      person: 'passengers', purpose: 'wait on' },
          { object: 'instructions', person: 'students',   purpose: 'read' },
          { object: 'a screen',     person: 'visitors',   purpose: 'check the times on' },
          { object: 'helmets',      person: 'cyclists',   purpose: 'wear' }
        ]
      },
      {
        id: 'case-compounds',
        kind: 'compound',
        title: 'Up-to-date, out-of-date and black box',
        explanation: 'Before deciding a phrase is new, split it into parts. Then test whether the sentence supports the meaning you built.',
        builds: [
          ['black',   'box',    'a box that is black'],
          ['school',  'trip',   'a trip organised by a school'],
          ['tennis',  'player', 'a person who plays tennis'],
          ['ticket',  'office', 'an office where tickets are sold or collected'],
          ['waiting', 'room',   'a room where people wait']
        ],
        gaps: [
          { text: 'The 2021 bus timetable is now ___. A newer one is online.', answers: ['out-of-date'] },
          { text: 'This website is ___; it includes today’s opening times.', answers: ['up-to-date'] },
          { text: 'Put the completed forms in the red ___ beside the door.', answers: ['box'] },
          { text: 'Meet me in the ___ room outside the dentist’s office.', answers: ['waiting'] },
          { text: 'Collect your tickets from the ticket ___.', answers: ['office'] }
        ],
        bank: ['box', 'office', 'out-of-date', 'up-to-date', 'waiting']
      },
      {
        id: 'case-leave',
        kind: 'polysemy',
        title: 'LEAVE without guessing',
        word: 'leave',
        senses: [
          { code: 'D', label: 'depart',            pattern: 'leave + place / leave at + time', example: 'The bus leaves school at 8.',        contrast: 'arrive at school at 9' },
          { code: 'P', label: 'put or keep somewhere', pattern: 'leave + object + place',      example: 'Leave the forms in the black box.',  contrast: 'take the forms with you' },
          { code: 'N', label: 'not take with you', pattern: 'leave + object + at home',        example: 'I left my racket at home.',          contrast: 'bring the racket here' },
          { code: 'O', label: 'allow to remain',   pattern: 'leave + object + adjective',      example: 'Leave the door open.',               contrast: 'close the door' },
          { code: 'R', label: 'remaining',         pattern: 'be left',                          example: 'Only two tickets are left.',         contrast: 'all tickets are sold' },
          { code: 'L', label: 'direction',         pattern: 'turn left',                        example: 'Turn left after the bank.',          contrast: 'turn right' }
        ],
        items: [
          { text: 'Please leave your bag beside the reception desk.', answer: 'P' },
          { text: 'The last train leaves at 9:40.',                   answer: 'D' },
          { text: 'I left my homework at home.',                      answer: 'N' },
          { text: 'Turn left after the bank.',                        answer: 'L' },
          { text: 'There is only one place left on the course.',      answer: 'R' },
          { text: 'Leave the window closed during the lesson.',       answer: 'O' }
        ]
      }
    ],

    /* -----------------------------------------------------------------------
       MODULES 1-8 — the word tables + "Complete from memory" tasks
       ----------------------------------------------------------------------- */
    modules: [
      {
        id: 'm1', n: 1,
        title: 'Core actions that control the message',
        why: 'These verbs change what a notice, message or conversation means. Learn the full pattern, not only the translation.',
        words: [
          w('leave',    'go away from a place',                    'leave school at 3:30',              'arrive'),
          w('arrive',   'get to a place',                          'arrive at the station / arrive in Lima', 'leave'),
          w('return',   'go or come back',                         'return the book / return home',     'keep'),
          w('miss',     'be too late for; feel sad without',       'miss the bus / miss my friends',    'catch'),
          w('catch',    'get on transport in time; receive',       'catch a train / catch a ball',      'miss'),
          w('bring',    'move something toward this place',        'bring your school card here',       'take'),
          w('take',     'move something away; travel by',          'take an umbrella / take the bus',   'bring'),
          w('collect',  'go and get something',                    'collect your ticket at reception',  'deliver'),
          w('pick up',  'collect a person or thing',               'pick me up outside school',         'drop off'),
          w('drop off', 'take someone somewhere and leave',        'drop the students off at the entrance', 'pick up'),
          w('keep',     'continue to have; not return',            'keep the receipt / keep the door closed', 'return'),
          w('check',    'look carefully to make sure',             'check the time and platform'),
          w('mean',     'have a particular message',               'What does this sign mean?'),
          w('change',   'make or become different',                'change the date / keep the change'),
          w('move',     'change place or position',                'move the chairs / move to a new house')
        ],
        bank: ['arrive', 'bring', 'catch', 'change', 'check', 'collect', 'drop off', 'keep', 'leave', 'mean', 'miss', 'move', 'pick up', 'return', 'take'],
        gapfill: [
          { text: 'Please ___ your ticket from the school office before Friday.',       answers: ['collect'] },
          { text: 'The coach will ___ the sports centre at 4:15 and come back to school at 6.', answers: ['leave'] },
          { text: 'Hurry or we’ll ___ the 8:20 train.',                            answers: ['miss'] },
          { text: 'Can your dad ___ us ___ after the match?',                           answers: ['pick', 'up'] },
          { text: 'Don’t ___ your water bottle at home. We need it here.',         answers: ['leave'] },
          { text: '___ the platform number before you get on the train.',               answers: ['check'] },
          { text: 'This sign ___ that students cannot enter this room.',                answers: ['means'] },
          { text: 'You can ___ the receipt, but please return the library card.',       answers: ['keep'] }
        ]
      },

      {
        id: 'm2', n: 2,
        title: 'Notices, times and instructions',
        why: 'KET notices often test a change, restriction, deadline or required action. These words carry that message.',
        words: [
          w('available', 'ready to use or buy',            'Tickets are available online.'),
          w('closed',    'not open',                       'The cafe is closed on Mondays.',     'open'),
          w('cancelled', 'planned but not happening',      'Practice is cancelled today.'),
          w('delayed',   'later than planned',             'The train is delayed by 20 minutes.', 'on time'),
          w('entrance',  'the way into a place',           'Meet at the main entrance.',          'exit'),
          w('exit',      'the way out of a place',         'Use the side exit after 6.',          'entrance'),
          w('until',     'up to a time',                   'The library is open until 7.',        'by'),
          w('by',        'not later than',                 'Return the form by Friday.',          'until'),
          w('during',    'inside a period of time',        'No phones during the exam.'),
          w('except',    'not including',                  'Open every day except Sunday.'),
          w('allowed',   'permitted',                      'Food is not allowed in the library.'),
          w('required',  'necessary; must be provided',    'A school card is required.'),
          w('remain',    'continue in the same state',     'The gym will remain open.'),
          w('instead',   'as a replacement',               'Meet on Tuesday instead.'),
          w('on time',   'at the planned time',            'Please arrive on time.',              'delayed')
        ],
        bank: ['allowed', 'available', 'by', 'cancelled', 'closed', 'delayed', 'during', 'except', 'instead', 'on time', 'remain', 'required', 'until'],
        gapfill: [
          { text: 'The pool is ___ this morning, so use the gym ___.',        answers: ['closed', 'instead'] },
          { text: 'Students must return the permission form ___ Thursday.',   answers: ['by'] },
          { text: 'The bus is ___, but the museum will ___ open.',            answers: ['delayed', 'remain'] },
          { text: 'Tickets are still ___ for the afternoon performance.',     answers: ['available'] },
          { text: 'Everyone must be quiet ___ the listening test.',           answers: ['during'] },
          { text: 'The centre opens daily ___ public holidays.',              answers: ['except'] },
          { text: 'A helmet is ___ for this cycling activity.',               answers: ['required'] },
          { text: 'Food is not ___ inside the computer room.',                answers: ['allowed'] }
        ]
      },

      {
        id: 'm3', n: 3,
        title: 'School, documents and technology',
        why: 'These words appear in school messages, forms, emails and digital instructions.',
        words: [
          w('subject',      'an area studied at school',                  'My favourite subject is science.'),
          w('term',         'one part of the school year',                'The new term starts in March.'),
          w('mark',         'a score for school work',                    'She got a high mark in maths.'),
          w('course',       'a series of lessons',                        'join an English course'),
          w('project',      'a planned piece of work',                    'finish a science project'),
          w('instructions', 'information telling you what to do',         'Read the instructions first.'),
          w('form',         'a document with spaces to complete',         'complete an application form'),
          w('note',         'a short written message',                    'leave a note for the teacher'),
          w('article',      'a text in a newspaper or magazine',          'read an article about sport'),
          w('magazine',     'a publication with articles and pictures',   'a monthly sports magazine'),
          w('file',         'stored information or a folder',             'download the file'),
          w('screen',       'the part of a device that shows information','look at the screen'),
          w('password',     'a secret word used to enter an account',     'enter your password'),
          w('click',        'press a button or link on a screen',         'click on the blue button'),
          w('download',     'copy data to your device',                   'download the homework')
        ],
        bank: ['article', 'click', 'course', 'download', 'file', 'form', 'instructions', 'magazine', 'mark', 'note', 'password', 'project', 'screen', 'subject', 'term'],
        gapfill: [
          { text: 'Complete this ___ and give it to the school office.',        answers: ['form'] },
          { text: 'Read the ___ carefully before you answer the questions.',    answers: ['instructions'] },
          { text: 'I saved my homework as a ___ on the school computer.',       answers: ['file'] },
          { text: 'Do not tell anyone your ___.',                               answers: ['password'] },
          { text: '___ on the picture to open the next page.',                  answers: ['click'] },
          { text: 'The school ___ about climate change lasted three weeks.',    answers: ['project'] },
          { text: 'Fabrizio read an ___ in a tennis ___.',                      answers: ['article', 'magazine'] },
          { text: 'History is the first ___ on Monday morning.',                answers: ['subject'] }
        ]
      },

      {
        id: 'm4', n: 4,
        title: 'Health, people and feelings',
        why: 'Health texts require both place vocabulary and words that describe symptoms, treatment and feelings.',
        words: [
          w('appointment',  'an arranged time to meet a professional', 'a dentist’s appointment'),
          w('chemist',      'a shop that sells medicine (pharmacy)',   'get medicine from the chemist'),
          w('medicine',     'something used to treat illness',         'take this medicine twice a day'),
          w('pain',         'an unpleasant physical feeling',          'a pain in my back'),
          w('hurt',         'cause or feel pain',                      'My ankle hurts.'),
          w('temperature',  'how hot the body or air is',              'have a high temperature'),
          w('rest',         'stop activity to recover',                'get some rest'),
          w('fit',          'healthy and physically strong',           'exercise to keep fit'),
          w('patient',      'a person receiving medical care',         'The patient is waiting for the doctor.'),
          w('receptionist', 'a person who welcomes visitors',          'ask the receptionist'),
          w('worried',      'thinking something bad may happen',       'worried about the test'),
          w('afraid',       'feeling fear',                            'afraid of needles'),
          w('bored',        'not interested because nothing is enjoyable', 'bored in the waiting room'),
          w('tired',        'needing rest',                            'feel tired after the match'),
          w('well',         'healthy',                                 'I don’t feel well.',  'ill'),
          w('ill',          'not healthy',                             'I’m ill today.',      'well')
        ],
        bank: ['afraid', 'appointment', 'bored', 'fit', 'hurt', 'ill', 'medicine', 'pain', 'patient', 'receptionist', 'rest', 'temperature', 'tired', 'well', 'worried'],
        gapfill: [
          { text: 'I have a dentist’s ___ at 10:30 tomorrow.',                       answers: ['appointment'] },
          { text: 'Ask the ___ where you should wait.',                                   answers: ['receptionist'] },
          { text: 'The ___ needs something to read while she waits for the doctor.',      answers: ['patient'] },
          { text: 'My knee ___ after yesterday’s tennis match.',                     answers: ['hurt'] },
          { text: 'You have a high ___, so you should stay home.',                        answers: ['temperature'] },
          { text: 'Take this ___ after breakfast and get some ___.',                      answers: ['medicine', 'rest'] },
          { text: 'He was ___ because the waiting room had nothing interesting to do.',   answers: ['bored'] },
          { text: 'Regular exercise helps you keep ___.',                                 answers: ['fit'] }
        ]
      },

      {
        id: 'm5', n: 5,
        title: 'Travel, places and services',
        why: 'Travel questions often depend on a precise place, direction, platform or journey word.',
        words: [
          w('journey',            'travel from one place to another',        'a two-hour train journey',    'trip'),
          w('trip',               'a visit and the travel connected to it',  'a school trip to the museum', 'journey'),
          w('tour',               'a visit around a place',                  'a guided tour of the castle'),
          w('passenger',          'a person travelling in a vehicle',        'train passengers'),
          w('platform',           'where passengers wait for a train',       'The train leaves from platform 4.'),
          w('luggage',            'bags used for travel',                    'heavy luggage'),
          w('suitcase',           'a travel container for clothes (case)',   'pack a suitcase'),
          w('traffic',            'vehicles using a road',                   'heavy traffic in the city centre'),
          w('straight on',        'continue without turning',                'Go straight on at the lights.'),
          w('corner',             'where two streets or sides meet',         'The bank is on the corner.'),
          w('opposite',           'on the other side',                       'The cafe is opposite the station.'),
          w('between',            'in the middle of two things',             'between the bank and the library'),
          w('garage',             'a place that repairs or keeps cars',      'take the car to the garage'),
          w('tourist information','a service giving visitors local help',    'ask at tourist information'),
          w('repair',             'make something work again',               'repair a bicycle')
        ],
        bank: ['between', 'corner', 'garage', 'journey', 'luggage', 'opposite', 'passenger', 'platform', 'repair', 'straight on', 'suitcase', 'tour', 'tourist information', 'traffic', 'trip'],
        gapfill: [
          { text: 'Our school ___ includes a guided ___ of the old castle.',        answers: ['trip', 'tour'] },
          { text: 'The train to Oxford leaves from ___ 6.',                         answers: ['platform'] },
          { text: 'Each ___ can take one small bag onto the coach.',                answers: ['passenger'] },
          { text: 'The bus was late because there was heavy ___.',                  answers: ['traffic'] },
          { text: 'Go ___, then turn left at the bank.',                            answers: ['straight on'] },
          { text: 'The sports centre is ___ the library and the supermarket.',      answers: ['between'] },
          { text: 'My bike is broken, so I need someone to ___ it.',                answers: ['repair'] },
          { text: 'The train ___ takes two hours, but the visit lasts all day.',    answers: ['journey'] }
        ]
      },

      {
        id: 'm6', n: 6,
        title: 'Shopping, clothes and home',
        why: 'The same everyday nouns and verbs appear in advertisements, messages, listening pictures and short conversations.',
        words: [
          w('receipt',   'paper showing what you bought and paid',   'keep the receipt',            'bill'),
          w('bill',      'a request for payment',                    'ask for the restaurant bill', 'receipt'),
          w('change',    'money returned after paying',              'Here’s your change.'),
          w('cost',      'the price of something',                   'How much does it cost?'),
          w('spend',     'use money or time',                        'spend £20 / spend time with friends'),
          w('try on',    'put on clothes to check them',             'try on a jacket'),
          w('wear',      'have clothes on your body',                'wear a school uniform'),
          w('fit',       'be the correct size',                      'These shoes don’t fit me.'),
          w('pocket',    'a small cloth space in clothes',           'My key is in my pocket.'),
          w('shelf',     'a flat surface for storing things',        'The books are on the shelf.'),
          w('drawer',    'a sliding storage box in furniture',       'Put the socks in the drawer.'),
          w('cupboard',  'a storage space with doors',               'plates in the kitchen cupboard'),
          w('furniture', 'large movable things in a room',           'a bed, table and sofa are furniture'),
          w('entrance',  'the way into a building',                  'wait inside the entrance'),
          w('floor',     'a level of a building; surface you walk on','second floor / sit on the floor')
        ],
        bank: ['bill', 'change', 'cost', 'cupboard', 'drawer', 'fit', 'floor', 'furniture', 'pocket', 'receipt', 'shelf', 'spend', 'try on', 'wear'],
        gapfill: [
          { text: 'You can ___ the trainers before you decide to buy them.',    answers: ['try on'] },
          { text: 'This jacket is too small. It doesn’t ___ me.',          answers: ['fit'] },
          { text: 'Keep your ___ in case you need to return the bag.',          answers: ['receipt'] },
          { text: 'The meal ___ £18, and I paid with a £20 note.',    answers: ['cost'] },
          { text: 'The waiter brought the ___ at the end of the meal.',         answers: ['bill'] },
          { text: 'Put the clean cups in the kitchen ___.',                     answers: ['cupboard'] },
          { text: 'My racket is on the top ___ beside the books.',              answers: ['shelf'] },
          { text: 'We need new ___ for the bedroom: a desk and a chair.',       answers: ['furniture'] }
        ]
      },

      {
        id: 'm7', n: 7,
        title: 'Food, quantities and restaurants',
        why: 'Food vocabulary is tested through menus, shopping, invitations and everyday conversations.',
        words: [
          w('meal',        'food eaten at one time',                  'Breakfast is my first meal.'),
          w('dish',        'food prepared in a particular way',       'a traditional Peruvian dish'),
          w('main course', 'the largest part of a meal',              'fish for the main course'),
          w('dessert',     'sweet food after the main course',        'ice cream for dessert'),
          w('snack',       'a small amount of food between meals',    'have a healthy snack'),
          w('slice',       'a thin flat piece',                       'a slice of bread'),
          w('piece',       'one part or amount',                      'a piece of cake'),
          w('bottle',      'a container for liquids',                 'a bottle of water'),
          w('bowl',        'a deep round container',                  'a bowl of soup'),
          w('can',         'a metal container',                       'a can of cola'),
          w('order',       'ask for food or goods',                   'order a sandwich'),
          w('serve',       'give food or drink to customers',         'Lunch is served at 1.'),
          w('grilled',     'cooked over direct heat',                 'grilled chicken',  'fried'),
          w('fried',       'cooked in hot oil',                       'fried potatoes',   'grilled'),
          w('hungry',      'needing food',                            'I’m hungry.', 'thirsty'),
          w('thirsty',     'needing a drink',                         'I’m thirsty.','hungry')
        ],
        bank: ['bottle', 'bowl', 'can', 'dessert', 'dish', 'fried', 'grilled', 'hungry', 'main course', 'meal', 'order', 'piece', 'serve', 'slice', 'snack', 'thirsty'],
        gapfill: [
          { text: 'Would you like soup or salad before the ___?',        answers: ['main course'] },
          { text: 'This restaurant ___ lunch from 12 until 3.',          answers: ['serves'] },
          { text: 'I would like to ___ the grilled chicken, please.',    answers: ['order'] },
          { text: 'Can I have a ___ of water and two glasses?',          answers: ['bottle'] },
          { text: 'She ate a ___ of toast and a ___ of cake.',           answers: ['slice', 'piece'] },
          { text: 'We had ice cream for ___.',                           answers: ['dessert'] },
          { text: 'Ceviche is a well-known Peruvian ___.',               answers: ['dish'] },
          { text: 'I need a drink because I’m ___, not hungry.',    answers: ['thirsty'] }
        ]
      },

      {
        id: 'm8', n: 8,
        title: 'Free time, sport, media and weather',
        why: 'These topics are close to your life, but the exam uses them in many different contexts.',
        words: [
          w('join',         'become a member of a group',                      'join the school chess club'),
          w('member',       'a person in a group',                             'a club member'),
          w('enter',        'put your name into a competition',                'enter a tennis competition'),
          w('take part in', 'participate in',                                  'take part in a school event'),
          w('practise',     'do an activity to improve (verb)',                'practise serving',  'practice (noun)'),
          w('practice',     'training activity or session (noun)',             'tennis practice',   'practise (verb)'),
          w('match',        'a sports competition between players or teams',   'win a difficult match'),
          w('race',         'a competition to see who is fastest',             'a cycling race'),
          w('prize',        'something given to a winner',                     'win a small prize'),
          w('programme',    'a TV/radio show or event schedule',               'a sports programme'),
          w('news',         'information about recent events',                 'watch the news'),
          w('forecast',     'information about future weather',                'check the weather forecast'),
          w('cloudy',       'with many clouds',                                'a cloudy afternoon'),
          w('storm',        'very bad weather with strong wind or rain',       'The storm delayed the match.'),
          w('wet',          'covered with water',                              'The courts are wet.',  'dry')
        ],
        bank: ['cloudy', 'enter', 'forecast', 'join', 'match', 'member', 'news', 'practice', 'practise', 'prize', 'programme', 'race', 'storm', 'take part in', 'wet'],
        gapfill: [
          { text: 'Fabrizio is going to ___ a tennis competition next month.',  answers: ['enter'] },
          { text: 'He needs to ___ his serve before the first ___.',            answers: ['practise', 'match'] },
          { text: 'Every new club ___ receives a blue shirt.',                  answers: ['member'] },
          { text: 'The winner of the cycling ___ gets a small ___.',            answers: ['race', 'prize'] },
          { text: 'Check the weather ___ before the outdoor event.',            answers: ['forecast'] },
          { text: 'The courts are too ___ to use after the ___.',               answers: ['wet', 'storm'] },
          { text: 'Would you like to ___ the school photography club?',         answers: ['join'] },
          { text: 'The sports ___ starts after the evening ___.',               answers: ['programme', 'news'] }
        ]
      }
    ],

    /* -----------------------------------------------------------------------
       EXAM LABS — the TRANSFER phase
       ----------------------------------------------------------------------- */
    examLabs: {
      part4: {
        title: 'Reading Part 4 — Vocabulary cloze',
        brief: 'Complete six gaps in a factual text by choosing the item that fits the complete meaning AND the words around the gap.',
        checks: [
          ['Meaning',     'Does the word make sense in the story?'],
          ['Collocation', 'Does it naturally combine with nearby words?'],
          ['Grammar',     'Does the form fit the sentence?']
        ],
        texts: [
          {
            id: 'p4t1',
            title: 'School trip to the Science Museum',
            body: 'Fabrizio’s class is going on a school (1)___ to the City Science Museum. The coach will (2)___ school at 8:15, so everyone must arrive by 8:05. Students should (3)___ their school card and a bottle of water. Lunch is included, but anyone who ordered the vegetarian (4)___ must tell the teacher. The museum shop will be open, and students can (5)___ up to £10. The return journey may be (6)___ because of traffic.',
            gaps: [
              { options: ['trip', 'race', 'course'],          answer: 0, why: '"school trip" is the fixed collocation for a class visit.' },
              { options: ['leave', 'miss', 'return'],         answer: 0, why: 'The coach departs from school — leave + place.' },
              { options: ['bring', 'collect', 'borrow'],      answer: 0, why: 'Move something toward this place: bring it with you.' },
              { options: ['meal', 'receipt', 'form'],         answer: 0, why: '"vegetarian meal" — lunch is food, not a document.' },
              { options: ['spend', 'cost', 'pay'],            answer: 0, why: 'spend + amount of money. "cost" needs a thing as subject.' },
              { options: ['delayed', 'closed', 'required'],   answer: 0, why: 'Traffic makes a journey later than planned.' }
            ]
          },
          {
            id: 'p4t2',
            title: 'Westside Sports Centre tennis',
            body: 'The Westside Sports Centre has a new Saturday tennis (1)___ for students aged 12 to 15. Beginners are welcome, and rackets are (2)___ if you do not have one. Sessions (3)___ at 10:00 and finish at midday. Please use the side (4)___ because the main doors are closed. You must (5)___ up online by Thursday. If the courts are (6)___, the lesson will take place in the gym.',
            gaps: [
              { options: ['course', 'article', 'journey'],    answer: 0, why: 'A series of lessons = a course.' },
              { options: ['available', 'worried', 'straight'],answer: 0, why: 'Ready to use if you do not have one.' },
              { options: ['start', 'return', 'spend'],        answer: 0, why: 'Paired with "finish at midday".' },
              { options: ['entrance', 'platform', 'corner'],  answer: 0, why: 'The way into a building; contrasted with "main doors".' },
              { options: ['sign', 'pick', 'turn'],            answer: 0, why: '"sign up" = register. Phrasal verb collocation.' },
              { options: ['wet', 'fit', 'bright'],            answer: 0, why: 'Wet courts move the lesson indoors.' }
            ]
          }
        ]
      },
      part1: {
        title: 'Reading Part 1 — Main messages',
        brief: 'Read the whole message. A wrong option may repeat one word but change the person, action, time, place or restriction.',
        items: [
          {
            label: 'CLINIC WAITING ROOM',
            text: 'We need recent magazines for patients to read. Please leave donations in the black box beside reception. Do not bring newspapers more than one week old.',
            options: [
              'The clinic wants patients to return its magazines.',
              'People can put suitable reading material in a particular container.',
              'The receptionist sells newspapers to patients.'
            ],
            answer: 1,
            why: '"leave donations in the black box" = put reading material in a container.',
            traps: ['"magazines" is repeated but nobody is returning anything.', 'Nothing is being sold; donations are free.']
          },
          {
            label: 'LIBRARY NOTICE',
            text: 'Travel guides published before 2024 are now out-of-date. Take one from the FREE shelf today. The new, up-to-date guides cannot leave the library.',
            options: [
              'Visitors may take the newest travel guides home.',
              'The library is selling all its travel books.',
              'Older guides are free, but current ones must remain inside.'
            ],
            answer: 2,
            why: 'Old = free to take. New = "cannot leave the library".',
            traps: ['The opposite: the NEW guides cannot leave.', '"FREE" contradicts selling.']
          },
          {
            label: 'MESSAGE FROM SAM',
            text: 'Leo, my bus is delayed, so don’t wait at the sports centre entrance. I’ll get off at the library and meet you there at 5:20. — Sam',
            options: [
              'Sam has changed both the meeting time and place.',
              'Leo should catch the bus from the sports centre.',
              'Sam wants Leo to wait inside the sports centre.'
            ],
            answer: 0,
            why: 'New place (library) and new time (5:20).',
            traps: ['Leo is not travelling by bus; Sam is.', '"don’t wait at the sports centre" says the opposite.']
          },
          {
            label: 'SATURDAY ART CLUB',
            text: 'Collect your materials from Room 6 before the session. Paint and paper are included, but bring your own box to carry your work home.',
            options: [
              'Students must pay for the paint and paper.',
              'Students need a container for taking their work away.',
              'Students should leave their materials in Room 6 after class.'
            ],
            answer: 1,
            why: '"bring your own box to carry your work home" = a container to take work away.',
            traps: ['"included" means no payment.', 'Materials are collected BEFORE, not left after.']
          },
          {
            label: 'CAFE',
            text: 'The kitchen closes at 3:30 today. Drinks and cold snacks remain available until 5. Customers with hot-food orders must collect them by 3:20.',
            options: [
              'Customers cannot buy anything after 3:30.',
              'Hot meals will be served until 5.',
              'Some items are available later than hot food.'
            ],
            answer: 2,
            why: 'Drinks and cold snacks until 5; hot food ends earlier.',
            traps: ['Drinks and cold snacks are still sold.', 'The kitchen (hot food) closes at 3:30.']
          },
          {
            label: 'SCHOOL COMPUTER ROOM',
            text: 'You may download files during the lesson, but save them to your school account. Personal USB drives are not allowed.',
            options: [
              'Students must use the school’s online storage for their files.',
              'Students cannot download information in class.',
              'Students need to bring a personal storage device.'
            ],
            answer: 0,
            why: '"save them to your school account" + USB not allowed.',
            traps: ['Downloading IS permitted during the lesson.', 'USB drives are explicitly not allowed.']
          }
        ]
      }
    },

    /* -----------------------------------------------------------------------
       PRODUCTION LAB — speaking and writing
       ----------------------------------------------------------------------- */
    production: {
      speaking: [
        { prompt: 'Explain a school trip from meeting point to return.',      words: ['leave', 'arrive', 'platform', 'passenger', 'collect', 'delayed'] },
        { prompt: 'Explain what happens at a medical appointment.',           words: ['patient', 'receptionist', 'appointment', 'medicine', 'worried', 'rest'] },
        { prompt: 'Describe buying and returning clothes.',                   words: ['try on', 'fit', 'cost', 'receipt', 'change', 'return'] },
        { prompt: 'Invite a friend to a sports event and explain the plan.',  words: ['enter', 'match', 'programme', 'available', 'entrance', 'on time'] }
      ],
      writing: {
        title: 'Write a 55-word message',
        situation: 'Your Saturday tennis practice has changed. Write to Leo. Explain what changed, where you will meet, what he should bring and when he must reply.',
        targetWords: 55,
        tolerance: 10,
        minRequired: 6,
        required: ['cancelled', 'instead', 'entrance', 'bring', 'by', 'on time', 'leave', 'available', 'collect']
      }
    },

    /* -----------------------------------------------------------------------
       REFERENCE — A2 Key topic bank (mark RED/AMBER/GREEN, do not copy)
       ----------------------------------------------------------------------- */
    topicBank: {
      'Education':                   ['biology', 'chemistry', 'classmate', 'course', 'dictionary', 'exam', 'geography', 'homework', 'instructions', 'language', 'lesson', 'library', 'mark', 'maths', 'physics', 'project', 'pupil', 'science', 'subject', 'term', 'test', 'university'],
      'Documents and media':         ['advertisement', 'article', 'bill', 'book', 'card', 'comic', 'diary', 'email', 'form', 'letter', 'magazine', 'menu', 'message', 'newspaper', 'note', 'notebook', 'passport', 'postcard', 'programme', 'project', 'receipt', 'textbook', 'ticket'],
      'Communication and technology':['address', 'call', 'chat', 'click', 'computer', 'download', 'file', 'internet', 'keyboard', 'laptop', 'mobile phone', 'online', 'password', 'printer', 'screen', 'software', 'tablet', 'text', 'video', 'web page', 'website'],
      'Health and exercise':         ['accident', 'ambulance', 'appointment', 'chemist', 'cold', 'dentist', 'doctor', 'exercise', 'fit', 'health', 'hospital', 'hurt', 'ill', 'medicine', 'nurse', 'pain', 'rest', 'sick', 'stomach ache', 'temperature', 'tired', 'toothache', 'well'],
      'Travel and transport':        ['airport', 'backpack', 'bus stop', 'coach', 'delay', 'delayed', 'driver', 'flight', 'journey', 'leave', 'luggage', 'miss', 'passenger', 'passport', 'platform', 'return', 'seat', 'station', 'suitcase', 'ticket', 'tour', 'traffic', 'train', 'trip'],
      'Places and services':         ['bank', 'cafe', 'car park', 'cinema', 'city centre', 'corner', 'dentist', 'entrance', 'exit', 'garage', 'hospital', 'hotel', 'library', 'market', 'museum', 'petrol station', 'post office', 'railway station', 'restaurant', 'sports centre', 'supermarket', 'theatre', 'tourist information'],
      'Shopping and clothes':        ['advertisement', 'bill', 'cash', 'change', 'cheap', 'closed', 'cost', 'credit card', 'customer', 'expensive', 'fit', 'for sale', 'open', 'pay for', 'price', 'receipt', 'shop assistant', 'spend', 'try on', 'wear', 'wallet'],
      'Food and drink':              ['bottle', 'bowl', 'breakfast', 'can', 'dessert', 'dish', 'fork', 'fried', 'grilled', 'hungry', 'main course', 'meal', 'menu', 'order', 'piece', 'plate', 'serve', 'slice', 'snack', 'thirsty', 'waiter', 'waitress'],
      'Hobbies, media and sport':    ['club', 'coach', 'competition', 'cycling', 'enter', 'exhibition', 'festival', 'join', 'magazine', 'match', 'member', 'museum', 'news', 'photograph', 'practise', 'practice', 'prize', 'programme', 'race', 'racket', 'take part in', 'team', 'tennis', 'winner'],
      'Feelings, descriptions and weather': ['afraid', 'bored', 'boring', 'busy', 'careful', 'clear', 'cloudy', 'difficult', 'excited', 'fit', 'heavy', 'interested', 'interesting', 'quiet', 'ready', 'storm', 'tired', 'useful', 'warm', 'wet', 'windy', 'worried', 'wrong']
    },

    /* -----------------------------------------------------------------------
       The four-week retrieval plan (drives the scheduler copy)
       ----------------------------------------------------------------------- */
    plan: [
      { when: 'Lesson day', job: 'Learn 12-15 words in context. Produce each one once.',      minutes: 15 },
      { when: 'Next day',   job: 'Cover the list. Retrieve meaning, chunk and one example.',  minutes: 8 },
      { when: 'Day 3',      job: 'Complete a mixed gap task without the word bank.',          minutes: 8 },
      { when: 'Day 7',      job: 'Use six words in speaking or a short message.',             minutes: 10 },
      { when: 'Day 14',     job: 'Complete a cold retrieval test. Promote words to green.',   minutes: 10 }
    ],

    exitTarget: 'At least 16/20 on two cold retrieval checks and at least 5/6 on each exam transfer task.',
    footer: 'Original Riverflow English material based on the A2 Key for Schools vocabulary guide and task format. It is not an official Cambridge examination paper.'
  };

  window.EA = window.EA || {};
  (window.EA.packs = window.EA.packs || []).push(PACK);
})();
