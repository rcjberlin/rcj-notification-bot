const LS_TAB_ID = "notification-bot-admin-dashboard-current-tab-id";

let currentTabId = null;
const tabs = [];
const url = new URL(window.location.href);

function getTime() {
  return new Date().getTime() / 1000;
}

window.onload = function () {
  initTabs();
  switchToTab(readTabIdFromLocalStorage() || 0);
  initInputSyncing();
  loadData();
};

function initTabs() {
  const tabbar = document.getElementById("tabbar");
  const boxes = document.querySelectorAll(".box");

  for (let i = 0; i < boxes.length; i++) {
    boxes[i].id = "box-" + i;
    tabs.push({ id: i, tabTitle: boxes[i].getAttribute("data-tab-title") });

    tab = getTemplate("template-tab");
    tab.id = "tab-" + i;
    tab.textContent = tabs[i].tabTitle;
    tab.onclick = function () {
      switchToTab(i);
    };
    tabbar.appendChild(tab);
    hideTab(i);
  }
}

function getTemplate(templateId) {
  const el = document.getElementById(templateId).cloneNode(true);
  el.removeAttribute("id");
  el.classList.remove("template");
  return el;
}

function hideTab(tabId) {
  document.getElementById("tab-" + tabId).classList.remove("active");
  document.getElementById("box-" + tabId).classList.remove("active");
}

function showTab(tabId) {
  document.getElementById("tab-" + tabId).classList.add("active");
  document.getElementById("box-" + tabId).classList.add("active");
  currentTabId = tabId;
  writeTabIdToLocalStorage(tabId);
}

function switchToTab(tabId) {
  if (currentTabId !== null && currentTabId !== undefined) {
    hideTab(currentTabId);
  }
  currentTabId = tabId % tabs.length;
  showTab(currentTabId);
}

function readTabIdFromLocalStorage() {
  return localStorage.getItem(LS_TAB_ID);
}

function writeTabIdToLocalStorage(tabId) {
  localStorage.setItem(LS_TAB_ID, tabId);
}

function convertDateToString(unixTimestampInSeconds, formatString="YYYY-MM-DD hh:mm:ss") {
  const date = new Date(unixTimestampInSeconds * 1000);
  return formatString
    .replace("hh", pad(date.getHours()))
    .replace("mm", pad(date.getMinutes()))
    .replace("ss", pad(date.getSeconds()))
    .replace("DD", pad(date.getDate()))
    .replace("MM", pad(date.getMonth() + 1))
    .replace("YYYY", pad(date.getFullYear(), 4));
}

function pad(value, length=2, character=0) {
  value = String(value);
  return String(character).repeat(Math.max(0, length - value.length)) + value;
}
