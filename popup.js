import { generateId, getWeekdayName, formatTime, formatCurrentTime } from './utils.js';

const currentTimeEl = document.getElementById('current-time');
const alarmListEl = document.getElementById('alarm-list');
const emptyStateEl = document.getElementById('empty-state');
const editorEl = document.getElementById('editor');
const editorTitleEl = document.getElementById('editor-title');
const addAlarmBtn = document.getElementById('add-alarm');
const cancelEditBtn = document.getElementById('cancel-edit');
const saveAlarmBtn = document.getElementById('save-alarm');
const hourSelect = document.getElementById('hour-select');
const minuteSelect = document.getElementById('minute-select');
const ampmSelect = document.getElementById('ampm-select');
const labelInput = document.getElementById('alarm-label');
const weekdaysEl = document.getElementById('weekdays');
const timeFormatEl = document.getElementById('time-format');

let editingId = null;
let selectedDays = new Set();
let settings = { hour12: false };

// 加载设置
async function loadSettings() {
  const stored = await chrome.storage.local.get('settings');
  settings = { hour12: false, ...stored.settings };
  updateFormatButtons();
  populateTimePicker();
}

function updateFormatButtons() {
  timeFormatEl.querySelectorAll('button').forEach((btn) => {
    const isActive = (btn.dataset.format === '12') === settings.hour12;
    btn.classList.toggle('active', isActive);
  });
}

timeFormatEl.querySelectorAll('button').forEach((btn) => {
  btn.addEventListener('click', async () => {
    const newHour12 = btn.dataset.format === '12';
    if (newHour12 === settings.hour12) return;

    const current24 = getTimeFromPicker();
    settings.hour12 = newHour12;
    await chrome.storage.local.set({ settings });
    updateFormatButtons();
    populateTimePicker();
    if (current24) setTimeToPicker(current24);
    updateClock();
    const { alarms = [] } = await chrome.storage.local.get('alarms');
    renderAlarms(alarms);
  });
});

// 时钟刷新
function updateClock() {
  currentTimeEl.textContent = formatCurrentTime(new Date(), settings.hour12);
}
setInterval(updateClock, 1000);
updateClock();

// 时间选择器
function populateTimePicker() {
  const previousHour = hourSelect.value;
  const previousMinute = minuteSelect.value;
  const previousAmpm = ampmSelect.value;

  hourSelect.innerHTML = '';
  minuteSelect.innerHTML = '';
  ampmSelect.innerHTML = '';

  if (settings.hour12) {
    for (let h = 1; h <= 12; h++) {
      const option = document.createElement('option');
      option.value = h;
      option.textContent = String(h).padStart(2, '0');
      hourSelect.appendChild(option);
    }
    ['AM', 'PM'].forEach((p) => {
      const option = document.createElement('option');
      option.value = p;
      option.textContent = p;
      ampmSelect.appendChild(option);
    });
    ampmSelect.classList.remove('hidden');
  } else {
    for (let h = 0; h < 24; h++) {
      const option = document.createElement('option');
      option.value = h;
      option.textContent = String(h).padStart(2, '0');
      hourSelect.appendChild(option);
    }
    ampmSelect.classList.add('hidden');
  }

  for (let m = 0; m < 60; m++) {
    const option = document.createElement('option');
    option.value = m;
    option.textContent = String(m).padStart(2, '0');
    minuteSelect.appendChild(option);
  }

  // 尽量保留之前的时间
  if (previousHour) hourSelect.value = previousHour;
  if (previousMinute) minuteSelect.value = previousMinute;
  if (previousAmpm) ampmSelect.value = previousAmpm;
}

