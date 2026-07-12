chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "fetchHighlight") {
        fetch("http://localhost:8000/api/highlight", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(message.body)
        })
            .then((res) => res.json())
            .then((data) => sendResponse({ ok: true, data }))
            .catch((err) => sendResponse({ ok: false, error: err.message }));

        return true; // keep the message channel open for async response
    }

    if (message.action === "fetchChat") {
        fetch("http://localhost:8000/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(message.body)
        })
            .then((res) => res.json())
            .then((data) => sendResponse({ ok: true, data }))
            .catch((err) => sendResponse({ ok: false, error: err.message }));

        return true;
    }

    if (message.action === "fetchHighlightByQuestion") {
        fetch("http://localhost:8000/api/question-highlight", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(message.body)
        })
            .then((res) => res.json())
            .then((data) => sendResponse({ ok: true, data }))
            .catch((err) => sendResponse({ ok: false, error: err.message }));

        return true;
    }
});