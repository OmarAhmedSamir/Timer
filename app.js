/* =========================================================
   RAKKEZ 2.0
   Built from scratch
========================================================= */


/* =========================================================
   HELPERS
========================================================= */

const $ = (id) => document.getElementById(id);


const DEFAULT_SETTINGS = {

  focus: 25,

  shortBreak: 5,

  longBreak: 15,

  sessions: 4,

  dailyGoal: 240,

  autoBreak: false,

  autoFocus: false,

  notifications: true,

  soundEnabled: true,

  soundVolume: 0.65,

  theme: "dark",

  background: "gradient",

  imageURL: "",

  videoURL: "",

  soundURL: ""

};


let settings = {

  ...DEFAULT_SETTINGS,

  ...JSON.parse(
    localStorage.getItem("rakkez-settings") || "{}"
  )

};


let statistics = JSON.parse(
  localStorage.getItem("rakkez-statistics") || "{}"
);


/* =========================================================
   STATISTICS
========================================================= */

function getToday() {

  return new Date()
    .toISOString()
    .slice(0, 10);

}


function initializeStatistics() {

  const today = getToday();

  if (!statistics.date) {

    statistics = {

      date: today,

      focusSeconds: 0,

      sessions: 0,

      streak: 0,

      lastActiveDay: null

    };

  }

}


initializeStatistics();


function saveData() {

  localStorage.setItem(
    "rakkez-settings",
    JSON.stringify(settings)
  );


  localStorage.setItem(
    "rakkez-statistics",
    JSON.stringify(statistics)
  );

}


/* =========================================================
   TIMER
========================================================= */

const timer = {

  mode: "focus",

  session: 1,

  remaining:
    settings.focus * 60,

  running: false,

  startedAt: null,

  endAt: null

};


function getCurrentDuration() {

  if (timer.mode === "focus") {

    return settings.focus * 60;

  }


  if (timer.mode === "short") {

    return settings.shortBreak * 60;

  }


  return settings.longBreak * 60;

}


function formatTime(seconds) {

  seconds = Math.max(
    0,
    Math.ceil(seconds)
  );


  const minutes =
    Math.floor(seconds / 60);


  const remaining =
    seconds % 60;


  return (
    String(minutes).padStart(2, "0") +
    ":" +
    String(remaining).padStart(2, "0")
  );

}


/* =========================================================
   TIMER UI
========================================================= */

function updateTimerUI() {

  const time =
    formatTime(timer.remaining);


  $("timer").textContent =
    time;

  $("focusTimer").textContent =
    time;

  $("ambientTimer").textContent =
    time;


  const modeName =
    timer.mode === "focus"
      ? "FOCUS"
      : timer.mode === "short"
        ? "SHORT BREAK"
        : "LONG BREAK";


  $("timerMode").textContent =
    modeName;


  $("sessionCounter").textContent =
    `SESSION ${timer.session} / ${settings.sessions}`;


  $("startButton").textContent =
    timer.running
      ? "Pause"
      : "Start Focus";


  $("focusStartButton").textContent =
    timer.running
      ? "Pause"
      : "Start Focus";


  const total =
    getCurrentDuration();


  const progress =
    total > 0
      ? ((total - timer.remaining) / total) * 100
      : 0;


  $("timerProgress").style.width =
    `${Math.max(0, Math.min(100, progress))}%`;

}


/* =========================================================
   FOCUS TRACKING
========================================================= */

function addFocusTime(seconds) {

  if (seconds <= 0) {
    return;
  }


  const today =
    getToday();


  if (
    statistics.lastActiveDay !== today
  ) {

    if (
      statistics.lastActiveDay
    ) {

      const previous =
        new Date(
          statistics.lastActiveDay
        );


      const current =
        new Date(today);


      const difference =
        Math.round(
          (
            current - previous
          ) /
          86400000
        );


      if (difference === 1) {

        statistics.streak =
          (statistics.streak || 0) + 1;

      } else {

        statistics.streak = 1;

      }

    } else {

      statistics.streak = 1;

    }


    statistics.lastActiveDay =
      today;

  }


  statistics.focusSeconds =
    (
      statistics.focusSeconds || 0
    ) + seconds;


  saveData();

  updateStatisticsUI();

}


