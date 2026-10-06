const DATA_URL = "data/parking.json";
const CONFIG_KEY = "parkingAdminConfig";
const AUTH_KEY = "parkingAdminAuth";

const DEFAULT_ADMIN_PASSWORD = "admin123";

let data = { societyName: "", tower: "", records: [] };
let editingId = null;
let fileSha = null;

function getConfig() {
  try {
    return JSON.parse(localStorage.getItem(CONFIG_KEY) || "{}");
  } catch {
    return {};
  }
}

function saveConfig(config) {
  localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
}

function isAuthenticated() {
  return sessionStorage.getItem(AUTH_KEY) === "true";
}

function showMessage(text, type = "info") {
  const el = document.getElementById("message");
  el.className = `message ${type}`;
  el.textContent = text;
  el.hidden = false;
}

function hideMessage() {
  document.getElementById("message").hidden = true;
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function loadData() {
  const res = await fetch(DATA_URL);
  if (!res.ok) throw new Error("Could not load parking data");
  data = await res.json();
}

async function fetchFileSha() {
  const cfg = getConfig();
  if (!cfg.owner || !cfg.repo || !cfg.token) return null;

  const path = cfg.dataPath || "data/parking.json";
  const branch = cfg.branch || "main";
  const url = `https://api.github.com/repos/${cfg.owner}/${cfg.repo}/contents/${path}?ref=${branch}`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${cfg.token}`,
      Accept: "application/vnd.github+json",
    },
  });

  if (!res.ok) return null;
  const json = await res.json();
  return json.sha;
}

function nextId() {
  if (!data.records.length) return 1;
  return Math.max(...data.records.map((r) => Number(r.id) || 0)) + 1;
}

function renderAdminTable() {
  const tbody = document.getElementById("admin-records-body");
  tbody.innerHTML = data.records
    .map(
      (r) => `
    <tr>
      <td>${r.id}</td>
      <td>${escapeHtml(r.flatNo)}</td>
      <td>${escapeHtml(r.residentName)}</td>
      <td>${escapeHtml(r.slotNo)}</td>
      <td>${escapeHtml(r.status)}</td>
      <td>
        <button class="btn btn-secondary btn-sm" data-edit="${r.id}">Edit</button>
        <button class="btn btn-danger btn-sm" data-delete="${r.id}">Delete</button>
      </td>
    </tr>`
    )
    .join("");

  tbody.querySelectorAll("[data-edit]").forEach((btn) => {
    btn.addEventListener("click", () => startEdit(Number(btn.dataset.edit)));
  });
  tbody.querySelectorAll("[data-delete]").forEach((btn) => {
    btn.addEventListener("click", () => deleteRecord(Number(btn.dataset.delete)));
  });
}

function getFormValues() {
  return {
    tower: document.getElementById("tower").value.trim(),
    flatNo: document.getElementById("flatNo").value.trim(),
    residentName: document.getElementById("residentName").value.trim(),
    residentType: document.getElementById("residentType").value,
    contactNumber: document.getElementById("contactNumber").value.trim(),
    vehicleType: document.getElementById("vehicleType").value,
    bayType: document.getElementById("bayType").value,
    slotNo: document.getElementById("slotNo").value.trim(),
    status: document.getElementById("status").value,
    remarks: document.getElementById("remarks").value.trim(),
  };
}

function setFormValues(record) {
  document.getElementById("tower").value = record.tower || data.tower || "B";
  document.getElementById("flatNo").value = record.flatNo || "";
  document.getElementById("residentName").value = record.residentName || "";
  document.getElementById("residentType").value = record.residentType || "Owner";
  document.getElementById("contactNumber").value = record.contactNumber || "";
  document.getElementById("vehicleType").value = record.vehicleType || "Car";
  document.getElementById("bayType").value = record.bayType || "Open";
  document.getElementById("slotNo").value = record.slotNo || "";
  document.getElementById("status").value = record.status || "Allocated";
  document.getElementById("remarks").value = record.remarks || "";
}

function resetForm() {
  editingId = null;
  document.getElementById("form-title").textContent = "Add New Record";
  document.getElementById("save-btn").textContent = "Add Record";
  setFormValues({ tower: data.tower || "B" });
}

function startEdit(id) {
  const record = data.records.find((r) => r.id === id);
  if (!record) return;
  editingId = id;
  document.getElementById("form-title").textContent = `Edit Record #${id}`;
  document.getElementById("save-btn").textContent = "Save Changes";
  setFormValues(record);
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function deleteRecord(id) {
  if (!confirm(`Delete record #${id}?`)) return;
  data.records = data.records.filter((r) => r.id !== id);
  renderAdminTable();
  showMessage(`Record #${id} deleted. Click "Publish to GitHub" to save online.`, "info");
}

function validateForm(values) {
  if (!values.flatNo || !values.residentName) {
    showMessage("Flat No. and Resident Name are required.", "error");
    return false;
  }
  return true;
}

function handleSave(e) {
  e.preventDefault();
  hideMessage();
  const values = getFormValues();
  if (!validateForm(values)) return;

  if (editingId) {
    data.records = data.records.map((r) =>
      r.id === editingId ? { ...r, ...values } : r
    );
    showMessage(`Record #${editingId} updated locally. Publish to GitHub to save online.`, "success");
  } else {
    const newRecord = { id: nextId(), ...values };
    data.records.push(newRecord);
    showMessage(`Record #${newRecord.id} added locally. Publish to GitHub to save online.`, "success");
  }

  renderAdminTable();
  resetForm();
}

function buildPayload() {
  return {
    societyName: data.societyName,
    tower: data.tower,
    records: data.records,
  };
}

function downloadJson() {
  const blob = new Blob([JSON.stringify(buildPayload(), null, 2)], {
    type: "application/json",
  });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "parking.json";
  a.click();
  URL.revokeObjectURL(a.href);
  showMessage("Downloaded parking.json — replace data/parking.json in your repo and push.", "success");
}

async function publishToGitHub() {
  const cfg = getConfig();
  if (!cfg.owner || !cfg.repo || !cfg.token) {
    showMessage("Configure GitHub settings first (owner, repo, token).", "error");
    return;
  }

  const path = cfg.dataPath || "data/parking.json";
  const branch = cfg.branch || "main";
  const content = btoa(unescape(encodeURIComponent(JSON.stringify(buildPayload(), null, 2))));

  if (!fileSha) fileSha = await fetchFileSha();

  const url = `https://api.github.com/repos/${cfg.owner}/${cfg.repo}/contents/${path}`;
  const body = {
    message: "Update parking records via admin panel",
    content,
    branch,
  };
  if (fileSha) body.sha = fileSha;

  showMessage("Publishing to GitHub...", "info");

  const res = await fetch(url, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${cfg.token}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    showMessage(err.message || "Failed to publish to GitHub.", "error");
    return;
  }

  const result = await res.json();
  fileSha = result.content?.sha || null;
  showMessage("Published! Site will update in ~1 minute after GitHub Actions deploys.", "success");
}

function importJsonFile(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const imported = JSON.parse(reader.result);
      if (!Array.isArray(imported.records)) throw new Error("Invalid format");
      data = imported;
      renderAdminTable();
      showMessage("Imported JSON successfully.", "success");
    } catch {
      showMessage("Invalid JSON file.", "error");
    }
  };
  reader.readAsText(file);
}