// 从选择器获取 24 小时制时间字符串 HH:MM
function getTimeFromPicker() {
  let hour = parseInt(hourSelect.value, 10);
  const minute = parseInt(minuteSelect.value, 10);
  if (Number.isNaN(hour) || Number.isNaN(minute)) return null;

  if (settings.hour12) {
    const ampm = ampmSelect.value;
    if (ampm === 'AM') {
      hour = hour === 12 ? 0 : hour;
    } else {
      hour = hour === 12 ? 12 : hour + 12;
    }
  }

  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

// 将 24 小时制时间字符串设置到选择器
function setTimeToPicker(time24) {
  if (!time24) return;
  const [hour24, minute] = time24.split(':').map(Number);

  if (settings.hour12) {
    const ampm = hour24 >= 12 ? 'PM' : 'AM';
    const hour12 = hour24 % 12 || 12;
    hourSelect.value = hour12;
    ampmSelect.value = ampm;
  } else {
    hourSelect.value = hour24;
  }
  minuteSelect.value = minute;
}

// 星期选择
weekdaysEl.querySelectorAll('button').forEach((btn) => {
  btn.addEventListener('click', () => {
    const day = parseInt(btn.dataset.day, 10);
    if (selectedDays.has(day)) {
      selectedDays.delete(day);
      btn.classList.remove('active');
    } else {
      selectedDays.add(day);
      btn.classList.add('active');
    }
  });
});

// 打开/关闭编辑器
function openEditor(alarm = null) {
  editorEl.classList.remove('hidden');
  if (alarm) {
    editingId = alarm.id;
    editorTitleEl.textContent = '编辑闹钟';
    setTimeToPicker(alarm.time);
    labelInput.value = alarm.label || '';
    selectedDays = new Set(alarm.repeat || []);
  } else {
    editingId = null;
    editorTitleEl.textContent = '添加闹钟';
    const now = new Date();
    setTimeToPicker(`${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`);
    labelInput.value = '';
    selectedDays = new Set();
  }
  renderWeekdayButtons();
  hourSelect.focus();
}

function closeEditor() {
  editorEl.classList.add('hidden');
  editingId = null;
}

function renderWeekdayButtons() {
  weekdaysEl.querySelectorAll('button').forEach((btn) => {
    const day = parseInt(btn.dataset.day, 10);
    btn.classList.toggle('active', selectedDays.has(day));
  });
}

addAlarmBtn.addEventListener('click', () => openEditor());
cancelEditBtn.addEventListener('click', () => closeEditor());

saveAlarmBtn.addEventListener('click', async () => {
  const time = getTimeFromPicker();
  if (!time) {
    showToast('请选择时间');
    return;
  }

  const alarm = {
    id: editingId || generateId(),
    time,
    label: labelInput.value.trim() || '闹钟',
    repeat: Array.from(selectedDays).sort((a, b) => a - b),
    enabled: true,
  };

  const { alarms = [] } = await chrome.storage.local.get('alarms');
  let updated;
  if (editingId) {
    updated = alarms.map((a) => (a.id === editingId ? alarm : a));
  } else {
    updated = [...alarms, alarm];
  }

  await chrome.storage.local.set({ alarms: updated });
  await chrome.runtime.sendMessage({ type: 'scheduleAlarms' });
  closeEditor();
  renderAlarms(updated);
});

function renderAlarms(alarms) {
  alarmListEl.innerHTML = '';
  if (alarms.length === 0) {
    emptyStateEl.classList.remove('hidden');
    return;
  }
  emptyStateEl.classList.add('hidden');

  alarms.sort((a, b) => a.time.localeCompare(b.time));

  for (const alarm of alarms) {
    const li = document.createElement('li');
    li.className = `alarm-item ${alarm.enabled ? '' : 'disabled'}`;
    li.innerHTML = `
      <div class="alarm-info">
        <div class="alarm-time">${formatTime(alarm.time, settings.hour12)}</div>
        <div class="alarm-meta">${alarm.label} · ${formatRepeat(alarm.repeat)}</div>
      </div>
      <div class="alarm-actions">
        <label class="switch" title="开启/关闭">
          <input type="checkbox" data-id="${alarm.id}" ${alarm.enabled ? 'checked' : ''}>
          <span class="slider"></span>
        </label>
        <button class="icon-btn edit" data-id="${alarm.id}" title="编辑">✎</button>
        <button class="icon-btn delete" data-id="${alarm.id}" title="删除">🗑</button>
      </div>
    `;
    alarmListEl.appendChild(li);
  }

  bindAlarmActions();
}

function formatRepeat(days) {
  if (!days || days.length === 0) return '仅一次';
  if (days.length === 7) return '每天';
  if (days.length === 5 && days.every((d, i) => d === [1, 2, 3, 4, 5][i])) return '工作日';
  if (days.length === 2 && days.every((d, i) => d === [0, 6][i])) return '周末';
  return days.map((d) => getWeekdayName(d)).join(' ');
}

function bindAlarmActions() {
  alarmListEl.querySelectorAll('input[type="checkbox"]').forEach((cb) => {
    cb.addEventListener('change', async () => {
      const id = cb.dataset.id;
      const { alarms = [] } = await chrome.storage.local.get('alarms');
      const updated = alarms.map((a) => (a.id === id ? { ...a, enabled: cb.checked } : a));
      await chrome.storage.local.set({ alarms: updated });
      await chrome.runtime.sendMessage({ type: 'scheduleAlarms' });
      renderAlarms(updated);
    });
  });

  alarmListEl.querySelectorAll('.icon-btn.edit').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const { alarms = [] } = await chrome.storage.local.get('alarms');
      const alarm = alarms.find((a) => a.id === btn.dataset.id);
      if (alarm) openEditor(alarm);
    });
  });

  alarmListEl.querySelectorAll('.icon-btn.delete').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const id = btn.dataset.id;
      const { alarms = [] } = await chrome.storage.local.get('alarms');
      const updated = alarms.filter((a) => a.id !== id);
      await chrome.storage.local.set({ alarms: updated });
      await chrome.runtime.sendMessage({ type: 'scheduleAlarms' });
      renderAlarms(updated);
    });
  });
}

function showToast(message) {
  const toast = document.createElement('div');
  toast.className = 'error-toast';
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2000);
}

async function init() {
  await loadSettings();
  const { alarms = [] } = await chrome.storage.local.get('alarms');
  renderAlarms(alarms);
}

init();