function formatMinutes(seconds) {

  const minutes =
    Math.floor(
      seconds / 60
    );


  if (minutes < 60) {

    return `${minutes}m`;

  }


  const hours =
    Math.floor(minutes / 60);


  const remainder =
    minutes % 60;


  return remainder
    ? `${hours}h ${remainder}m`
    : `${hours}h`;

}


/* =========================================================
   STATISTICS UI
========================================================= */

function updateStatisticsUI() {

  const focus =
    statistics.focusSeconds || 0;


  const sessions =
    statistics.sessions || 0;


  const streak =
    statistics.streak || 0;


  $("focusTime").textContent =
    formatMinutes(focus);


  $("totalSessions").textContent =
    sessions;


  $("streak").textContent =
    streak;


  const goalSeconds =
    settings.dailyGoal * 60;


  $("dailyGoal").textContent =
    `${formatMinutes(focus)} / ${formatMinutes(goalSeconds)}`;


  const percentage =
    Math.min(
      100,
      (focus / goalSeconds) * 100
    );


  $("goalProgress").style.width =
    `${percentage}%`;

}


/* =========================================================
   START / PAUSE
========================================================= */

function startTimer() {

  if (timer.running) {

    pauseTimer();

    return;

  }


  timer.running = true;


  timer.startedAt =
    Date.now();


  timer.endAt =
    Date.now() +
    timer.remaining * 1000;


  updateTimerUI();

}


function pauseTimer() {

  if (!timer.running) {
    return;
  }


  const now =
    Date.now();


  const elapsed =
    Math.max(
      0,
      (
        now -
        timer.startedAt
      ) / 1000
    );


  if (
    timer.mode === "focus"
  ) {

    addFocusTime(elapsed);

  }


  timer.remaining =
    Math.max(
      0,
      (
        timer.endAt -
        now
      ) / 1000
    );


  timer.running = false;

  timer.startedAt = null;

  timer.endAt = null;


  updateTimerUI();

}


/* =========================================================
   TIMER TICK
========================================================= */

setInterval(() => {

  if (!timer.running) {
    return;
  }


  const remaining =
    (
      timer.endAt -
      Date.now()
    ) / 1000;


  if (remaining <= 0) {

    completeTimer();

    return;

  }


  timer.remaining =
    remaining;


  updateTimerUI();

}, 250);


/* =========================================================
   COMPLETE
========================================================= */

function completeTimer() {

  if (
    timer.mode === "focus"
  ) {

    const elapsed =
      timer.startedAt
        ? (
            Date.now() -
            timer.startedAt
          ) / 1000
        : 0;


    addFocusTime(
      elapsed
    );


    statistics.sessions =
      (
        statistics.sessions || 0
      ) + 1;


    saveData();


    notify(
      "Focus complete",
      "Time for a break."
    );


    playCompletionSound();


    if (
      timer.session >=
      settings.sessions
    ) {

      timer.mode = "long";

      timer.session = 1;

    } else {

      timer.mode = "short";

    }

  } else {

    notify(
      "Break complete",
      "Ready to focus?"
    );


    playCompletionSound();


    if (
      timer.mode === "short"
    ) {

      timer.mode = "focus";

      timer.session =
        Math.min(
          settings.sessions,
          timer.session + 1
        );

    } else {

      timer.mode = "focus";

    }

  }


  timer.remaining =
    getCurrentDuration();


  timer.running = false;

  timer.startedAt = null;

  timer.endAt = null;


  updateTimerUI();


  if (
    timer.mode === "focus" &&
    settings.autoFocus
  ) {

    startTimer();

  }


  if (
    timer.mode !== "focus" &&
    settings.autoBreak
  ) {

    startTimer();

  }

}


/* =========================================================
   SKIP
========================================================= */

function skipTimer() {

  if (timer.running) {

    pauseTimer();

  }


  if (
    timer.mode === "focus"
  ) {

    if (
      timer.session >=
      settings.sessions
    ) {

      timer.mode = "long";

    } else {

      timer.mode = "short";

    }

  } else {

    timer.mode = "focus";

    if (
      timer.session <
      settings.sessions
    ) {

      timer.session++;

    }

  }


  timer.remaining =
    getCurrentDuration();


  updateTimerUI();

}


