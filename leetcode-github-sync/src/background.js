// background.js — Service worker
// Receives accepted solutions from content.js and commits them via GitHub API

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.type !== "LEETCODE_ACCEPTED") return false;

  // Must return true to keep the message channel open for async response
  handlePush(msg).then(sendResponse).catch((err) => {
    console.error("[LC→GH background]", err);
    sendResponse({ ok: false, error: err.message });
  });

  return true;
});

// ── Main push logic ────────────────────────────────────────────────────────────
async function handlePush(payload) {
  const config = await getConfig();

  if (!config.token || !config.repo) {
    throw new Error("GitHub token or repo not configured. Open the extension popup to set them.");
  }

  const { problemSlug, problemNumber, problemTitle, lang, difficulty, code, runtime, memory, timestamp } = payload;

  // Build file path:  solutions/easy/0001-two-sum.py
  const fileName = `${problemNumber}-${problemSlug}.${lang}`;
  const filePath = `${config.basePath || "solutions"}/${difficulty}/${fileName}`;

  // Prepend a comment header to the code
  const commentChar = getCommentChar(lang);
  const header = buildHeader(commentChar, { problemTitle, problemNumber, difficulty, runtime, memory, timestamp });
  const fullCode = header + "\n" + code;

  // Check if file already exists (to get its SHA for updates)
  const sha = await getFileSHA(config, filePath);

  // Create or update the file
  const commitMessage = sha
    ? `refactor: update ${problemTitle} (${difficulty})`
    : `solve: ${problemNumber}. ${problemTitle} [${difficulty}] (${lang})`;

  await commitFile(config, filePath, fullCode, commitMessage, sha);

  return { ok: true, path: filePath };
}

// ── GitHub API helpers ─────────────────────────────────────────────────────────
async function getFileSHA(config, path) {
  const res = await ghFetch(config, "GET", `/repos/${config.repo}/contents/${path}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`GitHub contents check failed: ${res.status}`);
  const data = await res.json();
  return data.sha || null;
}

async function commitFile(config, path, content, message, sha) {
  const body = {
    message,
    content: btoa(unescape(encodeURIComponent(content))), // UTF-8 safe base64
    branch:  config.branch || "main",
  };
  if (sha) body.sha = sha;

  const res = await ghFetch(config, "PUT", `/repos/${config.repo}/contents/${path}`, body);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`GitHub commit failed: ${res.status} — ${err.message || "unknown"}`);
  }
  return res.json();
}

function ghFetch(config, method, endpoint, body) {
  const url = `https://api.github.com${endpoint}`;
  const opts = {
    method,
    headers: {
      Authorization: `token ${config.token}`,
      Accept:        "application/vnd.github.v3+json",
      "Content-Type": "application/json",
    },
  };
  if (body) opts.body = JSON.stringify(body);
  return fetch(url, opts);
}

// ── Config storage ─────────────────────────────────────────────────────────────
function getConfig() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(
      { token: "", repo: "", branch: "main", basePath: "solutions" },
      resolve
    );
  });
}

// ── Code header builder ────────────────────────────────────────────────────────
function buildHeader(c, { problemTitle, problemNumber, difficulty, runtime, memory, timestamp }) {
  const d = difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
  const date = timestamp.split("T")[0];
  return [
    `${c} ─────────────────────────────────────────────────`,
    `${c}  Problem : ${problemNumber}. ${problemTitle}`,
    `${c}  Difficulty : ${d}`,
    `${c}  Runtime  : ${runtime}`,
    `${c}  Memory   : ${memory}`,
    `${c}  Solved   : ${date}`,
    `${c} ─────────────────────────────────────────────────`,
    "",
  ].join("\n");
}

function getCommentChar(lang) {
  const hash = ["py", "rb", "sh"];
  const slash = ["js", "ts", "java", "cpp", "c", "cs", "go", "rs", "kt", "swift", "scala", "php"];
  if (hash.includes(lang))  return "#";
  if (slash.includes(lang)) return "//";
  return "//";
}
