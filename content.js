if (document.querySelector("body.sfdcBody, body.ApexCSIPage, #auraLoadingBox")) {
    chrome.runtime.sendMessage({message: "getSfHost", url: location.href}, sfHost => {
        if (sfHost) {
            initSidebar(sfHost);
        }
    });
}

let sidebarVisible = false;
let sidebarButton;

function initSidebar(sfHost) {
    sidebarButton = document.createElement("div");
    sidebarButton.id = "sfSidebarButton";
    sidebarButton.style.position = "fixed";
    sidebarButton.innerText = 'CSP';
    sidebarButton.style.top = "50px";  // Adjust top position as needed
    sidebarButton.style.right = "0px";  // Adjust right position as needed
    sidebarButton.style.zIndex = "9999";  // Ensure it's above other elements
    sidebarButton.style.backgroundColor = "#0070d2";
    sidebarButton.style.cursor = "pointer";
    sidebarButton.style.fontWeight = "bold";
    sidebarButton.style.color = "white";
    sidebarButton.style.textAlign = "center";
    document.body.appendChild(sidebarButton);

    sidebarButton.addEventListener("click", toggleSidebar);
}

function toggleSidebar() {
    if (!sidebarVisible) {
        openSidebar();
    } else {
        closeSidebar();
    }
}

function openSidebar() {
    let iframe = document.createElement("iframe");
    iframe.src = chrome.runtime.getURL("sidebar.html");
    iframe.id = "sfSidebar";
    iframe.style.position = "fixed";
    iframe.style.left = "0";
    iframe.style.top = "0";
    iframe.style.width = "300px";
    iframe.style.height = "100%";
    iframe.style.zIndex = "9999";
    iframe.style.border = "none";
    document.body.appendChild(iframe);
    sidebarVisible = true;

    // Add close button to the sidebar
    let closeButton = document.createElement("div");
    closeButton.id = "sfCloseButton";
    closeButton.innerText = "X";
    closeButton.style.position = "fixed";
    closeButton.style.top = "10px";
    closeButton.style.right = "10px";
    closeButton.style.zIndex = "10000";
    closeButton.style.backgroundColor = "red";
    closeButton.style.color = "white";
    closeButton.style.width = "20px";
    closeButton.style.height = "20px";
    closeButton.style.borderRadius = "50%";
    closeButton.style.cursor = "pointer";
    closeButton.style.textAlign = "center";
    closeButton.addEventListener("click", closeSidebar);
    document.body.appendChild(closeButton);
}

function closeSidebar() {
    let iframe = document.getElementById("sfSidebar");
    if (iframe) {
        iframe.remove();
    }
    let closeButton = document.getElementById("sfCloseButton");
    if (closeButton) {
        closeButton.remove();
    }
    sidebarVisible = false;
}