/* =========================================================
   RESET
========================================================= */

function resetTimer() {

  timer.running = false;

  timer.startedAt = null;

  timer.endAt = null;

  timer.remaining =
    getCurrentDuration();


  updateTimerUI();

}


/* =========================================================
   BUTTONS
========================================================= */

$("startButton").onclick =
  startTimer;


$("focusStartButton").onclick =
  startTimer;


$("skipButton").onclick =
  skipTimer;


$("focusSkipButton").onclick =
  skipTimer;


$("resetButton").onclick =
  () => {

    $("resetDialog")
      .classList
      .remove("hidden");

  };


$("cancelReset").onclick =
  () => {

    $("resetDialog")
      .classList
      .add("hidden");

  };


$("confirmReset").onclick =
  () => {

    $("resetDialog")
      .classList
      .add("hidden");

    resetTimer();

  };


/* =========================================================
   NAVIGATION
========================================================= */

function changeScreen(mode) {

  $("homeScreen")
    .classList
    .toggle(
      "hidden",
      mode !== "home"
    );


  $("focusScreen")
    .classList
    .toggle(
      "hidden",
      mode !== "focus"
    );


  $("ambientScreen")
    .classList
    .toggle(
      "hidden",
      mode !== "ambient"
    );


  document
    .querySelectorAll(".mode-button")
    .forEach(
      button => {

        button.classList.toggle(
          "active",
          button.dataset.mode === mode
        );

      }
    );

}


document
  .querySelectorAll(".mode-button")
  .forEach(
    button => {

      button.onclick =
        () => changeScreen(
          button.dataset.mode
        );

    }
  );


$("logoButton").onclick =
  () => changeScreen("home");


/* =========================================================
   PANELS
========================================================= */

function openOverlay() {

  $("overlay")
    .classList
    .add("active");

}


function closePanels() {

  $("sidePanel")
    .classList
    .remove("open");


  $("settingsPanel")
    .classList
    .remove("open");


  $("overlay")
    .classList
    .remove("active");

}


$("overlay").onclick =
  closePanels;


$("closePanel").onclick =
  closePanels;


$("closeSettings").onclick =
  closePanels;


/* =========================================================
   QUICK PANELS
========================================================= */

document
  .querySelectorAll("[data-panel]")
  .forEach(
    button => {

      button.onclick =
        () => {

          const panel =
            button.dataset.panel;


          if (
            panel === "tasks"
          ) {

            $("panelTitle")
              .textContent =
              "Today's Focus";


            $("panelContent")
              .innerHTML = `
                <div style="
                  padding:20px 0;
                  color:var(--muted);
                  line-height:1.7;
                ">
                  Your task system is ready
                  for the next RakkeZ layer.
                  Keep the timer clean and
                  make the current task the
                  center of attention.
                </div>
              `;

          }


          if (
            panel === "music"
          ) {

            $("panelTitle")
              .textContent =
              "Music";


            $("panelContent")
              .innerHTML = `
                <div style="
                  padding:20px 0;
                  color:var(--muted);
                  line-height:1.7;
                ">
                  Add YouTube, Spotify,
                  or local media from
                  Settings → Music.
                </div>
              `;

          }


          if (
            panel === "sounds"
          ) {

            $("panelTitle")
              .textContent =
              "Sounds";


            $("panelContent")
              .innerHTML = `
                <div style="
                  padding:20px 0;
                  color:var(--muted);
                  line-height:1.7;
                ">
                  Configure completion
                  sounds from Settings.
                </div>
              `;

          }


          if (
            panel === "stats"
          ) {

            $("panelTitle")
              .textContent =
              "Statistics";


            $("panelContent")
              .innerHTML = `
                <div style="
                  display:grid;
                  grid-template-columns:1fr 1fr;
                  gap:8px;
                  padding-top:15px;
                ">

                  <div class="stat-card">
                    <span>Total Focus</span>
                    <strong>
                      ${formatMinutes(
                        statistics.focusSeconds || 0
                      )}
                    </strong>
                  </div>

                  <div class="stat-card">
                    <span>Sessions</span>
                    <strong>
                      ${statistics.sessions || 0}
                    </strong>
                  </div>

                  <div class="stat-card">
                    <span>Streak</span>
                    <strong>
                      ${statistics.streak || 0}
                    </strong>
                  </div>

                  <div class="stat-card">
                    <span>Goal</span>
                    <strong>
                      ${settings.dailyGoal}m
                    </strong>
                  </div>

                </div>
              `;

          }


          $("sidePanel")
            .classList
            .add("open");


          openOverlay();

        };

    }
  );


