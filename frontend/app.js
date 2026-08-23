const TOKEN_KEY = "claude_tracker_access_token";
const THEME_KEY = "claude_tracker_theme";

function currentTheme() {
  return document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark";
}

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem(THEME_KEY, theme);
  const icon = document.querySelector("#theme-toggle .theme-toggle-icon");
  if (icon) icon.innerHTML = theme === "dark" ? "&#9728;" : "&#9789;";
}

document.querySelector("#theme-toggle")?.addEventListener("click", () => {
  applyTheme(currentTheme() === "dark" ? "light" : "dark");
});
applyTheme(currentTheme());

const state = {
  token: localStorage.getItem(TOKEN_KEY),
  user: null,
  projects: [],
  sessions: [],
  summary: null,
};

const elements = {
  authView: document.querySelector("#auth-view"),
  dashboardView: document.querySelector("#dashboard-view"),
  dashboardLoading: document.querySelector("#dashboard-loading"),
  dashboardContent: document.querySelector("#dashboard-content"),
  loginForm: document.querySelector("#login-form"),
  registerForm: document.querySelector("#register-form"),
  projectForm: document.querySelector("#project-form"),
  sessionForm: document.querySelector("#session-form"),
};

async function api(path, options = {}) {
  const headers = { "Content-Type": "application/json", ...options.headers };
  if (state.token) headers.Authorization = `Bearer ${state.token}`;

  const response = await fetch(path, { ...options, headers });
  if (response.status === 401 && state.token && !path.endsWith("/login")) {
    clearSession();
    throw new Error("Your session expired. Sign in again.");
  }

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const detail = Array.isArray(payload.detail)
      ? payload.detail.map((item) => item.msg).join(". ")
      : payload.detail;
    throw new Error(detail || `Request failed (${response.status})`);
  }
  return payload;
}

function setButtonBusy(button, busy, label = "Working…") {
  if (!button) return;
  if (busy) {
    button.dataset.originalLabel = button.innerHTML;
    button.innerHTML = label;
    button.disabled = true;
  } else {
    button.innerHTML = button.dataset.originalLabel || button.innerHTML;
    button.disabled = false;
  }
}

function showFormError(form, message = "") {
  const output = form.querySelector("[data-form-error]");
  output.textContent = message;
  output.hidden = !message;
}

function toast(message, type = "success") {
  const item = document.createElement("div");
  item.className = `toast ${type === "error" ? "error" : ""}`;
  item.textContent = message;
  document.querySelector("#toast-region").append(item);
  window.setTimeout(() => item.remove(), 3600);
}

function switchAuth(mode) {
  const isLogin = mode === "login";
  document.querySelector("#login-panel").hidden = !isLogin;
  document.querySelector("#register-panel").hidden = isLogin;
  document.querySelectorAll("[data-auth-tab]").forEach((tab) => {
    const active = tab.dataset.authTab === mode;
    tab.classList.toggle("active", active);
    tab.setAttribute("aria-selected", String(active));
  });
}

function clearSession() {
  state.token = null;
  state.user = null;
  localStorage.removeItem(TOKEN_KEY);
  elements.dashboardView.hidden = true;
  elements.authView.hidden = false;
  elements.dashboardContent.hidden = true;
  switchAuth("login");
}

function showDashboardShell() {
  elements.authView.hidden = true;
  elements.dashboardView.hidden = false;
  elements.dashboardLoading.innerHTML = '<span class="spinner"></span><p>Loading your workspace…</p>';
  elements.dashboardLoading.hidden = false;
  elements.dashboardContent.hidden = true;
}

function formatTokens(value) {
  const number = Number(value) || 0;
  if (number >= 1_000_000) return `${(number / 1_000_000).toFixed(1)}M`;
  if (number >= 1_000) return `${(number / 1_000).toFixed(number >= 100_000 ? 0 : 1)}K`;
  return number.toLocaleString();
}

