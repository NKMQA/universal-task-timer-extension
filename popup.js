const timerDiv = document.getElementById("timer");
const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");
const exportBtn = document.getElementById("exportBtn");
const clearBtn = document.getElementById("clearBtn");
const addParamBtn = document.getElementById("addParamBtn");

const employeeInput = document.getElementById("employee");
const reportInput = document.getElementById("report");
const dateInput = document.getElementById("reportDate");
const paramsContainer = document.getElementById("paramsContainer");

let timerInterval = null;

/* Add Parameter */
function addParam(key = "", value = "") {
  const row = document.createElement("div");
  row.className = "param-row";
  row.innerHTML = `
    <input class="paramKey" placeholder="Key" value="${key}">
    <input class="paramValue" placeholder="Value" value="${value}">
  `;
  paramsContainer.appendChild(row);
}

addParamBtn.addEventListener("click", () => addParam());

/* Format Duration */
function formatDuration(seconds) {
  if (seconds < 60) return seconds + "s";
  if (seconds < 3600) return Math.floor(seconds / 60) + "m " + (seconds % 60) + "s";
  return Math.floor(seconds / 3600) + "h " + Math.floor((seconds % 3600) / 60) + "m";
}

/* Update Timer */
function updateTimer() {

  chrome.runtime.sendMessage({ action: "getTime" }, (res) => {

    if (res && res.currentStartTime) {

      const seconds = Math.floor(
        (new Date() - new Date(res.currentStartTime)) / 1000
      );

      timerDiv.textContent = formatDuration(seconds);
      startBtn.disabled = true;
      stopBtn.disabled = false;

      if (!timerInterval) {
        timerInterval = setInterval(updateTimer, 1000);
      }

    } else {

      timerDiv.textContent = "Not Running";
      startBtn.disabled = false;
      stopBtn.disabled = true;

      if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
      }

    }

  });

}

/* Start */
startBtn.addEventListener("click", () => {

  if (!employeeInput.value || !reportInput.value || !dateInput.value) {
    alert("Please fill all fields");
    return;
  }

  // --------- SAVE CURRENT SESSION (NEW) ----------
  const parameters = [];

  document.querySelectorAll(".param-row").forEach(row => {
    const key = row.querySelector(".paramKey").value.trim();
    const value = row.querySelector(".paramValue").value.trim();
    if (key || value) parameters.push({ key, value });
  });

  chrome.storage.local.set({
    currentSession: {
      employee: employeeInput.value,
      report: reportInput.value,
      date: dateInput.value,
      parameters
    }
  });
  // -----------------------------------------------

  chrome.runtime.sendMessage({ action: "startTimer" }, () => {
    updateTimer();
  });

});

/* Stop */
stopBtn.addEventListener("click", () => {

  chrome.runtime.sendMessage({ action: "stopTimer" }, (res) => {

    if (!res || !res.stopped) {
      alert("Timer not running");
      return;
    }

    const parameters = [];

    document.querySelectorAll(".param-row").forEach(row => {
      const key = row.querySelector(".paramKey").value.trim();
      const value = row.querySelector(".paramValue").value.trim();
      if (key || value) parameters.push({ key, value });
    });

    chrome.storage.local.get("logs", (data) => {

      const logs = data.logs || [];

      logs.push({
        employee: employeeInput.value,
        report: reportInput.value,
        date: dateInput.value,
        start: res.startTime,
        end: new Date().toISOString(),
        parameters
      });

      chrome.storage.local.set({ logs }, () => {

        // --------- CLEAR SAVED SESSION (NEW) ----------
        chrome.storage.local.remove("currentSession");
        // ---------------------------------------------

        refreshLogsTable();
        updateTimer();
      });

    });

  });

});

/* Export */
exportBtn.addEventListener("click", () => {

  chrome.storage.local.get("logs", (data) => {

    if (!data.logs || !data.logs.length) {
      alert("No logs to export");
      return;
    }

    let csv = "Employee,Report,Date,Start,End,Duration(seconds),Parameters\n";

    data.logs.forEach(log => {

      const start = new Date(log.start);
      const end = new Date(log.end);
      const duration = Math.floor((end - start) / 1000);

      const params = (log.parameters || [])
        .map(p => `${p.key}:${p.value}`)
        .join(" | ");

      csv += `"${log.employee}","${log.report}","${log.date}","${log.start}","${log.end}","${duration}","${params}"\n`;

    });

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    chrome.downloads.download({
      url: url,
      filename: "Universal_Task_Timer_Logs.csv",
      saveAs: true
    });

  });

});

/* Clear */
clearBtn.addEventListener("click", () => {
  if (!confirm("Clear all data?")) return;

  chrome.storage.local.clear(() => {
    refreshLogsTable();
    updateTimer();
  });
});

/* Refresh Logs */
function refreshLogsTable() {

  chrome.storage.local.get("logs", (data) => {

    const body = document.getElementById("logsBody");
    const totalTimeEl = document.getElementById("totalTime");

    body.innerHTML = "";
    let totalSeconds = 0;

    const logs = data.logs || [];

    logs.forEach((log, index) => {

      const duration = Math.floor(
        (new Date(log.end) - new Date(log.start)) / 1000
      );

      totalSeconds += duration;

      const params = (log.parameters || [])
        .map(p => `${p.key}:${p.value}`)
        .join(" | ");

      const row = document.createElement("tr");

      row.innerHTML = `
        <td>${log.employee}</td>
        <td>${log.report}</td>
        <td>${log.date}</td>
        <td>${log.start}</td>
        <td>${log.end}</td>
        <td>${duration}s</td>
        <td>${params}</td>
        <td><button class="deleteBtn" data-index="${index}">Delete</button></td>
      `;

      body.appendChild(row);

    });

    totalTimeEl.textContent = formatDuration(totalSeconds);

    document.querySelectorAll(".deleteBtn").forEach(btn => {
      btn.addEventListener("click", function () {
        logs.splice(this.dataset.index, 1);
        chrome.storage.local.set({ logs }, refreshLogsTable);
      });
    });

  });

}

/* Restore current running session (NEW) */
function restoreCurrentSession() {

  chrome.runtime.sendMessage({ action: "getTime" }, (res) => {

    if (!res || !res.currentStartTime) return;

    chrome.storage.local.get("currentSession", (data) => {

      if (!data.currentSession) return;

      const s = data.currentSession;

      employeeInput.value = s.employee || "";
      reportInput.value = s.report || "";
      dateInput.value = s.date || "";

      paramsContainer.innerHTML = "";

      (s.parameters || []).forEach(p => {
        addParam(p.key, p.value);
      });

    });

  });

}

updateTimer();
refreshLogsTable();
restoreCurrentSession();