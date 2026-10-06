const DATA_URL = "data/parking.json";

let allRecords = [];
let meta = {};

async function loadData() {
  const res = await fetch(DATA_URL);
  if (!res.ok) throw new Error("Could not load parking data");
  const data = await res.json();
  meta = { societyName: data.societyName, tower: data.tower };
  allRecords = data.records || [];
}

function updateStats(records) {
  const total = records.length;
  const allocated = records.filter((r) => r.status === "Allocated").length;
  const pending = records.filter((r) => r.status === "Pending").length;

  document.getElementById("stat-total").textContent = total;
  document.getElementById("stat-allocated").textContent = allocated;
  document.getElementById("stat-pending").textContent = pending;
}

function renderTable(records) {
  const tbody = document.getElementById("records-body");
  if (!records.length) {
    tbody.innerHTML =
      '<tr><td colspan="11" class="empty-state">No records match your search.</td></tr>';
    return;
  }

  tbody.innerHTML = records
    .map(
      (r) => `
    <tr>
      <td>${r.id}</td>
      <td>${escapeHtml(r.tower)}</td>
      <td>${escapeHtml(r.flatNo)}</td>
      <td>${escapeHtml(r.residentName)}</td>
      <td>${escapeHtml(r.residentType)}</td>
      <td>${escapeHtml(r.contactNumber)}</td>
      <td>${escapeHtml(r.vehicleType)}</td>
      <td>${escapeHtml(r.bayType)}</td>
      <td>${escapeHtml(r.slotNo)}</td>
      <td><span class="badge badge-${r.status === "Allocated" ? "allocated" : "pending"}">${escapeHtml(r.status)}</span></td>
      <td>${escapeHtml(r.remarks || "")}</td>
    </tr>`
    )
    .join("");
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function filterRecords() {
  const q = document.getElementById("search").value.trim().toLowerCase();
  const status = document.getElementById("filter-status").value;
  const bay = document.getElementById("filter-bay").value;

  let filtered = allRecords;

  if (status) filtered = filtered.filter((r) => r.status === status);
  if (bay) filtered = filtered.filter((r) => r.bayType === bay);
  if (q) {
    filtered = filtered.filter((r) =>
      [
        r.flatNo,
        r.residentName,
        r.contactNumber,
        r.slotNo,
        r.bayType,
        r.remarks,
      ]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }

  updateStats(filtered);
  renderTable(filtered);
}

async function init() {
  try {
    await loadData();
    document.getElementById("society-name").textContent = meta.societyName;
    document.getElementById("tower-name").textContent = `Tower ${meta.tower}`;

    document.getElementById("search").addEventListener("input", filterRecords);
    document.getElementById("filter-status").addEventListener("change", filterRecords);
    document.getElementById("filter-bay").addEventListener("change", filterRecords);

    filterRecords();
  } catch (err) {
    document.getElementById("records-body").innerHTML =
      `<tr><td colspan="11" class="empty-state">Failed to load data. ${escapeHtml(err.message)}</td></tr>`;
  }
}

init();
