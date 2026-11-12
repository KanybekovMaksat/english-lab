// Тексты книги. Английский — уровень A1 для детей 7–12 лет, рядом короткая подсказка на русском.
// Урок: слова → прогноз → опыт → Say it → клапан WHY? → штамп. Уроки 1–5 открыты, 6–10 — после заявки родителя.
// kind: 'items' — нажимаем предметы; 'levels' — выбираем вариант и жмём Go; 'steps' — жмём кнопку N раз (дни, порции).

export const BOOK = {
  title: 'AiCo Word Lab',
  subtitle: 'English through science',
  ages: 'Ages 7–12 · A1',
  site: 'english.codify.kg',
  siteUrl: 'https://english.codify.kg',
  freeLessons: 5,
};

export const LESSONS = [
  {
    id: 'float', kind: 'items',
    title: 'Float or sink?', ru: 'Плавает или тонет?',
    words: [['float', 'плавать'], ['sink', 'тонуть'], ['heavy', 'тяжёлый'], ['light', 'лёгкий'], ['water', 'вода'], ['air', 'воздух']],
    predict: { q: 'Will the apple float or sink?', ru: 'Яблоко утонет или будет плавать?', options: ['It floats', 'It sinks'], answer: 0 },
    task: 'Tap each thing. It drops into the water.', taskRu: 'Нажимай на предметы — они падают в воду',
    items: [
      { id: 'apple', name: 'apple', ru: 'яблоко', emoji: '🍎', yes: true },
      { id: 'coin', name: 'coin', ru: 'монета', emoji: '🪙', yes: false },
      { id: 'ball', name: 'ball', ru: 'мяч', emoji: '⚽', yes: true },
      { id: 'stone', name: 'stone', ru: 'камень', emoji: '🪨', yes: false },
    ],
    sentence: (it) => `The ${it.name} ${it.yes ? 'floats' : 'sinks'}.`,
    blank: 'The ___ floats.  The ___ sinks.',
    challenge: 'Test all 4 things',
    why: ['An apple has lots of air inside.', 'It is lighter than the same amount', 'of water, so the water pushes it up.'],
    whyRu: 'В яблоке много воздуха, поэтому вода выталкивает его наверх.',
  },
  {
    id: 'magnet', kind: 'items',
    title: 'Magic magnet', ru: 'Магнит',
    words: [['magnet', 'магнит'], ['metal', 'металл'], ['pull', 'тянуть'], ['stick', 'прилипать'], ['iron', 'железо'], ['wood', 'дерево']],
    predict: { q: 'Will the magnet pull the paper clip?', ru: 'Магнит притянет скрепку?', options: ['Yes, it will', 'No, it won’t'], answer: 0 },
    task: 'Tap each thing. Does the magnet pull it?', taskRu: 'Нажимай на предметы — притянет или нет?',
    items: [
      { id: 'clip', name: 'paper clip', ru: 'скрепка', emoji: '📎', yes: true },
      { id: 'pencil', name: 'pencil', ru: 'карандаш', emoji: '✏️', yes: false },
      { id: 'nail', name: 'nail', ru: 'гвоздь', emoji: '🔩', yes: true },
      { id: 'eraser', name: 'eraser', ru: 'ластик', emoji: '🧽', yes: false },
    ],
    sentence: (it) => `The magnet ${it.yes ? 'pulls' : 'does not pull'} the ${it.name}.`,
    blank: 'The magnet pulls the ___.',
    challenge: 'Test all 4 things',
    why: ['Magnets pull iron. A paper clip and', 'a nail are made of iron. A pencil is', 'wood and an eraser is rubber.'],
    whyRu: 'Магнит притягивает железо. Дерево и резина — не металл.',
  },
  {
    id: 'rainbow', kind: 'items',
    title: 'Make a rainbow', ru: 'Сделай радугу',
    words: [['torch', 'фонарик'], ['prism', 'призма'], ['rainbow', 'радуга'], ['colour', 'цвет'], ['bend', 'сгибать'], ['white', 'белый']],
    predict: { q: 'What comes out of the prism?', ru: 'Что выйдет из призмы?', options: ['White light', 'A rainbow'], answer: 1 },
    task: 'Tap the torch. Then tap every colour.', taskRu: 'Включи фонарик, потом нажми на каждый цвет',
    items: [
      { id: 'red', name: 'red', ru: 'красный', hex: '#ff4d4d' },
      { id: 'orange', name: 'orange', ru: 'оранжевый', hex: '#ff9a2e' },
      { id: 'yellow', name: 'yellow', ru: 'жёлтый', hex: '#ffe14d' },
      { id: 'green', name: 'green', ru: 'зелёный', hex: '#6ee05a' },
      { id: 'blue', name: 'blue', ru: 'синий', hex: '#3aa0ff' },
      { id: 'indigo', name: 'indigo', ru: 'индиго', hex: '#5b5bff' },
      { id: 'violet', name: 'violet', ru: 'фиолетовый', hex: '#b45bff' },
    ],
    sentence: (it) => `This is ${it.name}.`,
    blank: 'This is ___.',
    challenge: 'Hear all 7 colours',
    why: ['White light is a mix of all colours.', 'The prism bends every colour a little', 'differently, so they spread out.'],
    whyRu: 'Белый свет — смесь всех цветов. Призма разводит их в стороны.',
  },
  {
    id: 'plant', kind: 'steps', steps: 5, stepLabel: 'Next day', stepEmoji: '☀️',
    title: 'Grow a plant', ru: 'Вырасти растение',
    words: [['seed', 'семя'], ['soil', 'земля'], ['root', 'корень'], ['leaf', 'лист'], ['grow', 'расти'], ['sun', 'солнце']],
    predict: { q: 'Which seed will grow best?', ru: 'Какое семечко вырастет лучше?', options: ['Water only', 'Water and sun', 'No water, no sun'], answer: 1 },
    task: 'Tap “Next day” five times. Watch the pots.', taskRu: 'Нажми «Next day» пять раз и смотри на горшки',
    items: [
      { id: 'water', name: 'water only', ru: 'только вода', label: 'A' },
      { id: 'both', name: 'water and sun', ru: 'вода и солнце', label: 'B' },
      { id: 'none', name: 'no water, no sun', ru: 'ничего', label: 'C' },
    ],
    sentence: (it) => ({ water: 'Pot A grows a little. It is pale.', both: 'Pot B grows big and green!', none: 'Pot C does not grow.' })[it.id],
    blank: 'Pot ___ grows big.',
    challenge: 'Watch for 5 days',
    why: ['A plant needs water and sunlight', 'to make its food. Without the sun', 'it grows thin and pale.'],
    whyRu: 'Растению нужны вода и солнце, чтобы делать себе еду.',
  },
  {
    id: 'ramp', kind: 'levels',
    title: 'Fast or slow?', ru: 'Быстро или медленно?',
    words: [['ramp', 'горка'], ['roll', 'катиться'], ['fast', 'быстро'], ['slow', 'медленно'], ['high', 'высокий'], ['low', 'низкий']],
    predict: { q: 'From which ramp will the car go faster?', ru: 'С какой горки машинка поедет быстрее?', options: ['The high ramp', 'The low ramp'], answer: 0 },
    task: 'Pick a height, then tap “Go!”. Try all three.', taskRu: 'Выбери высоту и нажми «Go!» — попробуй все три',
    items: [
      { id: 'low', name: 'low', ru: 'низко', emoji: '▁' },
      { id: 'mid', name: 'middle', ru: 'средне', emoji: '▃' },
      { id: 'high', name: 'high', ru: 'высоко', emoji: '▆' },
    ],
    sentence: (it) => ({ low: 'From the low ramp the car is slow.', mid: 'From the middle ramp it is faster.', high: 'From the high ramp the car is fast!' })[it.id],
    blank: 'From the ___ ramp the car is fast.',
    challenge: 'Roll from all 3 heights',
    why: ['Gravity pulls the car down the ramp.', 'A high ramp is steep, so the car', 'speeds up more and goes far.'],
    whyRu: 'Гравитация тянет машинку вниз. С крутой горки она разгоняется сильнее.',
  },
  {
    id: 'sing', kind: 'items',
    title: 'Make it sing', ru: 'Поющие стаканы',
    words: [['sound', 'звук'], ['loud', 'громкий'], ['quiet', 'тихий'], ['glass', 'стакан'], ['full', 'полный'], ['empty', 'пустой']],
    predict: { q: 'Which glass sings lower?', ru: 'Какой стакан звучит ниже?', options: ['The full glass', 'The empty glass'], answer: 0 },
    task: 'Tap each glass with the spoon. Listen!', taskRu: 'Стучи ложкой по стаканам и слушай',
    items: [
      { id: 'empty', name: 'empty glass', ru: 'пустой', emoji: '🥛', level: 0, yes: false },
      { id: 'half', name: 'half glass', ru: 'наполовину', emoji: '🥛', level: 0.5, yes: false },
      { id: 'full', name: 'full glass', ru: 'полный', emoji: '🥛', level: 0.92, yes: true },
    ],
    sentence: (it) => ({ empty: 'The empty glass sings high.', half: 'The half glass sings in the middle.', full: 'The full glass sings low.' })[it.id],
    blank: 'The ___ glass sings low.',
    challenge: 'Tap all 3 glasses',
    why: ['Tap the glass and it shakes.', 'Water makes the glass shake slowly.', 'Slow shaking makes a low sound.'],
    whyRu: 'Вода заставляет стакан дрожать медленнее, а медленная дрожь — это низкий звук.',
  },
  {
    id: 'shadow', kind: 'levels',
    title: 'Shadow show', ru: 'Театр теней',
    words: [['shadow', 'тень'], ['big', 'большой'], ['small', 'маленький'], ['near', 'близко'], ['far', 'далеко'], ['dark', 'тёмный']],
    predict: { q: 'Move AiCo near the torch. The shadow gets…', ru: 'Подвинем AiCo к фонарику. Тень станет…', options: ['Bigger', 'Smaller'], answer: 0 },
    task: 'Pick a place for AiCo, then tap “Light!”.', taskRu: 'Выбери, где стоит AiCo, и нажми «Light!»',
    items: [
      { id: 'near', name: 'near', ru: 'близко', emoji: '◀' },
      { id: 'middle', name: 'middle', ru: 'посередине', emoji: '■' },
      { id: 'far', name: 'far', ru: 'далеко', emoji: '▶' },
    ],
    sentence: (it) => ({ near: 'Near the torch, the shadow is big.', middle: 'In the middle, the shadow is smaller.', far: 'Far from the torch, the shadow is small.' })[it.id],
    blank: 'Near the torch, the shadow is ___.',
    challenge: 'Try all 3 places',
    why: ['Light goes in straight lines.', 'Near the torch, AiCo stops more light.', 'So the shadow is big.'],
    whyRu: 'Свет идёт по прямой. Близко к фонарику AiCo закрывает больше света.',
  },
  {
    id: 'ice', kind: 'items',
    title: 'Ice race', ru: 'Гонка льда',
    words: [['ice', 'лёд'], ['melt', 'таять'], ['hot', 'горячий'], ['cold', 'холодный'], ['warm', 'тёплый'], ['plate', 'тарелка']],
    predict: { q: 'Where does the ice melt faster?', ru: 'Где лёд растает быстрее?', options: ['On the metal plate', 'On the wood plate'], answer: 0 },
    task: 'Tap each ice cube and watch it melt.', taskRu: 'Нажми на каждый кубик льда и смотри',
    items: [
      { id: 'metal', name: 'metal plate', ru: 'металл', emoji: '🔘', yes: true },
      { id: 'wood', name: 'wood plate', ru: 'дерево', emoji: '🟫', yes: false },
    ],
    sentence: (it) => (it.yes ? 'On the metal plate, the ice melts fast!' : 'On the wood plate, the ice melts slowly.'),
    blank: 'On the ___ plate, the ice melts fast.',
    challenge: 'Test both plates',
    why: ['Metal moves heat fast.', 'Heat goes from the plate into the ice.', 'Wood moves heat slowly.'],
    whyRu: 'Металл быстро передаёт тепло льду, а дерево — медленно.',
  },
  {
    id: 'circuit', kind: 'items',
    title: 'Light it up', ru: 'Зажги лампочку',
    words: [['battery', 'батарейка'], ['wire', 'провод'], ['bulb', 'лампочка'], ['switch', 'выключатель'], ['on', 'включено'], ['off', 'выключено']],
    predict: { q: 'Will a key turn the bulb on?', ru: 'Ключ зажжёт лампочку?', options: ['Yes, it will', 'No, it won’t'], answer: 0 },
    task: 'Tap each thing. It goes into the gap.', taskRu: 'Нажимай на предметы — они встают в разрыв цепи',
    items: [
      { id: 'key', name: 'key', ru: 'ключ', emoji: '🔑', yes: true },
      { id: 'string', name: 'string', ru: 'нитка', emoji: '🧵', yes: false },
      { id: 'spoon', name: 'spoon', ru: 'ложка', emoji: '🥄', yes: true },
      { id: 'straw', name: 'straw', ru: 'трубочка', emoji: '🥤', yes: false },
    ],
    sentence: (it) => `The ${it.name} ${it.yes ? 'turns the bulb on' : 'does not turn the bulb on'}.`,
    blank: 'The ___ turns the bulb on.',
    challenge: 'Test all 4 things',
    why: ['Electricity runs through metal.', 'A key is metal, so the bulb is on.', 'String and plastic stop it.'],
    whyRu: 'Ток бежит по металлу. Нитка и пластик его не пропускают.',
  },
  {
    id: 'fizz', kind: 'steps', steps: 3, stepLabel: 'Add soda', stepEmoji: '🥄',
    title: 'Fizz balloon', ru: 'Шипучий шарик',
    words: [['mix', 'смешивать'], ['pour', 'наливать'], ['bubble', 'пузырь'], ['gas', 'газ'], ['bottle', 'бутылка'], ['balloon', 'шарик']],
    predict: { q: 'We mix soda and vinegar. The balloon…', ru: 'Смешаем соду и уксус. Шарик…', options: ['Gets big', 'Stays small'], answer: 0 },
    task: 'Tap “Add soda” three times.', taskRu: 'Нажми «Add soda» три раза',
    items: [
      { id: 'bubbles', name: 'bubbles', ru: 'пузыри' },
      { id: 'gas', name: 'gas', ru: 'газ' },
      { id: 'balloon', name: 'balloon', ru: 'шарик' },
    ],
    sentence: (it) => ({ bubbles: 'Soda and vinegar make bubbles.', gas: 'The bubbles are a gas.', balloon: 'The gas fills the balloon. It gets big!' })[it.id],
    blank: 'The balloon gets ___.',
    challenge: 'Add soda 3 times',
    why: ['Soda and vinegar make a gas.', 'The gas needs more room.', 'It goes up and fills the balloon.'],
    whyRu: 'Сода и уксус дают газ. Ему нужно место — он надувает шарик.',
  },
];

