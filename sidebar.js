document.getElementById("checkSession").addEventListener("click", checkActiveSalesforceSession);


function getCurrentTabUrl() {
  return new Promise((resolve) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      resolve(tabs[0].url);
    });
  });
}

function checkActiveSalesforceSession() {
  getCurrentTabUrl().then((url) => {
    chrome.runtime.sendMessage({ message: "getSfHost", url: url }, (sfHost) => {
      if (sfHost) {
        chrome.runtime.sendMessage({ message: "getSession", sfHost: sfHost }, (session) => {
          if (session) {
            alert("Active Salesforce session found!");
          } else {
            alert("No active Salesforce session.");
          }
        });
      } else {
        alert("Salesforce host not found.");
      }
    });
  });
}
