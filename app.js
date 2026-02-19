/**
 * ASBOT Frontend Logic
 */

const DEFAULT_API_URL = "http://localhost:8000";

// --- API CONFIGURATION ---

function getApiUrl() {
    return localStorage.getItem("asbot_api_url") || DEFAULT_API_URL;
}

function setApiUrl(url) {
    if (!url) return;
    // Remove trailing slash
    url = url.replace(/\/$/, "");
    localStorage.setItem("asbot_api_url", url);
    location.reload(); 
}

function showSettings() {
    const currentUrl = getApiUrl();
    const modal = document.createElement("div");
    modal.className = "modal";
    modal.style.display = "flex";
    modal.innerHTML = `
        <div class="modal-content">
            <h2>⚙️ Settings</h2>
            <label>Backend API URL</label>
            <input type="text" id="api-url-input" value="${currentUrl}" placeholder="http://raspberrypi.local:8000">
            <div style="display:flex; gap:10px; margin-top:20px">
                <button onclick="saveSettings()">Save</button>
                <button onclick="closeSettings()" class="secondary">Cancel</button>
            </div>
            <p class="tiny muted" style="margin-top:15px">
                Use <b>http://localhost:8000</b> for local testing.<br>
                Use your Pi's IP or Cloudflare URL for remote access.
            </p>
        </div>
    `;
    document.body.appendChild(modal);
    window.saveSettings = () => {
        const val = document.getElementById("api-url-input").value;
        setApiUrl(val);
    };
    window.closeSettings = () => {
        document.body.removeChild(modal);
    };
}

// --- UTILITIES ---

function showMessage(msg, type = "info") {
    let box = document.getElementById("message-box");
    if (!box) {
        box = document.createElement("div");
        box.id = "message-box";
        document.body.appendChild(box);
    }
    box.innerText = msg;
    box.style.display = "block";
    box.style.borderColor = type === "error" ? "var(--error-color)" : "var(--text-accent)";
    box.style.color = type === "error" ? "var(--error-color)" : "var(--text-primary)";
    
    setTimeout(() => {
        box.style.display = "none";
    }, 5000);
}

async function apiCall(endpoint, method = "GET", body = null) {
    const baseUrl = getApiUrl();
    const headers = {};
    if (body && !(body instanceof FormData)) {
        headers["Content-Type"] = "application/json";
        body = JSON.stringify(body);
    }

    try {
        const res = await fetch(`${baseUrl}${endpoint}`, {
            method,
            headers,
            body
        });
        
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.error || `Request failed: ${res.status}`);
        }

        // Return blob for zip/files, generic json otherwise
        const contentType = res.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
            return await res.json();
        }
        return await res.blob();

    } catch (e) {
        console.error("API Error:", e);
        throw e;
    }
}

// --- INITIALIZATION ---

document.addEventListener("DOMContentLoaded", () => {
    // Check connection on load if on dashboard
    if (document.getElementById("status-indicator")) {
        checkStatus();
    }
});

async function checkStatus() {
    const indicator = document.getElementById("status-indicator");
    if (!indicator) return;

    indicator.innerHTML = '<div class="spinner"></div>Checking connection...';
    
    try {
        const data = await apiCall("/status");
        if (data.success) {
            indicator.innerHTML = `
                <div class="status-grid">
                    <div class="status-item">
                        <div class="status-label">API Connection</div>
                        <div class="status-value ok">Connected</div>
                    </div>
                </div>
            `;
        } else {
             throw new Error(data.error);
        }
    } catch (e) {
        indicator.innerHTML = `
            <div class="status-item" style="border-color:var(--error-color)">
                <div class="status-label">Connection Failed</div>
                <div class="status-value err">Offline</div>
                <p class="tiny muted">${e.message}</p>
                <button class="secondary" onclick="showSettings()" style="margin-top:10px">Configure URL</button>
            </div>
        `;
    }
}
