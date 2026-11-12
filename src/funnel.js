// Воронка для родителей: результаты ребёнка → 5 заданий открытого урока → форма записи.
// Заявка уходит в amoCRM через тот же сервис, что и форма english.codify.kg (leads.codify.kg, тег english,
// код источника wordlab). Сервис принимает запросы только с english.codify.kg; с другого адреса
// заявка уходит в WhatsApp отдела продаж готовым сообщением — как на сайте. Уроки 6–10 открываются после заявки.
import { LESSONS, TRIAL, BOOK } from './content.js';
import { aicoSVG } from './aico.js';
import { track } from './track.js';

export const FUNNEL = {
  endpoint: 'https://leads.codify.kg/forms/landing',
  landing: 'english',
  code: 'wordlab',
  phoneWa: '996500431430',
  ages: ['7–9', '10–12', '13–17'],
  // Дни открытых уроков с english.codify.kg. Прошедшие даты скрываются сами; «Другой день» есть всегда.
  slots: [{ label: 'Сб, 21 ноября', date: '2026-11-21' }, { label: 'Вс, 22 ноября', date: '2026-11-22' }],
  other: 'Другой день',
};

export function openSlots(now = new Date()) {
  const today = now.toISOString().slice(0, 10);
  return [...FUNNEL.slots.filter((s) => s.date >= today).map((s) => s.label), FUNNEL.other];
}
// мобильные и городские номера Кыргызстана: 9 цифр после +996, начинаются с 2, 3, 5, 7 или 9
export const validPhone = (digits) => /^[23579]\d{8}$/.test(digits);
const unlockUrl = () => { const u = new URL(location.href); u.search = '?unlock=lab'; u.hash = ''; return u.href; };

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const img = (mood, e = 0.5) => `<img alt="" src="data:image/svg+xml;charset=utf-8,${encodeURIComponent(aicoSVG(mood, e))}">`;

