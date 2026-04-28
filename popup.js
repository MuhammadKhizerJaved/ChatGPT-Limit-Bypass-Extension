document.addEventListener('DOMContentLoaded', () => {
    const toggleSwitch = document.getElementById('toggle-switch');
    const timeDisplay = document.getElementById('time-display');
    const countdownDisplay = document.getElementById('countdown-display');
    const currentTimeDisplay = document.getElementById('current-time-display');

    let targetDate = null;

    // --- Core function to update the UI ---
    function updateUI(data) {
        if (data.isActive !== undefined) {
            toggleSwitch.checked = data.isActive;
        }
        if (data.unlockTime) {
            timeDisplay.innerText = data.unlockTime;
            targetDate = parseUnlockTime(data.unlockTime);
        }
    }

    // 1. Load saved state when popup opens
    chrome.storage.local.get(['isActive', 'unlockTime'], (result) => {
        updateUI(result);
    });

    // 2. LIVE SYNC: If content.js updates the time while the popup is open, update the screen!
    chrome.storage.onChanged.addListener((changes) => {
        const newData = {};
        if (changes.isActive) newData.isActive = changes.isActive.newValue;
        if (changes.unlockTime) newData.unlockTime = changes.unlockTime.newValue;
        updateUI(newData);
    });

    // 3. Toggle Click Logic (Saves state and refreshes page)
    toggleSwitch.addEventListener('change', () => {
        const isNowActive = toggleSwitch.checked;
        chrome.storage.local.set({ isActive: isNowActive }, () => {
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                if (tabs[0] && tabs[0].url.includes("chatgpt.com")) {
                    chrome.tabs.reload(tabs[0].id);
                }
            });
        });
    });

    // --- Helper: Converts time string to Date object ---
    function parseUnlockTime(timeStr) {
        const now = new Date();
        const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
        if (!match) return null;

        let [ , hours, minutes, modifier ] = match;
        hours = parseInt(hours, 10);
        
        if (hours === 12 && modifier.toUpperCase() === 'AM') hours = 0;
        if (hours < 12 && modifier.toUpperCase() === 'PM') hours += 12;

        let target = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, parseInt(minutes, 10), 0);
        if (target < now) {
            target.setDate(target.getDate() + 1);
        }
        return target;
    }

    // --- Timer Loop (Updates every second) ---
    setInterval(() => {
        const now = new Date();
        currentTimeDisplay.innerText = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

        if (targetDate) {
            const diffMs = targetDate - now;

            if (diffMs <= 0) {
                countdownDisplay.innerText = "Limits Reset! 🚀";
                countdownDisplay.style.color = "#10a37f";
                targetDate = null; 
            } else {
                const h = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                const m = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
                const s = Math.floor((diffMs % (1000 * 60)) / 1000);
                
                countdownDisplay.innerText = `${h.toString().padStart(2, '0')}h ${m.toString().padStart(2, '0')}m ${s.toString().padStart(2, '0')}s`;
            }
        }
    }, 1000);
});