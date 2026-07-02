let audioCtx = null;
let beepInterval = null;
let currentOscillator = null;
let currentGain = null;

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'playSound') {
    startBeeping();
    sendResponse({ ok: true });
  }

  if (message.type === 'stopSound') {
    stopBeeping();
    sendResponse({ ok: true });
  }
});

function startBeeping() {
  stopBeeping();

  try {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();

    const beep = () => {
      if (!audioCtx) return;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1000, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.5, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.2);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.2);
    };

    beep(); // 立即响一声
    beepInterval = setInterval(beep, 600); // 每 600ms 响一次

    // 30 秒后自动停止，避免误响
    setTimeout(() => stopBeeping(), 30_000);
  } catch (e) {
    console.error('提示音播放失败', e);
  }
}

function stopBeeping() {
  if (beepInterval) {
    clearInterval(beepInterval);
    beepInterval = null;
  }
  if (audioCtx) {
    audioCtx.close().catch(() => {});
    audioCtx = null;
  }
}
