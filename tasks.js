'use strict';

// ---- 認証 ----
// パスワード変更方法: ブラウザコンソールで下記を実行してハッシュを取得し PASS_HASH を書き換える
//   crypto.subtle.digest('SHA-256', new TextEncoder().encode('新パスワード'))
//     .then(b => console.log([...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('')))
const PASS_HASH = '913cf236e06423f9d360265dcd21ba8f56f4123acf783f580b43509b093b14db';
const SESSION_KEY = 'mineyama_authed';

async function hashPassword(str) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
  return [...new Uint8Array(buf)].map(x => x.toString(16).padStart(2, '0')).join('');
}

function showMainContent() {
  document.getElementById('auth-gate').hidden = true;
  document.getElementById('main-content').hidden = false;
}

function checkAuth() {
  if (sessionStorage.getItem(SESSION_KEY) === '1') {
    showMainContent();
  } else {
    document.getElementById('auth-gate').hidden = false;
  }
}

document.getElementById('auth-form').addEventListener('submit', async e => {
  e.preventDefault();
  const input = document.getElementById('auth-password').value;
  const errorEl = document.getElementById('auth-error');
  const hash = await hashPassword(input);
  if (hash === PASS_HASH) {
    sessionStorage.setItem(SESSION_KEY, '1');
    showMainContent();
  } else {
    errorEl.hidden = false;
    document.getElementById('auth-password').value = '';
    document.getElementById('auth-password').focus();
  }
});

// ---- タスクデータ ----
const STORAGE_KEY = 'mineyama_tasks';

function loadTasks() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function saveTasks(tasks) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function isPastDue(dueDate) {
  if (!dueDate) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(dueDate) < today;
}

function isDueToday(dueDate) {
  if (!dueDate) return false;
  return dueDate === new Date().toISOString().split('T')[0];
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  return `${y}年${parseInt(m)}月${parseInt(d)}日`;
}

const STATUS_LABELS = { todo: '未着手', inprogress: '進行中', done: '完了' };
const PRIORITY_LABELS = { high: '高', medium: '中', low: '低' };

// ---- state ----
let currentFilter = 'all';
let editingId = null;

// ---- render ----
function renderTasks() {
  const tasks = loadTasks();
  updateCounts(tasks);

  const filtered = currentFilter === 'all'
    ? tasks
    : tasks.filter(t => t.status === currentFilter);

  const list = document.getElementById('tasks-list');
  const empty = document.getElementById('tasks-empty');

  if (filtered.length === 0) {
    list.innerHTML = '';
    empty.hidden = false;
    return;
  }

  empty.hidden = true;
  list.innerHTML = filtered.map(task => buildCardHtml(task)).join('');

  requestAnimationFrame(() => {
    list.querySelectorAll('.task-card').forEach(el => el.classList.add('visible'));
  });

  list.querySelectorAll('.task-btn-edit').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const task = loadTasks().find(t => t.id === btn.dataset.id);
      if (task) openModal(task);
    });
  });

  list.querySelectorAll('.task-btn-delete').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const updated = loadTasks().filter(t => t.id !== btn.dataset.id);
      saveTasks(updated);
      renderTasks();
    });
  });
}

function buildCardHtml(task) {
  const overdue = isPastDue(task.dueDate);
  const today = isDueToday(task.dueDate);
  const doneClass = task.status === 'done' ? ' task-card--done' : '';

  const dueHtml = task.dueDate
    ? `<span class="task-due${overdue ? ' task-due--overdue' : today ? ' task-due--today' : ''}">
        ${overdue ? '⚠ 期限切れ: ' : '期限: '}${formatDate(task.dueDate)}
       </span>`
    : '';

  const descHtml = task.description
    ? `<p class="task-card-desc">${escapeHtml(task.description)}</p>`
    : '';

  return `
    <article class="task-card${doneClass}" data-id="${task.id}">
      <div class="task-card-header">
        <h3 class="task-card-title">${escapeHtml(task.title)}</h3>
        <div class="task-card-actions">
          <button class="task-btn-edit" data-id="${task.id}" aria-label="編集">✎</button>
          <button class="task-btn-delete" data-id="${task.id}" aria-label="削除">✕</button>
        </div>
      </div>
      ${descHtml}
      <div class="task-card-meta">
        <span class="badge badge-status badge-status--${task.status}">${STATUS_LABELS[task.status] || task.status}</span>
        <span class="badge badge-priority badge-priority--${task.priority}">${PRIORITY_LABELS[task.priority] || task.priority}</span>
        <span class="badge badge-category">${escapeHtml(task.category)}</span>
        ${dueHtml}
      </div>
    </article>
  `;
}

