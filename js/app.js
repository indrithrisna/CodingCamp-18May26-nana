'use strict';

const store = {
  get: (key, fallback = null) => {
    try {
      const val = localStorage.getItem(key);
      return val !== null ? JSON.parse(val) : fallback;
    } catch { return fallback; }
  },
  set: (key, value) => {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
  }
};

const greetingText = document.getElementById('greeting-text');
const greetingName = document.getElementById('greeting-name');
const datetimeText = document.getElementById('datetime-text');

function getGreeting(hour) {
  if (hour < 12) return 'Good morning,';
  if (hour < 17) return 'Good afternoon,';
  if (hour < 21) return 'Good evening,';
  return 'Good night,';
}

function updateClock() {
  const now = new Date();
  const hour = now.getHours();

  greetingText.textContent = getGreeting(hour);

  const name = store.get('userName', 'Friend');
  greetingName.textContent = name;

  const dateOpts = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  const timeOpts = { hour: '2-digit', minute: '2-digit', second: '2-digit' };
  datetimeText.textContent =
    now.toLocaleDateString(undefined, dateOpts) + ' · ' +
    now.toLocaleTimeString(undefined, timeOpts);
}

updateClock();
setInterval(updateClock, 1000);

/* ─────────────────────────────────────────────
   CUSTOM NAME MODAL
───────────────────────────────────────────── */
const modalName    = document.getElementById('modal-name');
const inputName    = document.getElementById('input-name');
const btnName      = document.getElementById('btn-name');
const btnNameSave  = document.getElementById('btn-name-save');
const btnNameCancel = document.getElementById('btn-name-cancel');

btnName.addEventListener('click', () => {
  inputName.value = store.get('userName', '');
  modalName.classList.remove('hidden');
  inputName.focus();
});

btnNameSave.addEventListener('click', saveName);
inputName.addEventListener('keydown', e => { if (e.key === 'Enter') saveName(); });

function saveName() {
  const val = inputName.value.trim();
  if (val) {
    store.set('userName', val);
    updateClock();
  }
  modalName.classList.add('hidden');
}

btnNameCancel.addEventListener('click', () => modalName.classList.add('hidden'));
modalName.addEventListener('click', e => { if (e.target === modalName) modalName.classList.add('hidden'); });

const btnTheme = document.getElementById('btn-theme');
const html     = document.documentElement;

function applyTheme(theme) {
  html.setAttribute('data-theme', theme);
  btnTheme.textContent = theme === 'dark' ? '☀️' : '🌙';
  store.set('theme', theme);
}

applyTheme(store.get('theme', 'light'));

btnTheme.addEventListener('click', () => {
  const current = html.getAttribute('data-theme');
  applyTheme(current === 'dark' ? 'light' : 'dark');
});

const timerDisplay  = document.getElementById('timer-display');
const timerMinutes  = document.getElementById('timer-minutes');
const timerStatus   = document.getElementById('timer-status');
const btnStart      = document.getElementById('btn-start');
const btnStop       = document.getElementById('btn-stop');
const btnReset      = document.getElementById('btn-reset');

let timerInterval = null;
let timeLeft      = 0;
let timerRunning  = false;

function formatTime(seconds) {
  const m = String(Math.floor(seconds / 60)).padStart(2, '0');
  const s = String(seconds % 60).padStart(2, '0');
  return `${m}:${s}`;
}

function getTimerSeconds() {
  const mins = parseInt(timerMinutes.value, 10);
  return (isNaN(mins) || mins < 1) ? 25 * 60 : mins * 60;
}

function resetTimer() {
  clearInterval(timerInterval);
  timerRunning = false;
  timeLeft = getTimerSeconds();
  timerDisplay.textContent = formatTime(timeLeft);
  timerStatus.textContent = '';
  btnStart.disabled = false;
}


timeLeft = getTimerSeconds();
timerDisplay.textContent = formatTime(timeLeft);

timerMinutes.addEventListener('change', () => {
  if (!timerRunning) resetTimer();
});

btnStart.addEventListener('click', () => {
  if (timerRunning) return;
  if (timeLeft <= 0) timeLeft = getTimerSeconds();
  timerRunning = true;
  btnStart.disabled = true;
  timerStatus.textContent = '🍅 Focus session in progress…';

  timerInterval = setInterval(() => {
    timeLeft--;
    timerDisplay.textContent = formatTime(timeLeft);
    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      timerRunning = false;
      timerStatus.textContent = '🎉 Session complete! Take a break.';
      btnStart.disabled = false;
    }
  }, 1000);
});

btnStop.addEventListener('click', () => {
  if (!timerRunning) return;
  clearInterval(timerInterval);
  timerRunning = false;
  btnStart.disabled = false;
  timerStatus.textContent = '⏸ Paused.';
});

btnReset.addEventListener('click', resetTimer);

const inputTask        = document.getElementById('input-task');
const btnAddTask       = document.getElementById('btn-add-task');
const taskListEl       = document.getElementById('task-list');
const taskEmpty        = document.getElementById('task-empty');
const duplicateWarning = document.getElementById('duplicate-warning');
const sortSelect       = document.getElementById('sort-select');
const filterBtns       = document.querySelectorAll('.btn--filter');

let tasks       = store.get('tasks', []);
let activeFilter = 'all';

function saveTasks() { store.set('tasks', tasks); }

function isDuplicate(text) {
  return tasks.some(t => t.text.toLowerCase() === text.toLowerCase());
}

function addTask() {
  const text = inputTask.value.trim();
  if (!text) return;

  if (isDuplicate(text)) {
    duplicateWarning.classList.remove('hidden');
    setTimeout(() => duplicateWarning.classList.add('hidden'), 2500);
    return;
  }

  duplicateWarning.classList.add('hidden');
  tasks.push({ id: Date.now(), text, done: false, createdAt: Date.now() });
  saveTasks();
  renderTasks();
  inputTask.value = '';
  inputTask.focus();
}

