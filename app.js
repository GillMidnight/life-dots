const STORAGE_KEY = "life-dots-state-v1";

const defaultState = {
  goal: null,
  progressByDate: {},
};

let state = loadState();

const setupScreen = document.querySelector("#setup-screen");
const mainScreen = document.querySelector("#main-screen");
const setupForm = document.querySelector("#setup-form");
const titleInput = document.querySelector("#goal-title-input");
const totalInput = document.querySelector("#goal-total-input");
const goalTitle = document.querySelector("#goal-title");
const progressPercent = document.querySelector("#progress-percent");
const progressHours = document.querySelector("#progress-hours");
const todayStatus = document.querySelector("#today-status");
const dotsGrid = document.querySelector("#dots-grid");
const addButton = document.querySelector("#add-button");
const settingsButton = document.querySelector("#settings-button");
const hoursDialog = document.querySelector("#hours-dialog");
const hoursForm = document.querySelector("#hours-form");
const todayHoursInput = document.querySelector("#today-hours-input");
const settingsDialog = document.querySelector("#settings-dialog");
const settingsForm = document.querySelector("#settings-form");
const settingsTitleInput = document.querySelector("#settings-title-input");
const settingsTotalInput = document.querySelector("#settings-total-input");
const resetButton = document.querySelector("#reset-button");

populateHoursSelect();

setupForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const title = titleInput.value.trim();
  const totalHours = clampNumber(totalInput.value, 1, 10000);

  if (!title || !totalHours) return;

  state = {
    goal: {
      title,
      totalHours,
      createdAt: getDateKey(),
    },
    progressByDate: {},
  };

  saveState();
  render();
});

addButton.addEventListener("click", () => {
  todayHoursInput.value = getTodayHours();
  showDialog(hoursDialog);
  setTimeout(() => todayHoursInput.focus(), 50);
});

hoursForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const hours = clampNumber(todayHoursInput.value, 0, 23);
  state.progressByDate[getDateKey()] = hours;
  saveState();
  closeDialog(hoursDialog);
  render();
});

settingsButton.addEventListener("click", () => {
  settingsTitleInput.value = state.goal.title;
  settingsTotalInput.value = state.goal.totalHours;
  showDialog(settingsDialog);
});

settingsForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const title = settingsTitleInput.value.trim();
  const totalHours = clampNumber(settingsTotalInput.value, 1, 10000);

  if (!title || !totalHours) return;

  state.goal.title = title;
  state.goal.totalHours = totalHours;
  saveState();
  closeDialog(settingsDialog);
  render();
});

resetButton.addEventListener("click", () => {
  const shouldReset = window.confirm("Сбросить цель и все точки?");
  if (!shouldReset) return;

  state = { ...defaultState };
  saveState();
  closeDialog(settingsDialog);
  render();
});

document.querySelectorAll("[data-close-dialog]").forEach((button) => {
  button.addEventListener("click", () => {
    closeDialog(button.closest("dialog"));
  });
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("service-worker.js");
  });
}

render();

function populateHoursSelect() {
  const fragment = document.createDocumentFragment();
  for (let hour = 0; hour <= 23; hour += 1) {
    const option = document.createElement("option");
    option.value = String(hour);
    option.textContent = `${hour} ч`;
    fragment.append(option);
  }

  todayHoursInput.append(fragment);
}

function render() {
  if (!state.goal) {
    setupScreen.classList.remove("is-hidden");
    mainScreen.classList.add("is-hidden");
    return;
  }

  setupScreen.classList.add("is-hidden");
  mainScreen.classList.remove("is-hidden");

  const completedHours = getCompletedHours();
  const totalHours = state.goal.totalHours;
  const percent = Math.min(100, Math.round((completedHours / totalHours) * 100));

  goalTitle.textContent = state.goal.title;
  progressPercent.textContent = `${percent}%`;
  progressHours.textContent = `${completedHours} / ${totalHours} часов`;
  todayStatus.textContent = `Сегодня ${getTodayHours()} ч`;

  renderDots(completedHours, totalHours);
}

function renderDots(completedHours, totalHours) {
  dotsGrid.innerHTML = "";

  const fragment = document.createDocumentFragment();
  for (let index = 0; index < totalHours; index += 1) {
    const dot = document.createElement("span");
    dot.className = index < completedHours ? "dot is-filled" : "dot";
    fragment.append(dot);
  }

  dotsGrid.append(fragment);
}

function getCompletedHours() {
  return Object.values(state.progressByDate).reduce((sum, value) => {
    return sum + clampNumber(value, 0, 23);
  }, 0);
}

function getTodayHours() {
  return clampNumber(state.progressByDate[getDateKey()] ?? 0, 0, 23);
}

function getDateKey() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function clampNumber(value, min, max) {
  const number = Number.parseInt(value, 10);
  if (Number.isNaN(number)) return min;
  return Math.min(max, Math.max(min, number));
}

function showDialog(dialog) {
  if (typeof dialog.showModal === "function") {
    dialog.showModal();
    return;
  }

  dialog.setAttribute("open", "");
}

function closeDialog(dialog) {
  if (!dialog) return;

  if (typeof dialog.close === "function") {
    dialog.close();
    return;
  }

  dialog.removeAttribute("open");
}

function loadState() {
  try {
    const savedState = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!savedState || typeof savedState !== "object") return { ...defaultState };
    return {
      goal: savedState.goal ?? null,
      progressByDate: savedState.progressByDate ?? {},
    };
  } catch {
    return { ...defaultState };
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}
