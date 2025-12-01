// background.js

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    // --- Сохранение текста заметки ---
    if (msg.type === "save_note") {
        // msg.id - ID заметки, msg.title - заголовок, msg.text - текст
        chrome.storage.local.set({ [msg.id]: { title: msg.title, text: msg.text } }, () => {
            sendResponse({ ok: true });
        });
        return true; // указываем, что ответ будет асинхронный
    }

    // --- Получение текста заметки ---
    if (msg.type === "get_note") {
        chrome.storage.local.get(msg.id, data => {
            sendResponse({ note: data[msg.id] || { title: msg.title || "", text: "" } });
        });
        return true;
    }

    // --- Сохранение позиции заметки на странице ---
    if (msg.type === "save_position") {
        chrome.storage.local.set({ [msg.id + "_pos"]: msg.pos }, () => sendResponse({ ok: true }));
        return true;
    }

    // --- Получение позиции заметки ---
    if (msg.type === "get_position") {
        chrome.storage.local.get(msg.id + "_pos", data => {
            sendResponse({ pos: data[msg.id + "_pos"] || null });
        });
        return true;
    }
});
