chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {

  if (msg.action === "startTimer") {

    chrome.storage.local.get("currentStartTime", (data) => {

      if (data.currentStartTime) {
        sendResponse({ started: false });
        return;
      }

      const startTime = new Date().toISOString();

      chrome.storage.local.set({ currentStartTime: startTime }, () => {
        sendResponse({ started: true, startTime });
      });

    });

    return true;
  }

  if (msg.action === "stopTimer") {

    chrome.storage.local.get("currentStartTime", (data) => {

      if (!data.currentStartTime) {
        sendResponse({ stopped: false });
        return;
      }

      const startTime = data.currentStartTime;

      chrome.storage.local.remove("currentStartTime", () => {
        sendResponse({ stopped: true, startTime });
      });

    });

    return true;
  }

  if (msg.action === "getTime") {

    chrome.storage.local.get("currentStartTime", (data) => {
      sendResponse({ currentStartTime: data.currentStartTime || null });
    });

    return true;
  }

});