/* =========================================================
   SETTINGS
========================================================= */

$("settingsButton").onclick =
  () => {

    loadSettingsUI();

    $("settingsPanel")
      .classList
      .add("open");

    openOverlay();

  };


function loadSettingsUI() {

  $("focusDuration").value =
    settings.focus;


  $("shortBreakDuration").value =
    settings.shortBreak;


  $("longBreakDuration").value =
    settings.longBreak;


  $("sessionCount").value =
    settings.sessions;


  $("goalDuration").value =
    settings.dailyGoal;


  $("autoBreak").checked =
    settings.autoBreak;


  $("autoFocus").checked =
    settings.autoFocus;


  $("notifications").checked =
    settings.notifications;


  $("soundEnabled").checked =
    settings.soundEnabled;


  $("soundVolume").value =
    settings.soundVolume;


  $("imageURL").value =
    settings.imageURL;


  $("videoURL").value =
    settings.videoURL;


  $("soundURL").value =
    settings.soundURL;


  document
    .querySelectorAll("[data-theme]")
    .forEach(
      button => {

        button.classList.toggle(
          "active",
          button.dataset.theme ===
          settings.theme
        );

      }
    );


  document
    .querySelectorAll("[data-background]")
    .forEach(
      button => {

        button.classList.toggle(
          "active",
          button.dataset.background ===
          settings.background
        );

      }
    );

}


function saveSettings() {

  settings.focus =
    Number(
      $("focusDuration").value
    );


  settings.shortBreak =
    Number(
      $("shortBreakDuration").value
    );


  settings.longBreak =
    Number(
      $("longBreakDuration").value
    );


  settings.sessions =
    Number(
      $("sessionCount").value
    );


  settings.dailyGoal =
    Number(
      $("goalDuration").value
    );


  settings.autoBreak =
    $("autoBreak").checked;


  settings.autoFocus =
    $("autoFocus").checked;


  settings.notifications =
    $("notifications").checked;


  settings.soundEnabled =
    $("soundEnabled").checked;


  settings.soundVolume =
    Number(
      $("soundVolume").value
    );


  settings.soundURL =
    $("soundURL").value.trim();


  saveData();


  if (!timer.running) {

    timer.remaining =
      getCurrentDuration();

  }


  updateTimerUI();

  updateStatisticsUI();

}


[
  "focusDuration",
  "shortBreakDuration",
  "longBreakDuration",
  "sessionCount",
  "goalDuration",
  "autoBreak",
  "autoFocus",
  "notifications",
  "soundEnabled",
  "soundVolume",
  "soundURL"
]
.forEach(
  id => {

    $(id).addEventListener(
      "change",
      saveSettings
    );

  }
);


/* =========================================================
   THEME
========================================================= */

function applyTheme() {

  document.body
    .classList
    .toggle(
      "light",
      settings.theme === "light"
    );


  $("themeButton")
    .textContent =
    settings.theme === "light"
      ? "☀"
      : "☾";

}


$("themeButton").onclick =
  () => {

    settings.theme =
      settings.theme === "dark"
        ? "light"
        : "dark";


    applyTheme();

    saveData();

    loadSettingsUI();

  };


document
  .querySelectorAll("[data-theme]")
  .forEach(
    button => {

      button.onclick =
        () => {

          settings.theme =
            button.dataset.theme;

          applyTheme();

          saveData();

          loadSettingsUI();

        };

    }
  );


/* =========================================================
   BACKGROUND STORAGE
   INDEXEDDB
========================================================= */

let database;


function openDatabase() {

  return new Promise(
    (resolve, reject) => {

      const request =
        indexedDB.open(
          "RakkeZMedia",
          1
        );


      request.onupgradeneeded =
        () => {

          request.result
            .createObjectStore(
              "files"
            );

        };


      request.onsuccess =
        () => {

          database =
            request.result;

          resolve(database);

        };


      request.onerror =
        () => {

          reject(
            request.error
          );

        };

    }
  );

}


