// content.js v6
(function() {
  "use strict";

  const s = document.createElement("script");
  s.src = chrome.runtime.getURL("src/inject.js");
  s.onload = () => s.remove();
  (document.head || document.documentElement).appendChild(s);

  let pollTimer = null;

  window.addEventListener("__lc_gh_submission", (e) => {
    const { submissionId, code, lang } = e.detail;
    console.log("[LC→GH] Got submission event — id:", submissionId, "lang:", lang);
    startPolling(submissionId, code, lang);
  });

  window.addEventListener("__lc_gh_accepted", (e) => {
    const { code, lang, data } = e.detail;
    console.log("[LC→GH] Got accepted event — lang:", lang);
    triggerPush(code, lang, data);
  });

  function startPolling(id, code, lang) {
    if (pollTimer) clearInterval(pollTimer);
    let n = 0;
    pollTimer = setInterval(async () => {
      if (++n > 30) { clearInterval(pollTimer); return; }
      try {
        const csrf = (document.cookie.match(/csrftoken=([^;]+)/) || [])[1] || "";
        const res  = await fetch(`https://leetcode.com/submissions/detail/${id}/v2/check/`, {
          headers: { "x-csrftoken": csrf, "referer": location.href }
        });
        const d = await res.json();
        console.log(`[LC→GH] Poll ${n} — state: ${d?.state}, status: ${d?.status_msg}, lang: ${d?.lang}`);
        if (d?.lang) lang = d.lang;
        if (d?.code) code = d.code;
        if (d?.state === "SUCCESS") {
          clearInterval(pollTimer);
          if (d.status_msg === "Accepted") triggerPush(code, lang, d);
          else console.log("[LC→GH] Not accepted:", d.status_msg);
        }
      } catch(e) { console.warn("[LC→GH] Poll error:", e.message); }
    }, 2000);
  }

  let lastPushed = "";
  function triggerPush(code, lang, data) {
    if (!code || code === lastPushed) return;
    lastPushed = code;
    // Wait 2s for result page DOM to fully render (difficulty badge, title with number)
    setTimeout(() => doPush(code, lang, data), 2000);
  }

  function doPush(code, lang, data) {
    const resolvedNum   = number();
    const resolvedDiff  = diff();
    const resolvedTitle = title();
    console.log("[LC→GH] Pushing:", resolvedTitle, resolvedDiff, normLang(lang), "num:", resolvedNum);

    const payload = {
      type:          "LEETCODE_ACCEPTED",
      problemSlug:   slug(),
      problemTitle:  resolvedTitle,
      problemNumber: resolvedNum,
      lang:          normLang(lang),
      code,
      difficulty:    resolvedDiff,
      runtime:       data?.status_runtime || "N/A",
      memory:        data?.status_memory  || "N/A",
      timestamp:     new Date().toISOString(),
    };

    chrome.runtime.sendMessage(payload, (resp) => {
      if (chrome.runtime.lastError) { console.error("[LC→GH]", chrome.runtime.lastError.message); return; }
      if (resp?.ok) {
        toast(`✓ Pushed to GitHub — ${resp.path}`);
        chrome.storage.sync.get({ pushCount: 0 }, ({ pushCount }) =>
          chrome.storage.sync.set({ pushCount: pushCount + 1, lastPush: new Date().toISOString() }));
      } else {
        console.error("[LC→GH] Push failed:", resp?.error);
        toast(`✗ Push failed — ${resp?.error || "see console"}`, "error");
      }
    });
  }

  function slug() {
    return (location.pathname.match(/\/problems\/([^/]+)/) || [])[1] || "unknown";
  }

  function title() {
    // After submission, LeetCode updates the page title to include the number
    // e.g. "20. Valid Parentheses - LeetCode"
    const t = document.title.replace(/ - LeetCode$/, "").trim();
    return t || slug();
  }

  function number() {
    // Try page title first — most reliable after result loads
    const fromTitle = (document.title.match(/^(\d+)\./) || [])[1];
    if (fromTitle) return fromTitle.padStart(4, "0");

    // Try visible heading on the page
    for (const sel of ['[data-cy="question-title"]', 'h4', 'h3', 'h2', 'h1']) {
      const el = document.querySelector(sel);
      if (el) {
        const m = el.textContent.match(/^(\d+)\./);
        if (m) return m[1].padStart(4, "0");
      }
    }

    // Try from the URL slug (e.g. "20-valid-parentheses")
    const fromSlug = (slug().match(/^(\d+)-/) || [])[1];
    if (fromSlug) return fromSlug.padStart(4, "0");

    // Try all text nodes for "20." pattern
    const allEls = document.querySelectorAll("a, span, div, p");
    for (const el of allEls) {
      const t = el.textContent.trim();
      if (/^\d+\.\s/.test(t)) {
        const m = t.match(/^(\d+)\./);
        if (m) return m[1].padStart(4, "0");
      }
    }

    return "0000";
  }

  function diff() {
    // Try class-based selectors (most reliable)
    const classSelectors = [
      '[class*="text-difficulty-easy"]', '[class*="text-difficulty-medium"]', '[class*="text-difficulty-hard"]',
      '[class*="difficulty-easy"]',      '[class*="difficulty-medium"]',      '[class*="difficulty-hard"]',
      '[class*="Easy"]',                 '[class*="Medium"]',                 '[class*="Hard"]',
    ];
    for (const sel of classSelectors) {
      const el = document.querySelector(sel);
      if (el) {
        const cls = el.className.toLowerCase();
        if (cls.includes("easy"))   return "easy";
        if (cls.includes("medium")) return "medium";
        if (cls.includes("hard"))   return "hard";
        // The text itself might be the answer
        const t = el.textContent.trim();
        if (t === "Easy") return "easy"; if (t === "Medium") return "medium"; if (t === "Hard") return "hard";
      }
    }
    // Scan all <span> elements for exact match
    for (const el of document.querySelectorAll("span")) {
      const t = el.textContent.trim();
      if (t === "Easy") return "easy"; if (t === "Medium") return "medium"; if (t === "Hard") return "hard";
    }
    return "unknown";
  }

  function normLang(r = "") {
    const map = { python3:"py",python:"py",javascript:"js",typescript:"ts",java:"java",
      "c++":"cpp",cpp:"cpp",c:"c","c#":"cs",go:"go",golang:"go",rust:"rs",
      kotlin:"kt",swift:"swift",ruby:"rb",scala:"scala",php:"php" };
    return map[r.toLowerCase().replace(/\s+/g,"")] || r.toLowerCase().replace(/\s+/g,"") || "txt";
  }

  function toast(msg, type = "success") {
    const el = document.createElement("div");
    el.textContent = msg;
    Object.assign(el.style, {
      position:"fixed", bottom:"24px", right:"24px", zIndex:"99999",
      padding:"10px 18px", borderRadius:"8px", fontSize:"13px", fontWeight:"500",
      color:"#fff", background: type === "success" ? "#1a8a5a" : "#c0392b",
      boxShadow:"0 4px 16px rgba(0,0,0,.2)", opacity:"1", transition:"opacity .4s",
    });
    document.body.appendChild(el);
    setTimeout(() => { el.style.opacity = "0"; }, 3500);
    setTimeout(() => { el.remove(); }, 4000);
  }

  console.log("[LC→GH] Content script loaded on", location.pathname);
})();
