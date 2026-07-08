function showResponse(text) {
    document.getElementById("responseArea").value = text;
}

document.getElementById("sendBtn").addEventListener("click", async () => {
    const text = document.getElementById("chatInput").value;
    const modelName = document.getElementById("model-name").value;

    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        const { pageData } = await chrome.tabs.sendMessage(tab.id, { action: "extractPageForChat" });

        const payload = { chatInput: text, pageData, modelName };

        const result = await new Promise((resolve) => {
            chrome.runtime.sendMessage(
                { action: "fetchChat", body: payload },
                (result) => resolve(result)
            );
        });

        if (!result?.ok) {
            showResponse(`Error: ${result?.error || "Unknown error"}`);
            return;
        }

        showResponse(result.data?.response ?? "No response received.");
    } catch (err) {
        showResponse(`Error: ${err.message}`);
    }
});

document.getElementById("highBtn").addEventListener("click", async () => {
    const modelName = document.getElementById("model-name").value;
    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        const result = await chrome.tabs.sendMessage(tab.id, { action: "highlight", modelName });

        if (!result?.ok) {
            showResponse(`Error: ${result?.error || "Unknown error"}`);
            return;
        }

        showResponse(`Highlighted ${result.count} section(s) on the page.`);
    } catch (err) {
        showResponse(`Error: ${err.message}`);
    }
});