export function createFunnel({ progress, onUnlock, say }) {
  const root = document.createElement('div');
  root.className = 'funnel'; root.setAttribute('role', 'dialog'); root.setAttribute('aria-modal', 'true'); root.setAttribute('aria-labelledby', 'fnH');
  root.innerHTML = '<div class="f-back" data-close></div><div class="f-card" tabindex="-1"></div>';
  document.body.append(root);
  const card = root.querySelector('.f-card');
  let reason = 'menu', form = { age: '', slot: '', name: '', phone: '' };

  function results() {
    const n = progress.stamps(), words = progress.wordsLearned(), right = progress.rightCount();
    return `<div class="f-stats">
      <div><b>${n}</b><span>${n === 1 ? 'опыт' : n >= 2 && n <= 4 ? 'опыта' : 'опытов'}</span></div>
      <div><b>${words}</b><span>слов в опытах</span></div>
      <div><b>${right}/${n || 0}</b><span>прогнозов верно</span></div>
    </div>`;
  }

  function view() {
    const locked = reason === 'lock';
    const n = progress.stamps();
    const head = locked
      ? `<h2 id="fnH">Уроки 6–10 откроются после записи</h2><p class="f-lead">${n ? `Пройдено опытов: ${n} из ${BOOK.freeLessons} бесплатных.` : `Первые ${BOOK.freeLessons} опытов — бесплатно.`} Запишите ребёнка на бесплатный открытый урок — и ещё 5 опытов откроются сразу.</p>`
      : `<h2 id="fnH">Вот что ваш ребёнок уже умеет</h2><p class="f-lead">Слова здесь не заучивают: ребёнок видит, как они работают, и сам проверяет прогнозы. Дальше — вживую, с преподавателем-носителем.</p>`;
    card.innerHTML = `
      <button class="f-x" data-close aria-label="Закрыть">×</button>
      <div class="f-top">${img(locked ? 'think' : 'love', 1)}<span class="f-tag">Для родителей</span></div>
      ${head}
      ${results()}
      <h3>На открытом уроке — 5 опытов руками</h3>
      <ol class="f-tasks">${TRIAL.tasks.map((t) => `<li><i>${t.emoji}</i><div><b>${esc(t.title)}</b><span>${esc(t.text)}</span></div></li>`).join('')}</ol>
      <p class="f-facts"><b>${esc(TRIAL.dates)}</b><br>${esc(TRIAL.when)} · ${esc(TRIAL.where)}<br>${esc(TRIAL.teacher)}. Всё для опытов выдаём на уроке.</p>
      <form class="f-form" novalidate>
        <fieldset><legend>Возраст ребёнка</legend><div class="f-chips">${FUNNEL.ages.map((a) => `<label><input type="radio" name="age" value="${a}"${form.age === a ? ' checked' : ''}><span>${a} лет</span></label>`).join('')}</div></fieldset>
        <fieldset><legend>Когда удобно</legend><div class="f-chips">${openSlots().map((a) => `<label><input type="radio" name="slot" value="${esc(a)}"${form.slot === a ? ' checked' : ''}><span>${esc(a)}</span></label>`).join('')}</div></fieldset>
        <label class="f-field"><span>Ваше имя</span><input name="name" autocomplete="given-name" maxlength="60" value="${esc(form.name)}" placeholder="Например, Айгуль"></label>
        <label class="f-field"><span>Телефон или WhatsApp</span><div class="f-phone"><em>+996</em><input name="phone" inputmode="numeric" autocomplete="tel-national" maxlength="12" value="${esc(form.phone)}" placeholder="700 123 456"></div><small>9 цифр после +996</small></label>
        <input class="f-hp" name="wl_check" tabindex="-1" autocomplete="off" aria-hidden="true">
        <button class="f-send" type="submit">Записаться на бесплатный урок</button>
        <p class="f-consent">Нажимая кнопку, вы соглашаетесь, что Codify English свяжется с вами по этому номеру. Перезвоним в течение дня и подберём время. Видео на уроке снимаем только с вашего согласия.</p>
      </form>
      ${locked ? '' : '<button class="f-later" data-close>Позже</button>'}`;
    const f = card.querySelector('form');
    f.addEventListener('input', (e) => {
      const t = e.target;
      if (t.name === 'phone') { t.value = t.value.replace(/\D/g, '').slice(0, 9).replace(/(\d{3})(\d{0,3})(\d{0,3})/, (m, a, b, c) => [a, b, c].filter(Boolean).join(' ')); }
      if (t.name in form) form[t.name] = t.value;
      t.closest('.f-field, fieldset')?.classList.remove('bad');
    });
    f.addEventListener('change', (e) => { if (e.target.name in form) form[e.target.name] = e.target.value; e.target.closest('fieldset')?.classList.remove('bad'); });
    f.addEventListener('submit', submit);
  }

  function message(name, age, slot) {
    return `Здравствуйте! Хочу записать ребёнка на бесплатный открытый урок English Codify.\nИмя: ${name}\nВозраст ребёнка: ${age}\nКогда удобно: ${slot}\nAiCo Word Lab: ${progress.stamps()} штампов\nУроки 6–10 на любом телефоне: ${unlockUrl()}`;
  }
  const waLink = (t) => `https://wa.me/${FUNNEL.phoneWa}?text=${encodeURIComponent(t)}`;

  async function submit(e) {
    e.preventDefault();
    const f = e.target, digits = form.phone.replace(/\D/g, ''), name = form.name.trim().replace(/\s+/g, ' ');
    let first = null;
    const bad = (el) => { el.classList.add('bad'); first = first || el; };
    if (!form.age) bad(f.querySelector('fieldset'));
    if (!form.slot) bad(f.querySelectorAll('fieldset')[1]);
    if (name.length < 2) bad(f.querySelector('[name=name]').closest('.f-field'));
    if (!validPhone(digits)) bad(f.querySelector('[name=phone]').closest('.f-field'));
    if (first) { first.scrollIntoView({ block: 'center', behavior: 'smooth' }); first.querySelector('input')?.focus({ preventScroll: true }); return; }
    if (f.wl_check.value) return done(true, name, true); // бот заполнил скрытое поле
    const btn = f.querySelector('.f-send'); btn.disabled = true; btn.textContent = 'Отправляем…';
    const qs = new URLSearchParams(location.search);
    const utm = Object.fromEntries([...qs].filter(([k]) => k.startsWith('utm_')).slice(0, 10));
    let ok = false;
    try {
      const r = await fetch(FUNNEL.endpoint, {
        method: 'POST', keepalive: true, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ landing: FUNNEL.landing, name, phone: '+996' + digits, child: `${form.age} лет · ${form.slot} · Word Lab ${progress.stamps()} штампов`, utm, code: FUNNEL.code, website: '' }),
      });
      ok = r.ok;
    } catch { ok = false; }
    track(ok ? 'Lead' : 'LeadFallback', { content_name: 'wordlab', reason });
    done(ok, name);
  }

  function done(ok, name, bot = false) {
    const text = message(name, form.age + ' лет', form.slot);
    if (ok && !bot) {
      progress.setLead({ age: form.age, slot: form.slot, via: 'crm' });
      onUnlock();
    }
    card.innerHTML = `
      <button class="f-x" data-close aria-label="Закрыть">×</button>
      <div class="f-done">${img('love', 1)}
        <h2 id="fnH">${ok ? 'Заявка принята!' : 'Осталось отправить сообщение'}</h2>
        <p>${ok ? 'Перезвоним в течение дня и подберём время. Уроки 6–10 уже открыты — можно продолжать.' : 'Откройте WhatsApp и нажмите «Отправить» — текст заявки уже готов. После этого уроки 6–10 откроются.'}</p>
        ${ok ? `<p class="f-key">Открыть уроки 6–10 на другом телефоне: <a href="${unlockUrl()}">${unlockUrl().replace(/^https?:\/\//, '')}</a></p>` : ''}
        <a class="f-send f-wa" href="${waLink(text)}" target="_blank" rel="noopener" data-wa>${ok ? 'Написать в WhatsApp' : 'Отправить в WhatsApp'}</a>
        ${ok ? '<button class="f-go" data-continue>Продолжить опыты →</button>' : ''}
      </div>`;
    card.querySelector('[data-wa]').addEventListener('click', () => {
      track('Contact', { content_name: 'wordlab' });
      if (!progress.unlocked) { progress.setLead({ age: form.age, slot: form.slot, via: 'whatsapp' }); onUnlock(); setTimeout(() => {
        card.querySelector('.f-done p').textContent = 'Спасибо! Уроки 6–10 открыты — можно продолжать.';
        if (!card.querySelector('[data-continue]')) card.querySelector('.f-done').insertAdjacentHTML('beforeend', '<button class="f-go" data-continue>Продолжить опыты →</button>');
      }, 400); }
    });
  }

  root.addEventListener('click', (e) => {
    if (e.target.closest('[data-close]')) close();
    if (e.target.closest('[data-continue]')) { close(); api.onContinue?.(); }
  });
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && root.classList.contains('open')) close(); });

  function open(why = 'menu') {
    reason = why; view();
    root.classList.add('open');
    document.body.classList.add('funnel-open');
    card.scrollTop = 0; card.focus({ preventScroll: true });
    track('ParentView', { reason: why });
    if (why === 'lock') say?.('parent');
  }
  function close() { root.classList.remove('open'); document.body.classList.remove('funnel-open'); }
  const api = { open, close, get isOpen() { return root.classList.contains('open'); }, onContinue: null };
  return api;
}

export { LESSONS };
