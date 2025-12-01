const toggle = document.getElementById("toggle");
const colorPicker = document.getElementById("noteColor");
const showNoteBtn = document.getElementById("showNoteBtn");
const hideNoteBtn = document.getElementById("hideNoteBtn");
const openManagerBtn = document.getElementById("openManagerBtn");

// Загрузка состояния включения
chrome.storage.sync.get("enabled", data => {
    toggle.checked = data.enabled !== false;
});

toggle.addEventListener("change", () => {
    chrome.storage.sync.set({ enabled: toggle.checked });
});

// Загрузка цвета
chrome.storage.sync.get("noteColor", data => {
    colorPicker.value = data.noteColor || "#fff8b3";
});

colorPicker.addEventListener("input", () => {
    chrome.storage.sync.set({ noteColor: colorPicker.value });
});

// Получаем noteId текущей страницы через content.js
function getCurrentPageId(callback) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (!tabs[0]) return;
        const tabId = tabs[0].id;

        // Отправляем запрос контент-скрипту, чтобы получить noteId
        chrome.scripting.executeScript(
            {
                target: { tabId },
                func: () => {
                    const url = location.origin + location.pathname;
                    return "page_" + url.replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/$/, "");
                }
            },
            (results) => {
                if (!results || !results[0] || !results[0].result) return;
                callback(tabId, results[0].result);
            }
        );
    });
}

// Показать заметку
showNoteBtn.addEventListener("click", () => {
    getCurrentPageId((tabId, noteId) => {
        chrome.tabs.sendMessage(tabId, { type: "show_note", id: noteId });
    });
});

// Скрыть заметку
hideNoteBtn.addEventListener("click", () => {
    getCurrentPageId((tabId, noteId) => {
        chrome.tabs.sendMessage(tabId, { type: "hide_note", id: noteId });
    });
});

// Открыть менеджер заметок
openManagerBtn.addEventListener("click", () => {
    chrome.windows.create({
        url: chrome.runtime.getURL("notes_manager.html"),
        type: "popup",
        width: 1200,
        height: 700
    });
});
