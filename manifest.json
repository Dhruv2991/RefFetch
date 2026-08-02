const API_BASE = "http://localhost:8000";

const statusEl = document.getElementById("status");
const saveBtn = document.getElementById("saveBtn");
const msgEl = document.getElementById("msg");

let resolvedPdfUrl = null;
let suggestedFilename = "paper.pdf";

function showMsg(text, kind) {
  msgEl.textContent = text;
  msgEl.className = `msg ${kind}`;
}

/**
 * Given the current tab's URL, figure out the direct PDF link.
 * Handles: arXiv abstract pages, arXiv PDF pages, and generic .pdf URLs.
 * Extend this function to support more sites (Semantic Scholar, OpenReview, etc).
 */
function resolvePdfUrl(pageUrl) {
  // arXiv abstract page: https://arxiv.org/abs/2401.12345
  const arxivAbsMatch = pageUrl.match(/arxiv\.org\/abs\/([\w.]+)/);
  if (arxivAbsMatch) {
    const id = arxivAbsMatch[1];
    return { url: `https://arxiv.org/pdf/${id}.pdf`, filename: `arxiv-${id}.pdf` };
  }

  // arXiv PDF page already: https://arxiv.org/pdf/2401.12345.pdf
  const arxivPdfMatch = pageUrl.match(/arxiv\.org\/pdf\/([\w.]+)/);
  if (arxivPdfMatch) {
    const id = arxivPdfMatch[1].replace(/\.pdf$/, "");
    return { url: `https://arxiv.org/pdf/${id}.pdf`, filename: `arxiv-${id}.pdf` };
  }

  // Any direct .pdf URL
  if (pageUrl.toLowerCase().endsWith(".pdf")) {
    const parts = pageUrl.split("/");
    return { url: pageUrl, filename: parts[parts.length - 1] || "paper.pdf" };
  }

  return null;
}

async function init() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.url) {
    statusEl.textContent = "Could not read the current tab.";
    return;
  }

  const resolved = resolvePdfUrl(tab.url);
  if (!resolved) {
    statusEl.textContent =
      "No paper detected on this page. Works on arXiv abstract/PDF pages, or any direct .pdf URL.";
    return;
  }

  resolvedPdfUrl = resolved.url;
  suggestedFilename = resolved.filename;
  statusEl.textContent = `Found: ${suggestedFilename}`;
  saveBtn.disabled = false;
}

saveBtn.addEventListener("click", async () => {
  if (!resolvedPdfUrl) return;
  saveBtn.disabled = true;
  showMsg("", "hidden");
  statusEl.textContent = "Downloading PDF...";

  try {
    const pdfResponse = await fetch(resolvedPdfUrl);
    if (!pdfResponse.ok) throw new Error("Could not download the PDF from this page");
    const blob = await pdfResponse.blob();

    statusEl.textContent = "Uploading to your library...";
    const form = new FormData();
    form.append("file", blob, suggestedFilename);

    const uploadResponse = await fetch(`${API_BASE}/papers/upload`, {
      method: "POST",
      body: form,
    });

    if (!uploadResponse.ok) {
      const err = await uploadResponse.json().catch(() => ({}));
      throw new Error(err.detail || "Upload failed — is the backend running?");
    }

    const paper = await uploadResponse.json();
    statusEl.textContent = `Saved: ${paper.title.slice(0, 60)}`;
    showMsg("Saved to your library ✓", "success");
  } catch (e) {
    showMsg(e.message || "Something went wrong", "error");
    saveBtn.disabled = false;
  }
});

init();
