// ==========================================
// 定数 & ストレージキー
// ==========================================
const PIN_KEY = 'stretch_pin';
const REMEMBER_KEY = 'stretch_auth_remembered';
const DATES_KEY = 'stretch_completed_dates';
const DEFAULT_PIN = '1234';
const VIDEO_PATH = 'stretch3.mp4';

// ==========================================
// DOM要素の取得
// ==========================================
// ロック画面
const lockScreen = document.getElementById('lock-screen');
const dotsContainer = document.getElementById('passcode-dots');
const dots = dotsContainer.querySelectorAll('.dot');
const lockErrorMsg = document.getElementById('lock-error-msg');
const keypad = document.querySelector('.keypad');
const btnClear = document.getElementById('btn-clear');
const btnDelete = document.getElementById('btn-delete');
const chkRemember = document.getElementById('chk-remember');

// メインアプリ & 動画
const appMain = document.getElementById('app-main');
const videoWrapper = document.getElementById('video-wrapper');
const video = document.getElementById('training-video');
const videoOverlay = document.getElementById('video-overlay');
const btnPlayPause = document.getElementById('btn-play-pause');
const iconPlay = document.getElementById('icon-play');
const iconPause = document.getElementById('icon-pause');
const btnRotate = document.getElementById('btn-rotate');
const btnOpenCalendar = document.getElementById('btn-open-calendar');
const progressContainer = document.getElementById('progress-container');
const progressFill = document.getElementById('progress-fill');
const timeDisplay = document.getElementById('time-display');

// カレンダーオーバーレイ
const calendarOverlay = document.getElementById('calendar-overlay');
const calendarCard = document.getElementById('calendar-card');
const btnCloseCalendar = document.getElementById('btn-close-calendar');
const btnCloseCalendarBottom = document.getElementById('btn-close-calendar-bottom');
const btnPrevMonth = document.getElementById('btn-prev-month');
const btnNextMonth = document.getElementById('btn-next-month');
const calendarMonthTitle = document.getElementById('calendar-month-title');
const daysGrid = document.getElementById('days-grid');
const monthCompletedBadge = document.getElementById('month-completed-badge');

// 達成ダイアログ
const completionDialog = document.getElementById('completion-dialog');
const btnDialogCalendar = document.getElementById('btn-dialog-calendar');
const btnDialogClose = document.getElementById('btn-dialog-close');

// 設定ダイアログ
const settingsDialog = document.getElementById('settings-dialog');
const btnOpenSettings = document.getElementById('btn-open-settings');
const btnCloseSettings = document.getElementById('btn-close-settings');
const inputNewPin = document.getElementById('input-new-pin');
const btnSavePin = document.getElementById('btn-save-pin');
const btnLogout = document.getElementById('btn-logout');
const pinChangeMsg = document.getElementById('pin-change-msg');

// ==========================================
// 状態管理
// ==========================================
let enteredPin = '';
let currentViewDate = new Date();
let overlayTimer = null;
let isLandscapeMode = false;

// ==========================================
// 1. パスコード認証ロジック
// ==========================================
function getStoredPin() {
  return localStorage.getItem(PIN_KEY) || DEFAULT_PIN;
}

function updateDots() {
  dots.forEach((dot, index) => {
    if (index < enteredPin.length) {
      dot.classList.add('filled');
    } else {
      dot.classList.remove('filled');
    }
  });
}

function handleKeyInput(key) {
  if (enteredPin.length < 4) {
    enteredPin += key;
    updateDots();
    lockErrorMsg.textContent = '';
    
    if (enteredPin.length === 4) {
      setTimeout(verifyPin, 150);
    }
  }
}

function verifyPin() {
  const correctPin = getStoredPin();
  if (enteredPin === correctPin) {
    // 認証成功
    if (chkRemember.checked) {
      localStorage.setItem(REMEMBER_KEY, 'true');
    }
    unlockApp();
  } else {
    // 認証失敗
    lockErrorMsg.textContent = 'パスコードが正しくありません';
    dotsContainer.style.animation = 'shake 0.3s';
    setTimeout(() => {
      dotsContainer.style.animation = '';
      enteredPin = '';
      updateDots();
    }, 350);
  }
}

function unlockApp() {
  lockScreen.classList.add('hidden');
  appMain.classList.remove('hidden');
  // 認証後に動画ソースを設定
  if (!video.src || video.src === '') {
    video.src = VIDEO_PATH;
    video.load();
  }
}

// テンキーイベント
keypad.addEventListener('click', (e) => {
  const btn = e.target.closest('.key-btn');
  if (!btn) return;
  
  const key = btn.dataset.key;
  if (key !== undefined) {
    handleKeyInput(key);
  }
});

btnClear.addEventListener('click', () => {
  enteredPin = '';
  updateDots();
  lockErrorMsg.textContent = '';
});

