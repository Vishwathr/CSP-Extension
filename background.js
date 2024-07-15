chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.message == "getSfHost") {
      chrome.cookies.get({url: request.url, name: "sid", storeId: sender.tab.cookieStoreId}, cookie => {
        if (!cookie) {
          sendResponse(null);
          return;
        }
        let [orgId] = cookie.value.split("!");
        chrome.cookies.getAll({name: "sid", domain: "salesforce.com", secure: true, storeId: sender.tab.cookieStoreId}, cookies => {
          let sessionCookie = cookies.find(c => c.value.startsWith(orgId + "!"));
          if (!sessionCookie) {
            sendResponse(null);
            return;
          }
          sendResponse(sessionCookie.domain);
        });
      });
      return true;
    }
    if (request.message == "getSession") {
      chrome.cookies.get({url: "https://" + request.sfHost, name: "sid", storeId: sender.tab.cookieStoreId}, sessionCookie => {
        if (!sessionCookie) {
          sendResponse(null);
          return;
        }
        let session = {key: sessionCookie.value, hostname: sessionCookie.domain};
        sendResponse(session);
      });
      return true;
    }
    
    return false;
  });
  