async function saveFile(
  key,
  file
) {

  const db =
    database ||
    await openDatabase();


  return new Promise(
    (resolve, reject) => {

      const transaction =
        db.transaction(
          "files",
          "readwrite"
        );


      transaction
        .objectStore("files")
        .put(file, key);


      transaction.oncomplete =
        resolve;


      transaction.onerror =
        () => reject(
          transaction.error
        );

    }
  );

}


async function getFile(key) {

  const db =
    database ||
    await openDatabase();


  return new Promise(
    (resolve, reject) => {

      const request =
        db
          .transaction("files")
          .objectStore("files")
          .get(key);


      request.onsuccess =
        () => resolve(
          request.result
        );


      request.onerror =
        () => reject(
          request.error
        );

    }
  );

}


/* =========================================================
   BACKGROUND
========================================================= */

let backgroundObjectURL = null;


function clearBackgroundVideo() {

  const video =
    $("backgroundVideo");


  video.pause();

  video.removeAttribute(
    "src"
  );

  video.load();

  video.style.display =
    "none";

}


function applyBackground() {

  const background =
    $("background");


  const video =
    $("backgroundVideo");


  clearBackgroundVideo();


  background.style.backgroundImage =
    "";


  if (
    settings.background ===
    "gradient"
  ) {

    return;

  }


  if (
    settings.background ===
    "image" &&
    settings.imageURL
  ) {

    background.style.backgroundImage =
      `url("${settings.imageURL}")`;

    background.style.backgroundSize =
      "cover";

    background.style.backgroundPosition =
      "center";

    return;

  }


  if (
    settings.background ===
    "video" &&
    settings.videoURL
  ) {

    video.src =
      settings.videoURL;

    video.style.display =
      "block";

    video.play().catch(
      () => {}
    );

  }

}


document
  .querySelectorAll(
    "[data-background]"
  )
  .forEach(
    button => {

      button.onclick =
        () => {

          settings.background =
            button.dataset.background;

          applyBackground();

          saveData();

          loadSettingsUI();

        };

    }
  );


$("defaultBackground").onclick =
  () => {

    settings.background =
      "gradient";

    settings.imageURL =
      "";

    settings.videoURL =
      "";

    applyBackground();

    saveData();

    loadSettingsUI();

  };


$("imageURL").addEventListener(
  "change",
  () => {

    settings.imageURL =
      $("imageURL")
        .value
        .trim();


    if (
      settings.imageURL
    ) {

      settings.background =
        "image";

    }


    applyBackground();

    saveData();

    loadSettingsUI();

  }
);


$("videoURL").addEventListener(
  "change",
  () => {

    settings.videoURL =
      $("videoURL")
        .value
        .trim();


    if (
      settings.videoURL
    ) {

      settings.background =
        "video";

    }


    applyBackground();

    saveData();

    loadSettingsUI();

  }
);


/* =========================================================
   LOCAL IMAGE
========================================================= */

$("imageUpload").addEventListener(
  "change",
  async event => {

    const file =
      event.target.files[0];


    if (!file) {
      return;
    }


    await saveFile(
      "background-image",
      file
    );


    const url =
      URL.createObjectURL(
        file
      );


    settings.imageURL =
      url;


    settings.videoURL =
      "";


    settings.background =
      "image";


    applyBackground();

    saveData();

    loadSettingsUI();

  }
);


/* =========================================================
   LOCAL VIDEO
========================================================= */

$("videoUpload").addEventListener(
  "change",
  async event => {

    const file =
      event.target.files[0];


    if (!file) {
      return;
    }


    await saveFile(
      "background-video",
      file
    );


    const url =
      URL.createObjectURL(
        file
      );


    settings.videoURL =
      url;


    settings.imageURL =
      "";


    settings.background =
      "video";


    applyBackground();

    saveData();

    loadSettingsUI();

  }
);


/* =========================================================
   RESTORE LOCAL BACKGROUND
========================================================= */