btnDelete.addEventListener('click', () => {
  if (enteredPin.length > 0) {
    enteredPin = enteredPin.slice(0, -1);
    updateDots();
    lockErrorMsg.textContent = '';
  }
});

// キーボード入力サポート（PC用）
window.addEventListener('keydown', (e) => {
  if (!lockScreen.classList.contains('hidden')) {
    if (e.key >= '0' && e.key <= '9') {
      handleKeyInput(e.key);
    } else if (e.key === 'Backspace') {
      btnDelete.click();
    } else if (e.key === 'Escape') {
      btnClear.click();
    }
  }
});

// ==========================================
// 2. 動画再生 & 操作コントロール
// ==========================================
function togglePlay() {
  if (video.paused || video.ended) {
    if (video.ended) {
      video.currentTime = 0;
    }
    video.play().catch(() => {});
  } else {
    video.pause();
  }
}

btnPlayPause.addEventListener('click', (e) => {
  e.stopPropagation();
  togglePlay();
});

video.addEventListener('play', () => {
  iconPlay.classList.add('hidden');
  iconPause.classList.remove('hidden');
  startOverlayFadeTimer();
});

video.addEventListener('pause', () => {
  iconPlay.classList.remove('hidden');
  iconPause.classList.add('hidden');
  showOverlay();
});

function showOverlay() {
  videoOverlay.classList.remove('fade-out');
  clearTimeout(overlayTimer);
}

function startOverlayFadeTimer() {
  clearTimeout(overlayTimer);
  if (!video.paused) {
    overlayTimer = setTimeout(() => {
      videoOverlay.classList.add('fade-out');
    }, 3500);
  }
}

// 動画画面タップでコントロール表示切り替え
videoWrapper.addEventListener('click', (e) => {
  if (e.target.closest('.icon-btn') || e.target.closest('.big-play-btn') || e.target.closest('.progress-bar-container')) {
    return;
  }
  if (videoOverlay.classList.contains('fade-out')) {
    showOverlay();
    startOverlayFadeTimer();
  } else {
    videoOverlay.classList.add('fade-out');
  }
});

// プログレスバー & 時間更新
video.addEventListener('timeupdate', () => {
  if (video.duration) {
    const pct = (video.currentTime / video.duration) * 100;
    progressFill.style.width = `${pct}%`;
    timeDisplay.textContent = `${formatTime(video.currentTime)} / ${formatTime(video.duration)}`;
  }
});

progressContainer.addEventListener('click', (e) => {
  e.stopPropagation();
  const rect = progressContainer.getBoundingClientRect();
  const pos = (e.clientX - rect.left) / rect.width;
  if (video.duration) {
    video.currentTime = pos * video.duration;
  }
});

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

// 縦横切り替え機能（要件: ワンボタンで切り替え）
btnRotate.addEventListener('click', (e) => {
  e.stopPropagation();
  isLandscapeMode = !isLandscapeMode;

  // 1. Screen Orientation API の試行 (Android Chrome 等)
  if (screen.orientation && screen.orientation.lock) {
    if (isLandscapeMode) {
      screen.orientation.lock('landscape').catch(() => {});
    } else {
      screen.orientation.lock('portrait').catch(() => {
        screen.orientation.unlock().catch(() => {});
      });
    }
  }

  // 2. iOS Safari や非対応環境向けに CSS 90度回転トグル
  videoWrapper.classList.toggle('forced-landscape', isLandscapeMode);
});

// 動画終了イベント（要件: 最後まで再生した場合、その日のトレーニング完了が記録される）
video.addEventListener('ended', () => {
  recordCompletionToday();
  showCompletionDialog();
});

