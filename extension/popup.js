const API_BASE = "https://reffetch.onrender.com";
const SUPABASE_URL = "https://drfbsatxkyvrvxcmwpau.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_mSDtEyZ-zfVqaLZdGBWENA_39nPs_CL";

const signedOutView = document.getElementById("signedOutView");
const signedInView = document.getElementById("signedInView");
const signInBtn = document.getElementById("signInBtn");
const signOutBtn = document.getElementById("signOutBtn");
const userEmail = document.getElementById("userEmail");
const paperStatus = document.getElementById("paperStatus");
const saveBtn = document.getElementById("saveBtn");
const msgEl = document.getElementById("msg");

let resolvedPdfUrl = null;
let suggestedFilename = "paper.pdf";

function showMsg(text, kind) {
  msgEl.textContent = text;
  msgEl.className = `msg ${kind}`;
}

// --- Auth ---

async function getStoredSession() {
  const data = await chrome.storage.local.get(["access_token", "user_email"]);
  return data.access_token ? data : null;
}

async function signIn() {
  const redirectUri = chrome.identity.getRedirectURL();
  const authUrl =
    `${SUPABASE_URL}/auth/v1/authorize?provider=google` +
    `&redirect_to=${encodeURIComponent(redirectUri)}`;

  chrome.identity.launchWebAuthFlow({ url: authUrl, interactive: true }, async (responseUrl) => {
    if (chrome.runtime.lastError || !responseUrl) {
      showMsg("Sign-in was cancelled or failed.", "error");
      return;
    }

    // Supabase returns tokens in the URL fragment: #access_token=...&...
    const hash = new URL(responseUrl).hash.substring(1);
    const params = new URLSearchParams(hash);
    const accessToken = params.get("access_token");

    if (!accessToken) {
      showMsg("Sign-in did not return a valid session.", "error");
      return;
    }

    // Fetch the user's email for display, using the fresh token
    let email = "";
    try {
      const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
        headers: { Authorization: `Bearer ${accessToken}`, apikey: SUPABASE_ANON_KEY },
      });
      const user = await res.json();
      email = user.email || "";
    } catch (e) {
      /* non-fatal — just won't show the email */
    }

    await chrome.storage.local.set({ access_token: accessToken, user_email: email });
    renderSignedIn(email);
  });
}

async function signOut() {
  await chrome.storage.local.remove(["access_token", "user_email"]);
  renderSignedOut();
}

function renderSignedIn(email) {
  signedOutView.style.display = "none";
  signedInView.style.display = "block";
  userEmail.textContent = email || "";
  detectPaper();
}

function renderSignedOut() {
  signedInView.style.display = "none";
  signedOutView.style.display = "block";
}

// --- Paper detection + save (unchanged logic, now auth-aware) ---

function resolvePdfUrl(pageUrl) {
  const arxivAbsMatch = pageUrl.match(/arxiv\.org\/abs\/([\w.]+)/);
  if (arxivAbsMatch) {
    const id = arxivAbsMatch[1];
    return { url: `https://arxiv.org/pdf/${id}.pdf`, filename: `arxiv-${id}.pdf` };
  }
  const arxivPdfMatch = pageUrl.match(/arxiv\.org\/pdf\/([\w.]+)/);
  if (arxivPdfMatch) {
    const id = arxivPdfMatch[1].replace(/\.pdf$/, "");
    return { url: `https://arxiv.org/pdf/${id}.pdf`, filename: `arxiv-${id}.pdf` };
  }
  if (pageUrl.toLowerCase().endsWith(".pdf")) {
    const parts = pageUrl.split("/");
    return { url: pageUrl, filename: parts[parts.length - 1] || "paper.pdf" };
  }
  return null;
}

async function detectPaper() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.url) {
    paperStatus.textContent = "Could not read the current tab.";
    return;
  }
  const resolved = resolvePdfUrl(tab.url);
  if (!resolved) {
    paperStatus.textContent =
      "No paper detected on this page. Works on arXiv abstract/PDF pages, or any direct .pdf URL.";
    return;
  }
  resolvedPdfUrl = resolved.url;
  suggestedFilename = resolved.filename;
  paperStatus.textContent = `Found: ${suggestedFilename}`;
  saveBtn.disabled = false;
}

saveBtn.addEventListener("click", async () => {
  if (!resolvedPdfUrl) return;
  const session = await getStoredSession();
  if (!session) {
    showMsg("You've been signed out — please sign in again.", "error");
    renderSignedOut();
    return;
  }

  saveBtn.disabled = true;
  showMsg("", "hidden");
  paperStatus.textContent = "Downloading PDF...";

  try {
    const pdfResponse = await fetch(resolvedPdfUrl);
    if (!pdfResponse.ok) throw new Error("Could not download the PDF from this page");
    const blob = await pdfResponse.blob();

    paperStatus.textContent = "Uploading to your library...";
    const form = new FormData();
    form.append("file", blob, suggestedFilename);

    const uploadResponse = await fetch(`${API_BASE}/papers/upload`, {
      method: "POST",
      headers: { Authorization: `Bearer ${session.access_token}` },
      body: form,
    });

    if (uploadResponse.status === 401) {
      showMsg("Your session expired — please sign in again.", "error");
      renderSignedOut();
      return;
    }
    if (!uploadResponse.ok) {
      const err = await uploadResponse.json().catch(() => ({}));
      throw new Error(err.detail || "Upload failed");
    }

    const paper = await uploadResponse.json();
    paperStatus.textContent = `Saved: ${paper.title.slice(0, 60)}`;
    showMsg("Saved to your library ✓", "success");
  } catch (e) {
    showMsg(e.message || "Something went wrong", "error");
    saveBtn.disabled = false;
  }
});

signInBtn.addEventListener("click", signIn);
signOutBtn.addEventListener("click", signOut);

// --- Init ---
(async () => {
  const session = await getStoredSession();
  if (session) {
    renderSignedIn(session.user_email);
  } else {
    renderSignedOut();
  }
})();