async function restoreLocalBackground() {

  try {

    const image =
      await getFile(
        "background-image"
      );


    const video =
      await getFile(
        "background-video"
      );


    if (
      settings.background ===
      "image" &&
      image
    ) {

      settings.imageURL =
        URL.createObjectURL(
          image
        );

    }


    if (
      settings.background ===
      "video" &&
      video
    ) {

      settings.videoURL =
        URL.createObjectURL(
          video
        );

    }


    applyBackground();

  } catch {

    console.log(
      "No local background found."
    );

  }

}


/* =========================================================
   SOUNDS
========================================================= */

function playCompletionSound() {

  if (
    !settings.soundEnabled
  ) {

    return;

  }


  const audio =
    $("completionSound");


  if (
    settings.soundURL
  ) {

    audio.src =
      settings.soundURL;

    audio.volume =
      settings.soundVolume;

    audio.play().catch(
      () => {}
    );

    return;

  }


  /*
    Small generated completion tone.
  */

  try {

    const AudioContext =
      window.AudioContext ||
      window.webkitAudioContext;


    const context =
      new AudioContext();


    [0, .18, .36]
      .forEach(
        delay => {

          const oscillator =
            context.createOscillator();


          const gain =
            context.createGain();


          oscillator.frequency.value =
            650;


          gain.gain.setValueAtTime(
            0,
            context.currentTime +
            delay
          );


          gain.gain.linearRampToValueAtTime(
            .18 *
            settings.soundVolume,
            context.currentTime +
            delay +
            .02
          );


          gain.gain.exponentialRampToValueAtTime(
            .001,
            context.currentTime +
            delay +
            .16
          );


          oscillator
            .connect(gain)
            .connect(context.destination);


          oscillator.start(
            context.currentTime +
            delay
          );


          oscillator.stop(
            context.currentTime +
            delay +
            .17
          );

        }
      );

  } catch {

    // Browser audio unavailable.

  }

}


$("testSound").onclick =
  playCompletionSound;


/* =========================================================
   LOCAL SOUND
========================================================= */

$("soundUpload").addEventListener(
  "change",
  async event => {

    const file =
      event.target.files[0];


    if (!file) {
      return;
    }


    await saveFile(
      "completion-sound",
      file
    );


    settings.soundURL =
      URL.createObjectURL(
        file
      );


    saveData();

  }
);


/* =========================================================
   MUSIC
========================================================= */

let currentMedia = null;


function getYouTubeId(url) {

  if (!url) {
    return null;
  }


  const match =
    url.match(
      /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([^&?/]+)/
    );


  return match
    ? match[1]
    : null;

}


function renderNowPlaying() {

  if (!currentMedia) {

    $("nowPlaying")
      .classList
      .add("hidden");

    return;

  }


  $("nowPlaying")
    .classList
    .remove("hidden");


  $("mediaTitle")
    .textContent =
    currentMedia.title ||
    "Media";


  $("mediaType")
    .textContent =
    currentMedia.local
      ? "Local media"
      : currentMedia.type;


  $("mediaArtwork")
    .innerHTML =
    "♫";


  const youtube =
    getYouTubeId(
      currentMedia.url
    );


  if (youtube) {

    const image =
      document.createElement(
        "img"
      );


    image.src =
      `https://img.youtube.com/vi/${youtube}/hqdefault.jpg`;


    image.onload =
      () => {

        $("mediaArtwork")
          .innerHTML = "";

        $("mediaArtwork")
          .appendChild(image);

      };

  }

}


/* =========================================================
   SAVE MUSIC
========================================================= */

$("saveMusic").onclick =
  () => {

    const url =
      $("musicURL")
        .value
        .trim();


    const title =
      $("musicTitle")
        .value
        .trim();


    if (!url) {

      return;

    }


    const youtube =
      getYouTubeId(url);


    currentMedia = {

      url,

      title:
        title ||
        (
          youtube
            ? "YouTube"
            : "Music"
        ),

      type:
        youtube
          ? "YouTube"
          : /spotify/i.test(url)
            ? "Spotify"
            : "External"

    };


    localStorage.setItem(
      "rakkez-media",
      JSON.stringify(
        currentMedia
      )
    );


    renderNowPlaying();

  };


/* =========================================================
   LOCAL MUSIC
========================================================= */