// ==========================================
// 3. トレーニング履歴（データ永続化）
// ==========================================
function getCompletedDates() {
  try {
    const data = localStorage.getItem(DATES_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
}

function recordCompletionToday() {
  const todayStr = getTodayString();
  const list = getCompletedDates();
  if (!list.includes(todayStr)) {
    list.push(todayStr);
    localStorage.setItem(DATES_KEY, JSON.stringify(list));
  }
}

function getTodayString() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// ==========================================
// 4. カレンダー画面の描画 & ナビゲーション
// ==========================================
function renderCalendar(year, month) {
  calendarMonthTitle.textContent = `${year}年 ${month + 1}月`;
  daysGrid.innerHTML = '';

  const completedDates = getCompletedDates();
  const todayStr = getTodayString();

  // 月の初日の曜日 & 月の総日数
  const firstDay = new Date(year, month, 1).getDay(); // 0=日
  const totalDays = new Date(year, month + 1, 0).getDate();

  // 空白セル
  for (let i = 0; i < firstDay; i++) {
    const emptyCell = document.createElement('div');
    emptyCell.className = 'day-cell empty';
    daysGrid.appendChild(emptyCell);
  }

  let completedThisMonth = 0;

  // 日付セル
  for (let day = 1; day <= totalDays; day++) {
    const dayStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const isCompleted = completedDates.includes(dayStr);
    const isToday = (dayStr === todayStr);
    const dayOfWeek = (firstDay + day - 1) % 7;

    const cell = document.createElement('div');
    cell.className = 'day-cell';
    if (dayOfWeek === 0) cell.classList.add('sunday');
    if (dayOfWeek === 6) cell.classList.add('saturday');
    if (isToday) cell.classList.add('today');
    if (isCompleted) {
      cell.classList.add('completed');
      completedThisMonth++;
    }

    cell.innerHTML = `<span>${day}</span>${isCompleted ? '<span class="stamp-mark">💮</span>' : ''}`;
    daysGrid.appendChild(cell);
  }

  monthCompletedBadge.textContent = `${completedThisMonth}日 完了`;
}

// カレンダー開閉（要件: ワンタップで非表示にできる）
function openCalendar() {
  currentViewDate = new Date();
  renderCalendar(currentViewDate.getFullYear(), currentViewDate.getMonth());
  calendarOverlay.classList.remove('hidden');
}

function closeCalendar() {
  calendarOverlay.classList.add('hidden');
}

btnOpenCalendar.addEventListener('click', (e) => {
  e.stopPropagation();
  openCalendar();
});

btnCloseCalendar.addEventListener('click', closeCalendar);
btnCloseCalendarBottom.addEventListener('click', closeCalendar);

// カレンダー外側タップで閉じる
calendarOverlay.addEventListener('click', (e) => {
  if (e.target === calendarOverlay) {
    closeCalendar();
  }
});

// 前月・次月ナビゲーション（要件: ワンタップで過去月に遡れる）
btnPrevMonth.addEventListener('click', () => {
  currentViewDate.setMonth(currentViewDate.getMonth() - 1);
  renderCalendar(currentViewDate.getFullYear(), currentViewDate.getMonth());
});

btnNextMonth.addEventListener('click', () => {
  currentViewDate.setMonth(currentViewDate.getMonth() + 1);
  renderCalendar(currentViewDate.getFullYear(), currentViewDate.getMonth());
});

// ==========================================
// 5. 達成完了ダイアログ
// ==========================================
function showCompletionDialog() {
  completionDialog.classList.remove('hidden');
}

function hideCompletionDialog() {
  completionDialog.classList.add('hidden');
}

btnDialogClose.addEventListener('click', hideCompletionDialog);
btnDialogCalendar.addEventListener('click', () => {
  hideCompletionDialog();
  openCalendar();
});
completionDialog.addEventListener('click', (e) => {
  if (e.target === completionDialog) hideCompletionDialog();
});

// ==========================================
// 6. 設定ダイアログ & パスコード変更
// ==========================================
btnOpenSettings.addEventListener('click', (e) => {
  e.stopPropagation();
  inputNewPin.value = '';
  pinChangeMsg.textContent = '';
  settingsDialog.classList.remove('hidden');
});

btnCloseSettings.addEventListener('click', () => {
  settingsDialog.classList.add('hidden');
});

settingsDialog.addEventListener('click', (e) => {
  if (e.target === settingsDialog) settingsDialog.classList.add('hidden');
});

btnSavePin.addEventListener('click', () => {
  const newPin = inputNewPin.value.trim();
  if (/^\d{4}$/.test(newPin)) {
    localStorage.setItem(PIN_KEY, newPin);
    pinChangeMsg.style.color = '#4caf50';
    pinChangeMsg.textContent = '暗証番号を更新しました！';
    setTimeout(() => {
      settingsDialog.classList.add('hidden');
    }, 1200);
  } else {
    pinChangeMsg.style.color = '#ff5252';
    pinChangeMsg.textContent = '4桁の数字を入力してください';
  }
});

btnLogout.addEventListener('click', () => {
  localStorage.removeItem(REMEMBER_KEY);
  settingsDialog.classList.add('hidden');
  appMain.classList.add('hidden');
  lockScreen.classList.remove('hidden');
  video.pause();
  enteredPin = '';
  updateDots();
});

// ==========================================
// 初期化 & PWA Service Worker 登録
// ==========================================
window.addEventListener('DOMContentLoaded', () => {
  // 自動ログイン判定（記憶済みの場合）
  const isRemembered = localStorage.getItem(REMEMBER_KEY) === 'true';
  if (isRemembered) {
    unlockApp();
  }

  // Service Worker 登録
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js')
      .then((reg) => {
        console.log('Service Worker registered successfully:', reg.scope);
      })
      .catch((err) => {
        console.log('Service Worker registration failed:', err);
      });
  }
});