function saveGitHubConfig(e) {
  e.preventDefault();
  const config = {
    owner: document.getElementById("gh-owner").value.trim(),
    repo: document.getElementById("gh-repo").value.trim(),
    branch: document.getElementById("gh-branch").value.trim() || "main",
    dataPath: document.getElementById("gh-path").value.trim() || "data/parking.json",
    token: document.getElementById("gh-token").value.trim(),
    adminPassword: document.getElementById("admin-password").value.trim() || DEFAULT_ADMIN_PASSWORD,
  };
  saveConfig(config);
  showMessage("Settings saved in this browser.", "success");
}

function loadGitHubConfigForm() {
  const cfg = getConfig();
  document.getElementById("gh-owner").value = cfg.owner || "";
  document.getElementById("gh-repo").value = cfg.repo || "";
  document.getElementById("gh-branch").value = cfg.branch || "main";
  document.getElementById("gh-path").value = cfg.dataPath || "data/parking.json";
  document.getElementById("gh-token").value = cfg.token || "";
  document.getElementById("admin-password").value = cfg.adminPassword || DEFAULT_ADMIN_PASSWORD;
}

function showAdminApp() {
  document.getElementById("login-section").hidden = true;
  document.getElementById("admin-app").hidden = false;
}

function handleLogin(e) {
  e.preventDefault();
  const cfg = getConfig();
  const password = cfg.adminPassword || DEFAULT_ADMIN_PASSWORD;
  const input = document.getElementById("login-password").value;
  if (input !== password) {
    showMessage("Incorrect password.", "error");
    return;
  }
  sessionStorage.setItem(AUTH_KEY, "true");
  showAdminApp();
  hideMessage();
}

async function initAdmin() {
  loadGitHubConfigForm();

  if (isAuthenticated()) {
    showAdminApp();
  }

  document.getElementById("login-form").addEventListener("submit", handleLogin);
  document.getElementById("record-form").addEventListener("submit", handleSave);
  document.getElementById("reset-form-btn").addEventListener("click", resetForm);
  document.getElementById("download-json-btn").addEventListener("click", downloadJson);
  document.getElementById("publish-btn").addEventListener("click", publishToGitHub);
  document.getElementById("github-config-form").addEventListener("submit", saveGitHubConfig);
  document.getElementById("import-json").addEventListener("change", (e) => {
    if (e.target.files[0]) importJsonFile(e.target.files[0]);
    e.target.value = "";
  });

  try {
    await loadData();
    fileSha = await fetchFileSha();
    resetForm();
    renderAdminTable();
  } catch (err) {
    showMessage(`Failed to load data: ${err.message}`, "error");
  }
}

initAdmin();
