export function generateId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function getWeekdayName(day) {
  const names = ['日', '一', '二', '三', '四', '五', '六'];
  return names[day] ?? day;
}

export function formatTime(time, hour12 = false) {
  if (!time) return '';
  const [hours24, minutes] = time.split(':').map(Number);
  if (hour12) {
    const period = hours24 >= 12 ? 'PM' : 'AM';
    const hours12 = hours24 % 12 || 12;
    return `${String(hours12).padStart(2, '0')}:${String(minutes).padStart(2, '0')} ${period}`;
  }
  return `${String(hours24).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

export function formatCurrentTime(date, hour12 = false) {
  return date.toLocaleTimeString('zh-CN', { hour12 });
}

export function getNextRingTimestamp(time, repeatDays) {
  const [hours, minutes] = time.split(':').map(Number);
  const now = new Date();
  let candidate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes, 0, 0);

  if (candidate <= now) {
    candidate.setDate(candidate.getDate() + 1);
  }

  if (!repeatDays || repeatDays.length === 0) {
    return candidate.getTime();
  }

  // 找到下一个符合重复条件的日期
  for (let i = 0; i < 8; i++) {
    if (repeatDays.includes(candidate.getDay())) {
      return candidate.getTime();
    }
    candidate.setDate(candidate.getDate() + 1);
  }

  return candidate.getTime();
}
