const url = location.origin + location.pathname;

// Генератор ID заметки для страницы
function getNoteId() {
    return "page_" + url; // ключ теперь уникален по URL
}

// Проверка авто-открытия
chrome.storage.sync.get("autoOpenSites", data => {
    const autoSites = data.autoOpenSites || {};
    const noteId = getNoteId();
    if (autoSites[noteId]) {
        initNote();
    }
});

// Слушатель сообщений из popup
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.type === "show_note") {
        let note = document.getElementById("quick-note");
        if (!note) initNote();
        else note.style.display = "flex";
    }

    if (msg.type === "hide_note") {
        const note = document.getElementById("quick-note");
        if (note) note.style.display = "none";
    }

    return true;
});

function initNote() {
    const note = document.createElement("div");
    note.id = "quick-note";

    note.innerHTML = `
        <div id="quick-note-header">
            <span id="quick-note-close">✖</span>
        </div>
        <textarea id="quick-note-text" placeholder="Note for this page..."></textarea>
    `;

    document.body.appendChild(note);

    const textarea = document.getElementById("quick-note-text");
    const header = document.getElementById("quick-note-header");
    const closeBtn = document.getElementById("quick-note-close");

    const noteId = getNoteId();

    // Загрузка заметки
    chrome.runtime.sendMessage({ type: "get_note", id: noteId }, response => {
        textarea.value = response.note.text || "";
    });

    // Сохранение текста
    textarea.addEventListener("input", () => {
        chrome.runtime.sendMessage({
            type: "save_note",
            id: noteId,
            title: location.hostname,
            text: textarea.value
        });
    });

    // Загрузка цвета заметки
    chrome.storage.sync.get("noteColor", data => {
        if (data.noteColor) note.style.background = data.noteColor;
    });

    chrome.storage.onChanged.addListener(changes => {
        if (changes.noteColor) note.style.background = changes.noteColor.newValue;
    });

    // Загрузка позиции
    chrome.runtime.sendMessage({ type: "get_position", id: noteId }, response => {
        if (response.pos) {
            note.style.left = response.pos.x + "px";
            note.style.top = response.pos.y + "px";
        } else {
            note.style.left = "80px";
            note.style.top = "80px";
        }
    });

    // --- Drag & drop ---
    let isDragging = false;
    let offsetX = 0;
    let offsetY = 0;

    header.addEventListener("mousedown", e => {
        isDragging = true;
        offsetX = e.clientX - note.offsetLeft;
        offsetY = e.clientY - note.offsetTop;
        e.preventDefault();
    });

    document.addEventListener("mousemove", e => {
        if (!isDragging) return;

        let newX = e.clientX - offsetX;
        let newY = e.clientY - offsetY;

        const maxX = window.innerWidth - note.offsetWidth;
        const maxY = window.innerHeight - note.offsetHeight;

        note.style.left = Math.min(Math.max(0, newX), maxX) + "px";
        note.style.top = Math.min(Math.max(0, newY), maxY) + "px";
    });

    document.addEventListener("mouseup", () => {
        if (!isDragging) return;
        isDragging = false;

        chrome.runtime.sendMessage({
            type: "save_position",
            id: noteId,
            pos: { x: note.offsetLeft, y: note.offsetTop }
        });
    });

    // --- Кнопка закрытия ---
    closeBtn.addEventListener("click", () => {
        note.style.display = "none";
    });

    // Ограничение размера заметки
    note.addEventListener("resize", () => {
        const maxWidth = window.innerWidth - note.offsetLeft;
        const maxHeight = window.innerHeight - note.offsetTop;
        note.style.width = Math.min(note.offsetWidth, maxWidth) + "px";
        note.style.height = Math.min(note.offsetHeight, maxHeight) + "px";
    });
}
