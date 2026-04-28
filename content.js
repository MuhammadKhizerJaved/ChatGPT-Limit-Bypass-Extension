function extractTime(text) {
    // Made the regex extremely forgiving. It grabs "wait until X:XX AM" perfectly now.
    const timeRegex = /wait until\s+([\d:]+\s*[A-Z]{2})/i;
    const match = text.match(timeRegex);
    if (match && match[1]) {
        // Force uppercase and fix any weird ChatGPT spacing characters
        const cleanTime = match[1].replace(/[\u202F\xA0]/g, ' ').toUpperCase().trim();
        if (chrome.runtime?.id) {
            chrome.storage.local.set({ 'unlockTime': cleanTime });
        }
    }
}

function unlockButton() {
    const sendButton = document.getElementById('composer-submit-button');
    if (sendButton && sendButton.hasAttribute('disabled')) {
        sendButton.removeAttribute('disabled');
        
        if (!document.getElementById('bypass-indicator')) {
            const indicator = document.createElement('div');
            indicator.id = 'bypass-indicator';
            indicator.innerText = '⚡ Bypass Active';
            indicator.style.cssText = 'position: absolute; bottom: -20px; right: 0; font-size: 10px; color: #10a37f; font-weight: bold; pointer-events: none; white-space: nowrap;';
            
            sendButton.parentElement.style.position = 'relative'; 
            sendButton.parentElement.appendChild(indicator);
        }
    }
}

function runBypassLogic() {
    if (!chrome.runtime?.id) return;

    try {
        chrome.storage.local.get(['isActive'], function(result) {
            if (chrome.runtime.lastError || !result || !result.isActive) return;
            
            const limitHeadings = document.querySelectorAll('h3');
            limitHeadings.forEach(heading => {
                if (heading.textContent.includes("You’ve reached the Free limit")) {
                    const container = heading.closest('aside');
                    if (container) {
                        // Use textContent instead of innerText for perfect scraping
                        extractTime(container.textContent);
                        container.remove(); 
                    }
                }
            });

            unlockButton();
        });
    } catch (e) {}
}

// --- TRIGGERS ---
runBypassLogic();

const observer = new MutationObserver(() => { runBypassLogic(); });
observer.observe(document.body, { childList: true, subtree: true });