function formatCost(value) {
  const number = Number(value) || 0;
  if (number === 0) return "$0.00";
  if (number < .01) return `$${number.toFixed(4)}`;
  return `$${number.toFixed(2)}`;
}

function modelLabel(model) {
  return model.replace("claude-", "").replaceAll("-", " ");
}

function projectName(projectId) {
  return state.projects.find((project) => project.id === projectId)?.name || "Unknown project";
}

function renderMetrics() {
  const summary = state.summary;
  const totalTokens = summary.total_input_tokens + summary.total_output_tokens;
  document.querySelector("#metric-projects").textContent = state.projects.length.toLocaleString();
  document.querySelector("#metric-sessions").textContent = summary.total_sessions.toLocaleString();
  document.querySelector("#metric-tokens").textContent = formatTokens(totalTokens);
  document.querySelector("#metric-cost").textContent = formatCost(summary.total_cost_usd);
}

function renderSessions() {
  const body = document.querySelector("#sessions-body");
  const empty = document.querySelector("#sessions-empty");
  body.replaceChildren();
  empty.hidden = state.sessions.length > 0;

  state.sessions.slice(0, 6).forEach((session) => {
    const row = document.createElement("tr");
    const cells = [
      { text: projectName(session.project_id), className: "project-cell" },
      { text: modelLabel(session.model), className: "model-badge-cell" },
      { text: Number(session.input_tokens).toLocaleString() },
      { text: Number(session.output_tokens).toLocaleString() },
      { text: formatCost(session.cost_usd), className: "cost-cell" },
    ];
    cells.forEach(({ text, className }) => {
      const cell = document.createElement("td");
      if (className === "model-badge-cell") {
        const badge = document.createElement("span");
        badge.className = "model-badge";
        badge.textContent = text;
        cell.append(badge);
      } else {
        if (className) cell.className = className;
        cell.textContent = text;
      }
      row.append(cell);
    });
    body.append(row);
  });
}

function renderProjects() {
  const list = document.querySelector("#projects-list");
  const empty = document.querySelector("#projects-empty");
  const select = document.querySelector("#session-project");
  list.replaceChildren();
  select.replaceChildren(new Option("Choose a project", ""));
  empty.hidden = state.projects.length > 0;

  state.projects.slice(0, 5).forEach((project) => {
    const sessionCount = state.sessions.filter((session) => session.project_id === project.id).length;
    const item = document.createElement("article");
    item.className = "project-item";

    const symbol = document.createElement("span");
    symbol.className = "project-symbol";
    symbol.textContent = project.name.slice(0, 1).toUpperCase();

    const info = document.createElement("div");
    info.className = "project-info";
    const name = document.createElement("strong");
    name.textContent = project.name;
    const description = document.createElement("span");
    description.textContent = project.description || "No description";
    info.append(name, description);

    const count = document.createElement("span");
    count.className = "project-count";
    count.textContent = `${sessionCount} ${sessionCount === 1 ? "session" : "sessions"}`;
    item.append(symbol, info, count);
    list.append(item);

    select.add(new Option(project.name, String(project.id)));
  });
}

function renderDashboard() {
  document.querySelector("#user-avatar").textContent = state.user.username.slice(0, 1).toUpperCase();
  renderMetrics();
  renderSessions();
  renderProjects();
  elements.dashboardLoading.hidden = true;
  elements.dashboardContent.hidden = false;
}

async function loadDashboard() {
  showDashboardShell();
  try {
    const [user, projects, sessions, summary] = await Promise.all([
      api("/auth/me"),
      api("/projects"),
      api("/sessions"),
      api("/analytics/summary"),
    ]);
    Object.assign(state, { user, projects, sessions, summary });
    renderDashboard();
  } catch (error) {
    if (state.token) {
      toast(error.message, "error");
      elements.dashboardLoading.innerHTML = `<p>Could not load the dashboard.</p><button class="button button-secondary" type="button" id="retry-dashboard">Try again</button>`;
      document.querySelector("#retry-dashboard")?.addEventListener("click", loadDashboard, { once: true });
    }
  }
}