// Пробный урок: 5 заданий, которые ребёнок делает вживую (их видит родитель в воронке).
export const TRIAL = {
  title: 'Бесплатный открытый урок',
  dates: 'Первые открытые уроки 21–22 ноября',
  where: 'Codify Джал, ул. Тыналиева, 127, Бишкек',
  when: 'По субботам и воскресеньям',
  teacher: 'Ведёт Майкл — преподаватель-носитель, опыт более 13 лет',
  tasks: [
    { emoji: '🍊', title: 'Апельсин-фокусник', text: 'Целый апельсин плавает, очищенный тонет. Дети спорят по-английски: “It floats!” — “It sinks!”' },
    { emoji: '🧲', title: 'Магнитная рыбалка', text: 'Удочкой с магнитом ловят карточки-слова. Слово остаётся у того, кто его назвал.' },
    { emoji: '🌈', title: 'Радуга из конфет', text: 'Тёплая вода растворяет цветную глазурь. Дети называют цвета, пока радуга растекается.' },
    { emoji: '🎈', title: 'Гонка ракет-шариков', text: 'Команды запускают шарики по нитке: “Three, two, one, go! Fast!”' },
    { emoji: '🌋', title: 'Вулкан и отчёт учёного', text: 'Сода + уксус = извержение. Ребёнок рассказывает на английском, что получилось, — с вашего согласия снимем 20-секундное видео для вас.' },
  ],
};

