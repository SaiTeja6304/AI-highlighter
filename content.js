import { Readability } from "@mozilla/readability";

// ---- Chat extraction (unchanged logic, just moved from popup) ----
function cleanText(text) {
    return text
        .replace(/\n{3,}/g, "\n\n")
        .replace(/[ \t]+/g, " ")
        .replace(/\u00A0/g, " ")
        .trim();
}

function extractPageForChat() {
    const clonedDoc = document.cloneNode(true);
    try {
        const reader = new Readability(clonedDoc);
        const article = reader.parse();

        if (article?.textContent?.length > 500) {
            return {
                url: window.location.href,
                domain: window.location.hostname,
                extractedAt: new Date().toISOString(),
                title: article?.title,
                text: cleanText(article?.textContent),
                excerpt: article?.excerpt,
                byline: article?.byline,
                siteName: article?.siteName
            };
        }

        const main = document.querySelector("article") ||
            document.querySelector("main") ||
            document.querySelector("[role='main']");

        if (main?.innerText?.length > 500) {
            return { text: main.innerText };
        }

        return { text: document.body.innerText };
    } catch (err) {
        console.error("Error extracting page content:", err);
        return { text: "" };
    }
}

// ---- Highlight extraction: raw text-node map, so offsets returned by the
// backend match the exact string we sent it ----
function buildTextNodeMap() {
    const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
        {
            acceptNode: (node) => {
                const parentTag = node.parentElement?.tagName;
                if (["SCRIPT", "STYLE", "NOSCRIPT"].includes(parentTag)) {
                    return NodeFilter.FILTER_REJECT;
                }
                if (!node.nodeValue || !node.nodeValue.trim()) {
                    return NodeFilter.FILTER_REJECT;
                }
                return NodeFilter.FILTER_ACCEPT;
            }
        }
    );

    const nodeMap = [];
    let text = "";
    let node;
    while ((node = walker.nextNode())) {
        const value = node.nodeValue;
        nodeMap.push({ node, start: text.length, end: text.length + value.length });
        text += value;
    }

    return { text, nodeMap };
}

function removeExistingHighlights() {
    document.querySelectorAll(".llm-highlight").forEach((mark) => {
        const parent = mark.parentNode;
        while (mark.firstChild) {
            parent.insertBefore(mark.firstChild, mark);
        }
        parent.removeChild(mark);
        parent.normalize();
    });
}

function injectHighlightStyles() {
    if (document.getElementById("llm-highlight-style")) return;
    const style = document.createElement("style");
    style.id = "llm-highlight-style";
    style.textContent = `
        .llm-highlight {
            background: #fff176;
            padding: 1px;
            border-radius: 4px;
            transition: background .2s;
        }
    `;
    document.head.appendChild(style);
}

function applyHighlights(highlights, nodeMap) {
    removeExistingHighlights();
    injectHighlightStyles();

    nodeMap.forEach((entry) => {
        if (!entry.node.parentNode) return;

        // Collect all highlight ranges that fall inside this node, in local coords
        const localRanges = [];
        highlights.forEach(({ start, end }) => {
            const overlapStart = Math.max(start, entry.start);
            const overlapEnd = Math.min(end, entry.end);
            if (overlapStart < overlapEnd) {
                localRanges.push({
                    start: overlapStart - entry.start,
                    end: overlapEnd - entry.start
                });
            }
        });

        if (localRanges.length === 0) return;

        // Process rightmost first so earlier splitText offsets stay valid
        localRanges.sort((a, b) => b.start - a.start);

        let node = entry.node;
        localRanges.forEach(({ start, end }) => {
            if (end < node.length) {
                node.splitText(end);
            }
            const middle = start > 0 ? node.splitText(start) : node;

            const mark = document.createElement("mark");
            mark.className = "llm-highlight";
            middle.parentNode.insertBefore(mark, middle);
            mark.appendChild(middle);

            // `node` now holds the unprocessed prefix [0, start) for the next (further-left) range
        });
    });
}

// ---- Message handling from popup ----
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "extractPageForChat") {
        sendResponse({ pageData: extractPageForChat() });
        return true;
    }

    if (message.action === "highlight") {
        const { text, nodeMap } = buildTextNodeMap();

        chrome.runtime.sendMessage(
            { action: "fetchHighlight", body: { pageData: { text }, modelName: message.modelName } },
            (result) => {
                if (!result?.ok) {
                    console.error("Highlight error:", result?.error);
                    sendResponse({ ok: false, error: result?.error || "Unknown error" });
                    return;
                }
                const highlights = result.data?.response?.highlights || [];
                applyHighlights(highlights, nodeMap);
                sendResponse({ ok: true, count: highlights.length });
            }
        );

        return true;
    }

    if (message.action === "highlightByQuestion") {
        const { text, nodeMap } = buildTextNodeMap();

        chrome.runtime.sendMessage(
            { action: "fetchHighlightByQuestion", body: { pageData: { text }, modelName: message.modelName, query: message.query } },
            (result) => {
                if (!result?.ok) {
                    console.error("Highlight error:", result?.error);
                    sendResponse({ ok: false, error: result?.error || "Unknown error" });
                    return;
                }
                const highlights = result.data?.response?.highlights || [];
                applyHighlights(highlights, nodeMap);
                sendResponse({ ok: true, count: highlights.length });
            }
        );

        return true;
    }
});