function updateCounts(tasks) {
  document.getElementById('count-all').textContent = tasks.length;
  document.getElementById('count-todo').textContent = tasks.filter(t => t.status === 'todo').length;
  document.getElementById('count-inprogress').textContent = tasks.filter(t => t.status === 'inprogress').length;
  document.getElementById('count-done').textContent = tasks.filter(t => t.status === 'done').length;
}

// ---- modal ----
function openModal(task = null) {
  editingId = task ? task.id : null;

  document.getElementById('modal-title').textContent = task ? 'タスクを編集' : 'タスクを追加';
  document.getElementById('task-title').value = task ? task.title : '';
  document.getElementById('task-desc').value = task ? (task.description || '') : '';
  document.getElementById('task-status').value = task ? task.status : 'todo';
  document.getElementById('task-priority').value = task ? task.priority : 'medium';
  document.getElementById('task-category').value = task ? task.category : '稽古';
  document.getElementById('task-due').value = task ? (task.dueDate || '') : '';
  document.getElementById('title-error').hidden = true;

  const modal = document.getElementById('task-modal');
  modal.hidden = false;
  document.body.classList.add('modal-open');
  document.getElementById('task-title').focus();
}

function closeModal() {
  document.getElementById('task-modal').hidden = true;
  document.body.classList.remove('modal-open');
  editingId = null;
}

// ---- init ----
document.addEventListener('DOMContentLoaded', () => {
  checkAuth();
  renderTasks();

  // ヘッダースクロール
  window.addEventListener('scroll', () => {
    document.querySelector('.site-header').classList.toggle('scrolled', window.scrollY > 50);
  });

  // モバイルナビ
  const toggle = document.querySelector('.nav-toggle');
  const nav = document.querySelector('.site-nav');
  toggle.addEventListener('click', () => nav.classList.toggle('open'));

  // フィルタータブ
  document.querySelectorAll('.filter-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      currentFilter = tab.dataset.filter;
      document.querySelectorAll('.filter-tab').forEach(t => {
        t.classList.remove('active');
        t.setAttribute('aria-selected', 'false');
      });
      tab.classList.add('active');
      tab.setAttribute('aria-selected', 'true');
      renderTasks();
    });
  });

  // タスク追加ボタン
  document.getElementById('btn-add-task').addEventListener('click', () => openModal());

  // モーダルを閉じる
  document.getElementById('modal-close').addEventListener('click', closeModal);
  document.getElementById('modal-cancel').addEventListener('click', closeModal);
  document.getElementById('task-modal').addEventListener('click', e => {
    if (e.target === e.currentTarget) closeModal();
  });

  // Escape キー
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !document.getElementById('task-modal').hidden) closeModal();
  });

  // フォーム送信
  document.getElementById('task-form').addEventListener('submit', e => {
    e.preventDefault();

    const titleEl = document.getElementById('task-title');
    const titleError = document.getElementById('title-error');
    const title = titleEl.value.trim();

    if (!title) {
      titleError.hidden = false;
      titleEl.focus();
      return;
    }
    titleError.hidden = true;

    const data = {
      title,
      description: document.getElementById('task-desc').value.trim(),
      status: document.getElementById('task-status').value,
      priority: document.getElementById('task-priority').value,
      category: document.getElementById('task-category').value,
      dueDate: document.getElementById('task-due').value || null,
    };

    let tasks = loadTasks();
    if (editingId) {
      tasks = tasks.map(t => t.id === editingId ? { ...t, ...data } : t);
    } else {
      tasks = [...tasks, { ...data, id: generateId(), createdAt: new Date().toISOString() }];
    }

    saveTasks(tasks);
    closeModal();
    renderTasks();
  });
});
