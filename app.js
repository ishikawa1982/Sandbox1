(() => {
  "use strict";

  const STORAGE_KEY = "todo-app.items";

  /** @typedef {{ id: string, text: string, completed: boolean, createdAt: number }} Todo */

  /** @type {Todo[]} */
  let todos = [];
  let currentFilter = "all";

  // --- DOM ---
  const form = document.getElementById("todo-form");
  const input = document.getElementById("todo-input");
  const list = document.getElementById("todo-list");
  const emptyMessage = document.getElementById("empty-message");
  const countLabel = document.getElementById("todo-count");
  const clearCompletedBtn = document.getElementById("clear-completed");
  const filterButtons = document.querySelectorAll(".filters__button");

  // --- 永続化 ---
  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      todos = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(todos)) todos = [];
    } catch {
      todos = [];
    }
  }

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
    } catch {
      /* 保存できなくてもアプリは継続 */
    }
  }

  // --- 操作 ---
  function addTodo(text) {
    const trimmed = text.trim();
    if (!trimmed) return;
    todos.unshift({
      id: (crypto.randomUUID && crypto.randomUUID()) || String(Date.now() + Math.random()),
      text: trimmed,
      completed: false,
      createdAt: Date.now(),
    });
    save();
    render();
  }

  function toggleTodo(id) {
    const todo = todos.find((t) => t.id === id);
    if (todo) {
      todo.completed = !todo.completed;
      save();
      render();
    }
  }

  function deleteTodo(id) {
    todos = todos.filter((t) => t.id !== id);
    save();
    render();
  }

  function editTodo(id, text) {
    const trimmed = text.trim();
    const todo = todos.find((t) => t.id === id);
    if (!todo) return;
    if (trimmed) {
      todo.text = trimmed;
    } else {
      todos = todos.filter((t) => t.id !== id);
    }
    save();
    render();
  }

  function clearCompleted() {
    todos = todos.filter((t) => !t.completed);
    save();
    render();
  }

  function getVisibleTodos() {
    if (currentFilter === "active") return todos.filter((t) => !t.completed);
    if (currentFilter === "completed") return todos.filter((t) => t.completed);
    return todos;
  }

  // --- 描画 ---
  function render() {
    const visible = getVisibleTodos();
    list.innerHTML = "";

    visible.forEach((todo) => list.appendChild(createItem(todo)));

    emptyMessage.hidden = visible.length > 0;
    const remaining = todos.filter((t) => !t.completed).length;
    countLabel.textContent = `${remaining} 件の未完了`;
  }

  function createItem(todo) {
    const li = document.createElement("li");
    li.className = "todo-item" + (todo.completed ? " is-completed" : "");
    li.dataset.id = todo.id;

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "todo-item__checkbox";
    checkbox.checked = todo.completed;
    checkbox.setAttribute("aria-label", "完了切り替え");
    checkbox.addEventListener("change", () => toggleTodo(todo.id));

    const text = document.createElement("span");
    text.className = "todo-item__text";
    text.textContent = todo.text;
    text.title = "ダブルクリックで編集";
    text.addEventListener("dblclick", () => startEdit(li, todo));

    const del = document.createElement("button");
    del.type = "button";
    del.className = "todo-item__delete";
    del.textContent = "×";
    del.setAttribute("aria-label", "削除");
    del.addEventListener("click", () => deleteTodo(todo.id));

    li.append(checkbox, text, del);
    return li;
  }

  function startEdit(li, todo) {
    const editInput = document.createElement("input");
    editInput.type = "text";
    editInput.className = "todo-item__edit";
    editInput.value = todo.text;
    editInput.maxLength = 200;

    const textEl = li.querySelector(".todo-item__text");
    li.replaceChild(editInput, textEl);
    editInput.focus();
    editInput.setSelectionRange(editInput.value.length, editInput.value.length);

    let done = false;
    const commit = () => {
      if (done) return;
      done = true;
      editTodo(todo.id, editInput.value);
    };

    editInput.addEventListener("blur", commit);
    editInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        commit();
      } else if (e.key === "Escape") {
        done = true;
        render();
      }
    });
  }

  // --- イベント ---
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    addTodo(input.value);
    input.value = "";
    input.focus();
  });

  clearCompletedBtn.addEventListener("click", clearCompleted);

  filterButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      currentFilter = btn.dataset.filter;
      filterButtons.forEach((b) => b.classList.toggle("is-active", b === btn));
      render();
    });
  });

  // --- 起動 ---
  load();
  render();
})();
