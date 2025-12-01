const notesList = document.getElementById("notesList");
const editor = document.getElementById("editor");
const currentNoteTitle = document.getElementById("currentNoteTitle");
const newNoteBtn = document.getElementById("newNoteBtn");
const deleteNoteBtn = document.getElementById("deleteNoteBtn");
const autoOpenToggle = document.getElementById("autoOpenToggle");

let currentNoteId = null;

// Загрузка всех заметок
function loadNotes() {
    notesList.innerHTML = "";
    chrome.storage.local.get(null, data => {
        const entries = Object.entries(data).filter(([key, value]) => value && typeof value === "object" && !key.endsWith("_pos"));
        entries.sort((a, b) => a[1].title.localeCompare(b[1].title));

        entries.forEach(([id, note]) => {
            const li = document.createElement("li");
            li.textContent = note.title;
            li.dataset.id = id;
            li.addEventListener("click", () => selectNote(id));
            notesList.appendChild(li);
        });
    });
}

// Выбор заметки
function selectNote(id) {
    currentNoteId = id;
    chrome.storage.local.get(id, data => {
        const note = data[id] || { title: "", text: "" };
        currentNoteTitle.textContent = note.title;
        editor.value = note.text || "";

        // Выделение в списке
        Array.from(notesList.children).forEach(li => li.classList.toggle("selected", li.dataset.id === id));

        // Галочка авто-открытия
        chrome.storage.sync.get("autoOpenSites", data => {
            const autoSites = data.autoOpenSites || {};
            autoOpenToggle.checked = !!autoSites[currentNoteId];
        });
    });
}

// Сохранение текста заметки
editor.addEventListener("input", () => {
    if (!currentNoteId) return;
    chrome.storage.local.get(currentNoteId, data => {
        const note = data[currentNoteId] || { title: currentNoteTitle.textContent, text: "" };
        note.text = editor.value;
        chrome.storage.local.set({ [currentNoteId]: note });
    });
});

// Создание новой заметки
newNoteBtn.addEventListener("click", () => {
    let title = prompt("Введите название новой заметки:");
    if (!title) return;
    title = title.trim();
    const id = crypto.randomUUID();
    const note = { title, text: "" };
    chrome.storage.local.set({ [id]: note }, () => {
        loadNotes();
        selectNote(id);
    });
});

// Удаление заметки
deleteNoteBtn.addEventListener("click", () => {
    if (!currentNoteId) return;
    if (!confirm(`Удалить заметку "${currentNoteTitle.textContent}"?`)) return;
    chrome.storage.local.remove(currentNoteId, () => {
        currentNoteId = null;
        editor.value = "";
        currentNoteTitle.textContent = "Выберите заметку";
        autoOpenToggle.checked = false;
        loadNotes();
    });
});

// Переключатель авто-открытия
autoOpenToggle.addEventListener("change", () => {
    if (!currentNoteId) return;
    chrome.storage.sync.get("autoOpenSites", data => {
        const autoSites = data.autoOpenSites || {};
        if (autoOpenToggle.checked) {
            autoSites[currentNoteId] = true;
        } else {
            delete autoSites[currentNoteId];
        }
        chrome.storage.sync.set({ autoOpenSites });
    });
});

// Инициализация
loadNotes();
