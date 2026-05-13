// popup.js — Settings UI logic

const $ = (id) => document.getElementById(id);

// ── Load saved config ──────────────────────────────────────────────────────────
chrome.storage.sync.get(
  { token: "", repo: "", branch: "main", basePath: "solutions", pushCount: 0, lastPush: null },
  (data) => {
    $("token").value    = data.token    || "";
    $("repo").value     = data.repo     || "";
    $("branch").value   = data.branch   || "main";
    $("basePath").value = data.basePath || "solutions";

    $("push-count").textContent = data.pushCount || 0;
    $("last-push").textContent  = data.lastPush
      ? new Date(data.lastPush).toLocaleDateString(undefined, { month: "short", day: "numeric" })
      : "—";
  }
);

// ── Save ───────────────────────────────────────────────────────────────────────
$("save").addEventListener("click", () => {
  const token    = $("token").value.trim();
  const repo     = $("repo").value.trim();
  const branch   = $("branch").value.trim()   || "main";
  const basePath = $("basePath").value.trim() || "solutions";

  const status = $("status");

  if (!token || !repo) {
    status.textContent = "⚠ Token and repository are required.";
    status.className   = "err";
    return;
  }

  if (!repo.includes("/")) {
    status.textContent = '⚠ Repo must be "username/repo-name".';
    status.className   = "err";
    return;
  }

  chrome.storage.sync.set({ token, repo, branch, basePath }, () => {
    status.textContent = "✓ Saved! You're all set.";
    status.className   = "ok";
    setTimeout(() => { status.textContent = ""; }, 3000);
  });
});