$("mediaUpload").addEventListener(
  "change",
  async event => {

    const file =
      event.target.files[0];


    if (!file) {
      return;
    }


    await saveFile(
      "local-media",
      file
    );


    const url =
      URL.createObjectURL(
        file
      );


    currentMedia = {

      url,

      title:
        file.name,

      local:
        true,

      mime:
        file.type

    };


    renderNowPlaying();

  }
);


/* =========================================================
   OPEN MUSIC
========================================================= */

$("openMedia").onclick =
  () => {

    if (!currentMedia) {
      return;
    }


    if (
      currentMedia.local
    ) {

      let player =
        document.getElementById(
          "localMediaPlayer"
        );


      if (!player) {

        player =
          document.createElement(
            currentMedia.mime.startsWith(
              "video"
            )
              ? "video"
              : "audio"
          );


        player.id =
          "localMediaPlayer";


        player.controls =
          true;


        player.autoplay =
          true;


        player.style.position =
          "fixed";


        player.style.bottom =
          "20px";


        player.style.left =
          "50%";


        player.style.transform =
          "translateX(-50%)";


        player.style.zIndex =
          "200";


        player.style.maxWidth =
          "90vw";


        player.style.maxHeight =
          "70vh";


        document.body
          .appendChild(
            player
          );

      }


      player.src =
        currentMedia.url;


      player.play().catch(
        () => {}
      );


      return;

    }


    const youtube =
      getYouTubeId(
        currentMedia.url
      );


    if (youtube) {

      window.open(
        `https://www.youtube.com/watch?v=${youtube}`,
        "_blank",
        "noopener,noreferrer"
      );

      return;

    }


    window.open(
      currentMedia.url,
      "_blank",
      "noopener,noreferrer"
    );

  };


/* =========================================================
   NOTIFICATIONS
========================================================= */

function notify(
  title,
  body
) {

  if (
    !settings.notifications
  ) {

    return;

  }


  if (
    !("Notification" in window)
  ) {

    return;

  }


  if (
    Notification.permission ===
    "granted"
  ) {

    new Notification(
      title,
      { body }
    );

  } else if (
    Notification.permission !==
    "denied"
  ) {

    Notification
      .requestPermission()
      .catch(
        () => {}
      );

  }

}


/* =========================================================
   RESET DATA
========================================================= */

$("resetData").onclick =
  () => {

    const confirmed =
      confirm(
        "Reset all RakkeZ data?"
      );


    if (!confirmed) {
      return;
    }


    localStorage.removeItem(
      "rakkez-settings"
    );


    localStorage.removeItem(
      "rakkez-statistics"
    );


    localStorage.removeItem(
      "rakkez-media"
    );


    location.reload();

  };


/* =========================================================
   GREETING
========================================================= */

function updateGreeting() {

  const hour =
    new Date().getHours();


  let text =
    "Good evening";


  if (hour < 12) {

    text =
      "Good morning";

  } else if (hour < 18) {

    text =
      "Good afternoon";

  }


  $("greetingTime")
    .textContent =
    text;

}


/* =========================================================
   KEYBOARD
========================================================= */

document.addEventListener(
  "keydown",
  event => {

    if (
      event.target.matches(
        "input, textarea"
      )
    ) {

      return;

    }


    if (
      event.code ===
      "Space"
    ) {

      event.preventDefault();

      startTimer();

    }


    if (
      event.key.toLowerCase() ===
      "r"
    ) {

      $("resetButton").click();

    }


    if (
      event.key.toLowerCase() ===
      "s"
    ) {

      skipTimer();

    }

  }
);


/* =========================================================
   INIT
========================================================= */

async function initialize() {

  applyTheme();

  updateGreeting();

  updateTimerUI();

  updateStatisticsUI();

  loadSettingsUI();


  try {

    await openDatabase();

    await restoreLocalBackground();

  } catch {

    console.log(
      "IndexedDB unavailable."
    );

  }


  const savedMedia =
    localStorage.getItem(
      "rakkez-media"
    );


  if (savedMedia) {

    try {

      currentMedia =
        JSON.parse(
          savedMedia
        );


      renderNowPlaying();

    } catch {

      currentMedia =
        null;

    }

  }

}


initialize();
