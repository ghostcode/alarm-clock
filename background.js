import { getNextRingTimestamp } from './utils.js';

const ALARM_PREFIX = 'alarm-';

// 安装、启动或唤醒时重新调度所有闹钟
chrome.runtime.onStartup.addListener(() => scheduleAlarms());
chrome.runtime.onInstalled.addListener(() => scheduleAlarms());

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name.startsWith(ALARM_PREFIX)) {
    const alarmId = alarm.name.slice(ALARM_PREFIX.length);
    await handleAlarmTrigger(alarmId);
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'scheduleAlarms') {
    scheduleAlarms().then(() => sendResponse({ ok: true })).catch((e) => sendResponse({ ok: false, error: e.message }));
    return true;
  }
  if (message.type === 'stopSound') {
    stopSound();
    sendResponse({ ok: true });
  }
});

async function scheduleAlarms() {
  const { alarms = [] } = await chrome.storage.local.get('alarms');

  // 清除所有旧闹钟
  const allAlarms = await chrome.alarms.getAll();
  for (const a of allAlarms) {
    if (a.name.startsWith(ALARM_PREFIX)) {
      await chrome.alarms.clear(a.name);
    }
  }

  const now = Date.now();
  const updated = [];

  for (const alarm of alarms) {
    let nextRing = null;
    if (alarm.enabled) {
      nextRing = getNextRingTimestamp(alarm.time, alarm.repeat);
      // 只调度未来的闹钟（容错：若已过期几秒仍允许触发）
      if (nextRing > now - 60_000) {
        await chrome.alarms.create(`${ALARM_PREFIX}${alarm.id}`, {
          when: Math.max(nextRing, now + 500),
        });
      }
    }
    updated.push({ ...alarm, nextRing });
  }

  await chrome.storage.local.set({ alarms: updated });
}

async function handleAlarmTrigger(alarmId) {
  const { alarms = [] } = await chrome.storage.local.get('alarms');
  const alarm = alarms.find((a) => a.id === alarmId);
  if (!alarm || !alarm.enabled) return;

  await ringAlarm(alarm);

  if (!alarm.repeat || alarm.repeat.length === 0) {
    const updated = alarms.map((a) => (a.id === alarmId ? { ...a, enabled: false } : a));
    await chrome.storage.local.set({ alarms: updated });
  }

  // 重新调度（一次性闹钟已被禁用，会自动被清除；重复闹钟安排下一次）
  await scheduleAlarms();
}

async function ringAlarm(alarm) {
  // 显示系统通知（右下角弹窗）
  try {
    await chrome.notifications.create(`alarm-${alarm.id}-${Date.now()}`, {
      type: 'basic',
      iconUrl: chrome.runtime.getURL('icons/icon128.png'),
      title: '闹钟响了',
      message: alarm.label || '闹钟时间到了',
      priority: 2,
      requireInteraction: true,
      buttons: [{ title: '停止响铃' }],
    });
  } catch (e) {
    console.error('创建通知失败', e);
  }

  // 播放提示音
  await playSound();
}

async function playSound() {
  if (typeof chrome.offscreen === 'undefined') {
    console.warn('当前 Chrome 版本不支持 Offscreen API，无法后台播放提示音');
    return;
  }
  try {
    await ensureOffscreen();
    await chrome.runtime.sendMessage({ type: 'playSound' });
  } catch (e) {
    console.error('播放提示音失败', e);
  }
}

function stopSound() {
  if (typeof chrome.offscreen === 'undefined') return;
  chrome.runtime.sendMessage({ type: 'stopSound' }).catch(() => {});
}

async function ensureOffscreen() {
  if (await hasOffscreen()) return;
  await chrome.offscreen.createDocument({
    url: 'offscreen.html',
    reasons: ['AUDIO_PLAYBACK'],
    justification: '播放闹钟提示音',
  });
}

async function hasOffscreen() {
  if (typeof chrome.runtime.getContexts === 'undefined') return false;
  const contexts = await chrome.runtime.getContexts({
    contextTypes: ['OFFSCREEN_DOC'],
    documentUrls: [chrome.runtime.getURL('offscreen.html')],
  });
  return contexts.length > 0;
}

// 点击通知停止响铃
chrome.notifications.onButtonClicked.addListener(() => stopSound());
chrome.notifications.onClicked.addListener(() => stopSound());
chrome.notifications.onClosed.addListener(() => stopSound());
