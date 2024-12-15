chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "GET_AUTH_TOKEN") {
        chrome.identity.getAuthToken(
            { interactive: message.promptLogin || true },
            (token) => {
                if (chrome.runtime.lastError) {
                    sendResponse({
                        authenticated: false,
                        error: chrome.runtime.lastError.message,
                    });
                } else {
                    sendResponse({ authenticated: true, token });
                }
            }
        );
        return true;
    } else if (message.type === "REVOKE_AUTH_TOKEN") {
        chrome.identity.getAuthToken({ interactive: false }, (token) => {
            if (chrome.runtime.lastError || !token) {
                return sendResponse({
                    success: false,
                    error:
                        chrome.runtime.lastError?.message ||
                        "No token available",
                });
            }

            // Remove the token from Chrome
            chrome.identity.removeCachedAuthToken({ token }, () => {
                console.log("Cached token removed.");
            });

            // Revoke the token via Google API
            fetch(`https://accounts.google.com/o/oauth2/revoke?token=${token}`)
                .then((response) => {
                    if (response.ok) {
                        sendResponse({ success: true });
                    } else {
                        return response.text().then((errorText) => {
                            sendResponse({
                                success: false,
                                error: `Failed to revoke token: ${errorText}`,
                            });
                        });
                    }
                })
                .catch((error) => {
                    sendResponse({
                        success: false,
                        error: `Error revoking token: ${error.message}`,
                    });
                });

            // Indicate that the response is asynchronous
            return true;
        });

        // Ensure the listener expects an asynchronous response
        return true;
    }
});

async function getAuthToken() {
    return new Promise((resolve, reject) => {
        chrome.identity.getAuthToken({ interactive: false }, (token) => {
            if (chrome.runtime.lastError) {
                reject(
                    chrome.runtime.lastError.message ||
                        "Failed to retrieve authentication token"
                );
            } else {
                resolve(token);
            }
        });
    });
}

async function triggerCategorization() {
    try {
        const token = await getAuthToken();
        console.log("Token:", token);
        if (!token) {
            console.error("Failed to get token");
            return;
        }

        const response = await fetch(`http://localhost:3000/email/label`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
        });

        const json = await response.json();
        console.log("Success:", json);
    } catch (error) {
        console.error("Error:", error);
    }
}

chrome.alarms.create("categorizeAlarm", { periodInMinutes: 1 });

chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === "categorizeAlarm") {
        console.log("Categorizing emails...");
        triggerCategorization();
    }
});
