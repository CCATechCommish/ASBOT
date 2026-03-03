/**
 * ASBOT Frontend Logic (Google Apps Script API Edition)
 */

// REPLACE THIS WITH YOUR DEPLOYED WEB APP URL
const GAS_API_URL = "YOUR_APPS_SCRIPT_WEB_APP_URL_HERE";

// --- API UTILS ---

/**
 * Sends data to the Google Apps Script API
 * @param {string} type - 'PRINT_FILE', 'CALL_SLIP', etc.
 * @param {object} payloadData - Metadata like printer name, copies, time, reason
 * @param {HTMLInputElement} fileInput - processing file input element
 */
async function apiCall(type, payloadData, fileInput = null) {
    if (GAS_API_URL.includes("YOUR_APPS_SCRIPT")) {
        // Fallback or alert if not configured
        const savedUrl = localStorage.getItem("asbot_api_url");
        if (savedUrl) {
            // Use saved URL if available
        } else {
            throw new Error("API URL not configured. Please edit app.js or use the settings button.");
        }
    }

    const apiUrl = localStorage.getItem("asbot_api_url") || GAS_API_URL;

    const payload = {
        type: type,
        ...payloadData
    };

    // Handle File if present
    if (fileInput && fileInput.files.length > 0) {
        const file = fileInput.files[0];
        payload.filename = file.name;
        payload.mimeType = file.type;
        try {
            // Convert to Base64
            payload.file = await toBase64(file);
        } catch (e) {
            throw new Error("Failed to read file: " + e.message);
        }
    }

    // Google Apps Script requires text/plain to avoid CORS preflight options request
    const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify(payload)
    });

    const result = await response.json();

    if (!result.success && result.result !== "success") {
        throw new Error(result.message || result.error || "Unknown error");
    }

    return result;
}

/**
 * Helper to convert file to Base64 string
 */
function toBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            // Remove the Data URL prefix (e.g. "data:image/png;base64,")
            // Google utilities.base64Decode expects raw base64 usually, or handles it.
            // Safe bet is to strip the prefix.
            resolve(reader.result.split(',')[1]);
        };
        reader.onerror = error => reject(error);
    });
}

// --- UI UTILITIES ---

function showMessage(msg, type = "info") {
    // Look for a specific status container, or create one/alert
    const statusDiv = document.getElementById("status-message") || document.getElementById("status");
    if (statusDiv) {
        statusDiv.innerHTML = msg; // Allow HTML for spinners
        statusDiv.className = type;
        statusDiv.style.display = 'block';
    } else {
        // Fallback for pages without a status div
        if (type === 'error') alert(msg);
        else console.log(msg);
    }
}

function showSpinner(text = "Processing...") {
    showMessage(`<div class="spinner"></div> ${text}`, "info");
}

function hideMessage() {
    const statusDiv = document.getElementById("status-message") || document.getElementById("status");
    if (statusDiv) {
        statusDiv.style.display = 'none';
        statusDiv.innerHTML = '';
        statusDiv.className = '';
    }
}

// --- SETTINGS (Optional, to let user override URL) ---
function showSettings() {
    const currentUrl = localStorage.getItem("asbot_api_url") || GAS_API_URL;
    const newUrl = prompt("Enter Google Apps Script Web App URL:", currentUrl);
    if (newUrl) {
        localStorage.setItem("asbot_api_url", newUrl);
        location.reload();
    }
}