btnAddTask.addEventListener('click', addTask);
inputTask.addEventListener('keydown', e => { if (e.key === 'Enter') addTask(); });

filterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    filterBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    activeFilter = btn.dataset.filter;
    renderTasks();
  });
});

sortSelect.addEventListener('change', renderTasks);

function getSortedFiltered() {
  let list = [...tasks];

  
  if (activeFilter === 'active') list = list.filter(t => !t.done);
  if (activeFilter === 'done')   list = list.filter(t => t.done);

  const sort = sortSelect.value;
  if (sort === 'newest') list.sort((a, b) => b.createdAt - a.createdAt);
  if (sort === 'oldest') list.sort((a, b) => a.createdAt - b.createdAt);
  if (sort === 'az')     list.sort((a, b) => a.text.localeCompare(b.text));
  if (sort === 'za')     list.sort((a, b) => b.text.localeCompare(a.text));

  return list;
}

function renderTasks() {
  const list = getSortedFiltered();
  taskListEl.innerHTML = '';

  if (list.length === 0) {
    taskEmpty.classList.remove('hidden');
    return;
  }
  taskEmpty.classList.add('hidden');

  list.forEach(task => {
    const li = document.createElement('li');
    li.className = `task-item${task.done ? ' done' : ''}`;
    li.dataset.id = task.id;

    li.innerHTML = `
      <input type="checkbox" ${task.done ? 'checked' : ''} aria-label="Mark done" />
      <span class="task-item__text">${escapeHtml(task.text)}</span>
      <div class="task-item__actions">
        <button class="btn btn--edit" title="Edit">✏️</button>
        <button class="btn btn--danger" title="Delete">🗑️</button>
      </div>
    `;

  
    li.querySelector('input[type="checkbox"]').addEventListener('change', () => {
      const t = tasks.find(t => t.id === task.id);
      if (t) { t.done = !t.done; saveTasks(); renderTasks(); }
    });

    li.querySelector('.btn--edit').addEventListener('click', () => openEditModal(task.id));
    li.querySelector('.btn--danger').addEventListener('click', () => {
      tasks = tasks.filter(t => t.id !== task.id);
      saveTasks();
      renderTasks();
    });

    taskListEl.appendChild(li);
  });
}

renderTasks();

const modalEdit      = document.getElementById('modal-edit');
const inputEditTask  = document.getElementById('input-edit-task');
const btnEditSave    = document.getElementById('btn-edit-save');
const btnEditCancel  = document.getElementById('btn-edit-cancel');
let editingTaskId    = null;

function openEditModal(id) {
  const task = tasks.find(t => t.id === id);
  if (!task) return;
  editingTaskId = id;
  inputEditTask.value = task.text;
  modalEdit.classList.remove('hidden');
  inputEditTask.focus();
}

function saveEdit() {
  const newText = inputEditTask.value.trim();
  if (!newText) return;

  const duplicate = tasks.some(t => t.id !== editingTaskId && t.text.toLowerCase() === newText.toLowerCase());
  if (duplicate) {
    inputEditTask.style.borderColor = 'var(--danger)';
    setTimeout(() => inputEditTask.style.borderColor = '', 1500);
    return;
  }

  const task = tasks.find(t => t.id === editingTaskId);
  if (task) { task.text = newText; saveTasks(); renderTasks(); }
  modalEdit.classList.add('hidden');
  editingTaskId = null;
}

btnEditSave.addEventListener('click', saveEdit);
inputEditTask.addEventListener('keydown', e => { if (e.key === 'Enter') saveEdit(); });
btnEditCancel.addEventListener('click', () => { modalEdit.classList.add('hidden'); editingTaskId = null; });
modalEdit.addEventListener('click', e => { if (e.target === modalEdit) { modalEdit.classList.add('hidden'); editingTaskId = null; } });

const inputLinkName = document.getElementById('input-link-name');
const inputLinkUrl  = document.getElementById('input-link-url');
const btnAddLink    = document.getElementById('btn-add-link');
const linkListEl    = document.getElementById('link-list');
const linkEmpty     = document.getElementById('link-empty');

let links = store.get('links', []);

function saveLinks() { store.set('links', links); }

function normalizeUrl(url) {
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return 'https://' + url;
  }
  return url;
}

function addLink() {
  const name = inputLinkName.value.trim();
  const url  = inputLinkUrl.value.trim();
  if (!name || !url) return;

  links.push({ id: Date.now(), name, url: normalizeUrl(url) });
  saveLinks();
  renderLinks();
  inputLinkName.value = '';
  inputLinkUrl.value  = '';
  inputLinkName.focus();
}

btnAddLink.addEventListener('click', addLink);
inputLinkUrl.addEventListener('keydown', e => { if (e.key === 'Enter') addLink(); });

function renderLinks() {
  linkListEl.innerHTML = '';

  if (links.length === 0) {
    linkEmpty.classList.remove('hidden');
    return;
  }
  linkEmpty.classList.add('hidden');

  links.forEach(link => {
    const div = document.createElement('div');
    div.className = 'link-item';

    div.innerHTML = `
      <a href="${escapeHtml(link.url)}" target="_blank" rel="noopener noreferrer">
        🔗 ${escapeHtml(link.name)}
      </a>
      <button class="btn btn--danger" title="Remove">🗑️</button>
    `;

    div.querySelector('.btn--danger').addEventListener('click', () => {
      links = links.filter(l => l.id !== link.id);
      saveLinks();
      renderLinks();
    });

    linkListEl.appendChild(div);
  });
}

renderLinks();

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
