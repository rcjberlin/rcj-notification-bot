const LS_INPUTS_SYNC = "notification-bot-admin-dashboard-synced-inputs";

const inputsToSync = [
  "input-bot-manager-endpoint",
  "input-bot-manager-token",
  "channel-detail-send-message-input",
];
let inputValuesFromLocalStorage = {};

function initInputSyncing() {
  setInputValuesFromLocalStorage();
  addEventListenersToSaveInputValuesOnChange();
}

function setInputValuesFromLocalStorage() {
  try {
    inputValuesFromLocalStorage =
      JSON.parse(localStorage.getItem(LS_INPUTS_SYNC)) || {};
  } catch {
    inputValuesFromLocalStorage = {};
  }
  for (const inputToSync of inputsToSync) {
    const valueFromLocalStorage = inputValuesFromLocalStorage[inputToSync];
    if (valueFromLocalStorage) {
      const inputElement = document.getElementById(inputToSync);
      inputElement.value = valueFromLocalStorage;
    }
  }
}

function addEventListenersToSaveInputValuesOnChange() {
  for (const inputToSync of inputsToSync) {
    const inputElement = document.getElementById(inputToSync);
    inputElement.addEventListener("input", () => {
      inputValuesFromLocalStorage[inputToSync] = inputElement.value;
      localStorage.setItem(
        LS_INPUTS_SYNC,
        JSON.stringify(inputValuesFromLocalStorage)
      );
    });
  }
}
