document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('getActiveSession').addEventListener('click', async () => {
        try {
            const isActiveSession = await checkActiveSalesforceSession();

            if (isActiveSession) {
                document.getElementById('sessionCheck').style.display = 'block';
                document.getElementById('getActiveSession').style.display = 'none';
            } else {
                alert('Please go to an active Salesforce session or login to one.');
            }
        } catch (error) {
            alert('Failed to check active session. Make sure you are on a Salesforce page.');
        }
    });


    document.getElementById('exportData').addEventListener('click', () => {
        document.getElementById('exportSection').style.display = 'block';
        document.getElementById('monitorSection').style.display = 'none';
    });

    document.getElementById('monitorAsyncQueue').addEventListener('click', () => {
        document.getElementById('monitorSection').style.display = 'block';
        document.getElementById('exportSection').style.display = 'none';
        document.getElementById('monitorQuery').value = 'SELECT Id,Name,CreatedDate,LastModifiedDate, csutil__has_errors__c,csutil__status__c,csutil__is_finished__c,IsDeleted,CreatedBy.Name,csutil__async_task_name__c,csutil__linked_object_id__c,csutil__job_id__c from csutil__Async_Task_Data__c  WHERE csutil__status__c != \'PROCESS_AFTER_FINISH\' AND csutil__is_finished__c = false order by CreatedDate desc';
    });

    document.getElementById('runExport').addEventListener('click', async () => {
        const { url } = await getCurrentTabUrl();
        const instanceUrl = getSalesforceInstanceUrl(url);
        const soqlQuery = document.getElementById('query').value.trim();

        if (!soqlQuery) {
            alert('Please enter your query.');
            return;
        }

        try {
            const sessionId = await getSalesforceSessionCookie(instanceUrl);
            const queryResults = await executeSalesforceQuery(instanceUrl, sessionId, soqlQuery);

            // Display exported data in UI
            document.getElementById('recordCount').textContent = `Total Records: ${queryResults.totalSize}`;
            if(queryResults.totalSize > 0)
            {
                const table = document.getElementById('exportedResult');
                table.innerHTML = '';
                const headerRow = table.insertRow();
                const headers = Object.keys(queryResults.records[0]).filter(key => key !== 'attributes');
                headers.forEach(header => {
                    const cell = headerRow.insertCell();
                    cell.textContent = header;
                });

                queryResults.records.forEach(record => {
                    const row = table.insertRow();
                    headers.forEach(header => {
                        const cell = row.insertCell();
                        cell.textContent = record[header];
                    });
                });
            }
        } catch (error) {
            console.error('Error fetching data from Salesforce:', error);
            alert('Error fetching data from Salesforce. Please try again later.');
        }
    });

    let monitorInterval; // Variable to hold the interval reference
    let emailInterval; // Variable to hold the email alert interval reference
    let remainingRuns; // Variable to keep track of remaining runs

    document.getElementById('startMonitor').addEventListener('click', async () => {
        var api = 0;
        var forcestop = 500;// Force Stop the monitor on 500 API used
        const { url } = await getCurrentTabUrl();
        const audio = new Audio(chrome.runtime.getURL('sounds/alert.mp3')); 
        const doublebeep = new Audio(chrome.runtime.getURL('sounds/double_beep.mp3')); 
        const instanceUrl = getSalesforceInstanceUrl(url);
        const soqlQuery = document.getElementById('monitorQuery').value.trim();
        const durationInMinutes = parseInt(document.getElementById('monitorDuration').value.trim(), 10);
        const monitorInterval = parseInt(document.getElementById('monitorInterval').value.trim(), 10);
        var button = document.getElementById('startMonitor');
        button.style.display = 'none';
        if ( !soqlQuery || isNaN(durationInMinutes) || durationInMinutes <= 0) {
            alert('Please enter a valid  query, and monitoring duration.');
            button.style.display = 'block';
            return;
        }
        var stopbutton = document.getElementById('stopMonitor');
        stopbutton.style.display = 'block';
        try {
            
            const sessionId = await getSalesforceSessionCookie(instanceUrl);
            const now = new Date();
            const endTime = new Date(now.getTime() + durationInMinutes * 60000); // Calculate end time
            remainingRuns = Math.ceil(durationInMinutes / monitorInterval); // Calculate the number of 3-minute intervals
            //remainingRuns++;
            doublebeep.play();
            await sleep(3000);
            doublebeep.pause();
            
            // Send email notification on monitor start
            //await sendEmail(userEmail, 'Async Queue Monitor Status Update' , `Monitoring started for ${durationInMinutes} minutes. End time: ${endTime.toLocaleTimeString()}`);
            //const typeWriter = new Audio("https://www.freesound.org/data/previews/256/256458_4772965-lq.mp3");
            //typeWriter.play();
            var textarea = document.getElementById('myTextarea');
            var newText = 'Monitoring Started ';
            textarea.value += (textarea.value ? "\n" : "") + newText;
            for (let i = 0; i <= remainingRuns; i++) {
                try {

                    if (api == forcestop) {
                        stopMonitor(); // Stop monitoring if end time reached

                    }
                    const now = new Date();
                    const tenMinutesAgo = new Date(now.getTime() - 10 * 60000);

                    const nowStr = now.toISOString();
                    const tenMinutesAgoStr = tenMinutesAgo.toISOString();
                    // Perform your monitoring logic here
                    const queryResults = await executeSalesforceQuery(instanceUrl, sessionId, soqlQuery);
                    api++;
                    const recordCount = queryResults.totalSize;

                     // Check if there are records found
                     if (recordCount > 0) {
                        // Perform another query to check for specific conditions
                        const anotherQuery = `SELECT Id, CreatedDate, CreatedBy.name, JobType, ApexClass.name, Status, JobItemsProcessed, TotalJobItems, NumberOfErrors, CompletedDate, MethodName, ExtendedStatus, ParentJobId, LastProcessed, LastProcessedOffset, CronTriggerId FROM AsyncApexJob WHERE ApexClass.NamespacePrefix = 'csutil' AND CreatedDate >= ${tenMinutesAgoStr} AND CreatedDate <= ${nowStr} AND ExtendedStatus LIKE '%bad%' ORDER BY CreatedDate DESC`;
                        const anotherQueryResults = await executeSalesforceQuery(instanceUrl, sessionId, anotherQuery);
                        const badIdNullCount = anotherQueryResults.totalSize;
                        api++;
                        // Send email if bad Id null found
                        if (badIdNullCount > 0) {
                            //await sendEmail(userEmail,'Async Queue Monitor Status Update' , `Hello Team,\n\nI found a Bad Id null in the queue. Please take appropriate action.\n\nAsync Count: ${recordCount}`);
                            document.getElementById('monitorResult').textContent = 'Bad Id null found.';
                            audio.play();
                        } else {
                            document.getElementById('monitorResult').textContent = 'No bad Id null error in the queue.';
                        }
                    } else {
                        document.getElementById('monitorResult').textContent = 'No records found in the queue.';
                    }
                    // Update UI with monitoring result
                    //document.getElementById('monitorResult').textContent = `Last check at ${new Date().toLocaleTimeString()}. Records found: ${recordCount}`;
                    document.getElementById('monitorStatus').textContent = `Monitoring for ${durationInMinutes} minutes. End time: ${endTime.toLocaleTimeString()}. Remaining checks: ${remainingRuns -i}`;
                    
                    var newText = `Last check at ${new Date().toLocaleTimeString()}.Async Records found: ${recordCount}`;
                    textarea.value += (textarea.value ? "\n" : "") + newText;
                    // Send email notification on every execution
                    //await sendEmail(userEmail,'Async Queue Monitor Status Update' , `Monitoring update at ${new Date().toLocaleTimeString()}: Records found - ${recordCount}`);
                    if (remainingRuns == i) {
                        stopMonitor(); // Stop monitoring if end time reached

                    }
                    //remainingRuns--;
                    var sleeptime = monitorInterval * 60000;
                    await sleep(sleeptime);
                    
                } catch (error) {
                    console.error('Error monitoring async queue:', error);
                    alert('Error monitoring async queue. Please try again later.');
                    stopMonitor(); // Stop monitoring on error
                }
            }
            stopMonitor();
            document.getElementById('apiutilised').textContent = `API Utilised is ${api} `;
            var newText = `Monitoring for ${durationInMinutes} minutes. End time: ${endTime.toLocaleTimeString()}`;
            textarea.value += (textarea.value ? "\n" : "") + newText;
        } catch (error) {
            console.error('Error starting monitor:', error);
            alert('Error starting monitor. Please try again later.');
        }
    });

    document.getElementById('stopMonitor').addEventListener('click', () => {
        stopMonitor();
    });

    async function stopMonitor() {
        const doublebeep = new Audio(chrome.runtime.getURL('sounds/double_beep.mp3'));
        doublebeep.play();
        await sleep(3000);
        doublebeep.pause();
        var textarea = document.getElementById('myTextarea');
        var newText = 'Monitor Stopped';
        textarea.value += (textarea.value ? "\n" : "") + newText;
        clearInterval(monitorInterval); // Clear interval to stop monitoring
        clearInterval(emailInterval); // Clear interval to stop email alerts
        document.getElementById('startMonitor').style.display = 'block';
        document.getElementById('stopMonitor').style.display = 'none';
        document.getElementById('monitorStatus').textContent = 'Monitor stopped.';
    }
});