// Подсказки AiCo по шагам урока: короткая английская фраза (озвучена) + русский перевод.
export const COACH = {
  words: { en: 'Listen to the words.', ru: 'Нажми на 3 слова и послушай' },
  predict: { en: 'What will happen? Choose!', ru: 'Как думаешь, что будет? Выбери ответ' },
  test: { en: 'Now test it!', ru: 'Теперь проверь опытом' },
  say: { en: 'Listen and say it.', ru: 'Послушай фразу и повтори вслух' },
  why: { en: 'Lift the flap!', ru: 'Подними клапан — узнай почему' },
  stamp: { en: 'Great job! Here is your stamp!', ru: 'Отлично! Вот твой штамп' },
  next: { en: 'Next lab!', ru: 'Дальше — следующий опыт' },
  right: { en: 'Yes! You were right!', ru: 'Да! Прогноз верный' },
  wrong: { en: 'Good try! Now you know.', ru: 'Хорошая попытка! Теперь ты знаешь' },
  hello: { en: 'Hello! I am AiCo. Let’s do science!', ru: 'Привет! Я AiCo. Давай делать опыты!' },
  torch: { en: 'Tap the torch first!', ru: 'Сначала включи фонарик' },
  parent: { en: 'Show this to mum or dad!', ru: 'Покажи это маме или папе' },
  saidIt: { en: 'Well done!', ru: 'Молодец!' },
};

// Русские реплики голосом AiCo — только в первый раз для каждого шага и для зова родителя.
export const COACH_RU = {
  words: 'Нажми на три слова — я прочитаю их по-английски.',
  predict: 'Как думаешь, что будет? Выбери ответ, а потом проверим.',
  test: 'Теперь проверь опытом! Нажимай на предметы в лаборатории.',
  say: 'Послушай фразу и скажи её вслух. Потом нажми зелёную кнопку.',
  why: 'Подними клапан на странице — там ответ, почему так вышло.',
  parent: 'Позови маму или папу — я хочу им кое-что показать.',
};

// Развороты книги: титул, уроки, финал.
export const SPREADS = [
  { kind: 'title', label: 'Start' },
  ...LESSONS.map((l, i) => ({ kind: 'lesson', lesson: i, label: `Lesson ${i + 1} · ${l.title}` })),
  { kind: 'final', label: 'My stamps' },
];

export const WORD_COUNT = LESSONS.reduce((n, l) => n + l.words.length, 0);
export const isLocked = (i, unlocked) => i >= BOOK.freeLessons && !unlocked;