async function handleLogin(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const button = form.querySelector("[type=submit]");
  const data = Object.fromEntries(new FormData(form));
  showFormError(form);
  setButtonBusy(button, true, "Signing in…");
  try {
    const tokens = await api("/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
    });
    state.token = tokens.access_token;
    localStorage.setItem(TOKEN_KEY, state.token);
    form.reset();
    await loadDashboard();
  } catch (error) {
    showFormError(form, error.message);
  } finally {
    setButtonBusy(button, false);
  }
}

async function handleRegister(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const button = form.querySelector("[type=submit]");
  const data = Object.fromEntries(new FormData(form));
  showFormError(form);
  setButtonBusy(button, true, "Creating account…");
  try {
    await api("/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    });
    const tokens = await api("/auth/login", {
      method: "POST",
      body: JSON.stringify({ username: data.username, password: data.password }),
    });
    state.token = tokens.access_token;
    localStorage.setItem(TOKEN_KEY, state.token);
    form.reset();
    toast("Account created. Add your first project.");
    await loadDashboard();
    window.setTimeout(() => openModal("project-modal"), 250);
  } catch (error) {
    showFormError(form, error.message);
  } finally {
    setButtonBusy(button, false);
  }
}

async function handleProjectCreate(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const button = form.querySelector("[type=submit]");
  const data = Object.fromEntries(new FormData(form));
  showFormError(form);
  setButtonBusy(button, true, "Creating…");
  try {
    await api("/projects", { method: "POST", body: JSON.stringify(data) });
    form.reset();
    closeModal(form.closest("dialog"));
    toast("Project created.");
    await loadDashboard();
  } catch (error) {
    showFormError(form, error.message);
  } finally {
    setButtonBusy(button, false);
  }
}

async function handleSessionCreate(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const button = form.querySelector("[type=submit]");
  const raw = Object.fromEntries(new FormData(form));
  const data = {
    ...raw,
    project_id: Number(raw.project_id),
    input_tokens: Number(raw.input_tokens),
    output_tokens: Number(raw.output_tokens),
  };
  showFormError(form);
  setButtonBusy(button, true, "Saving…");
  try {
    await api("/sessions", { method: "POST", body: JSON.stringify(data) });
    form.reset();
    closeModal(form.closest("dialog"));
    toast("Session logged. Analytics updated.");
    await loadDashboard();
  } catch (error) {
    showFormError(form, error.message);
  } finally {
    setButtonBusy(button, false);
  }
}

function openModal(id) {
  if (id === "session-modal" && state.projects.length === 0) {
    toast("Create a project before logging a session.", "error");
    document.querySelector("#project-modal").showModal();
    return;
  }
  document.querySelector(`#${id}`).showModal();
}

function closeModal(dialog) {
  if (dialog?.open) dialog.close();
}

document.querySelectorAll("[data-auth-tab]").forEach((button) => {
  button.addEventListener("click", () => switchAuth(button.dataset.authTab));
});
document.querySelectorAll("[data-switch-auth]").forEach((button) => {
  button.addEventListener("click", () => switchAuth(button.dataset.switchAuth));
});
document.querySelectorAll("[data-open-modal]").forEach((button) => {
  button.addEventListener("click", () => openModal(button.dataset.openModal));
});
document.querySelectorAll("[data-close-modal]").forEach((button) => {
  button.addEventListener("click", () => closeModal(button.closest("dialog")));
});
document.querySelectorAll("dialog").forEach((dialog) => {
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) closeModal(dialog);
  });
});

elements.loginForm.addEventListener("submit", handleLogin);
elements.registerForm.addEventListener("submit", handleRegister);
elements.projectForm.addEventListener("submit", handleProjectCreate);
elements.sessionForm.addEventListener("submit", handleSessionCreate);
document.querySelector("#logout-button").addEventListener("click", () => {
  clearSession();
  toast("Signed out.");
});

if (state.token) loadDashboard();