async function getCurrentTabUrl() {
    return new Promise((resolve) => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            resolve(tabs[0]);
        });
    });
}

function getSalesforceInstanceUrl(url) {
    const urlObj = new URL(url);
    return `${urlObj.protocol}//${urlObj.hostname}`;
}

async function checkActiveSalesforceSession() {
    const tab = await getCurrentTabUrl();

    return new Promise((resolve, reject) => {
        if (!tab.url.includes('salesforce.com') && !tab.url.includes('force.com')) {
            reject(new Error('Not on a Salesforce page.'));
            return;
        }

        chrome.scripting.executeScript(
            {
                target: { tabId: tab.id },
                func: () => {
                    const isClassicSession = !!document.querySelector('#phHeaderLogoImage, .bPageTitle, #phHeader');
                    const isLightningSession = !!document.querySelector('.slds-global-header__item--profile, lightning-help-menu-button, lightning-primitive-icon');
                    return isClassicSession || isLightningSession;
                }
            },
            (results) => {
                if (chrome.runtime.lastError || !results || !results.length) {
                    reject(chrome.runtime.lastError || new Error('Failed to check active session.'));
                } else {
                    resolve(results[0].result);
                }
            }
        );
    });
}

async function getSalesforceSessionCookie(instanceUrl) {
    return new Promise((resolve, reject) => {
        chrome.cookies.getAll({ domain: new URL(instanceUrl).hostname }, (cookies) => {
            const sessionCookie = cookies.find(cookie => cookie.name === 'sid');
            if (sessionCookie) {
                resolve(sessionCookie.value);
            } else {
                reject('Salesforce session cookie (sid) not found.');
            }
        });
    });
}

async function executeSalesforceQuery(instanceUrl, sessionId, query) {
    const apiUrl = `${instanceUrl}/services/data/v60.0/query?q=${encodeURIComponent(query)}`;

    const response = await fetch(apiUrl, {
        headers: {
            'Authorization': `Bearer ${sessionId}`
        }
    });

    if (!response.ok) {
        throw new Error(`Salesforce API Error: ${response.statusText}`);
    }

    return response.json();
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}


