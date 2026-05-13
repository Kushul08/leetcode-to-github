// inject.js — runs in PAGE context (not extension context)
// This intercepts XHR before LeetCode's own code runs

(function() {
  "use strict";

  let lastCode = "";
  let lastLang = "";

  // Override XHR to catch the submit request
  const _open = XMLHttpRequest.prototype.open;
  const _send = XMLHttpRequest.prototype.send;

  XMLHttpRequest.prototype.open = function(method, url, ...rest) {
    this._lcUrl = url;
    this._lcMethod = method;
    return _open.apply(this, [method, url, ...rest]);
  };

  XMLHttpRequest.prototype.send = function(body, ...rest) {
    const url = this._lcUrl || "";

    // Capture code + lang from submit
    if (url.includes("/submit/") || url.includes("/interpret_solution/")) {
      try {
        const b = typeof body === "string" ? JSON.parse(body) : {};
        if (b.typed_code) {
          lastCode = b.typed_code;
          console.log("[LC→GH] XHR submit — code length:", lastCode.length);
        }
        if (b.lang) {
          lastLang = b.lang;
          console.log("[LC→GH] XHR submit — lang:", lastLang);
        }
      } catch(_) {}

      this.addEventListener("load", function() {
        try {
          const d = JSON.parse(this.responseText);
          if (d?.submission_id) {
            console.log("[LC→GH] XHR submission_id:", d.submission_id);
            // Dispatch to content script via custom event
            window.dispatchEvent(new CustomEvent("__lc_gh_submission", {
              detail: { submissionId: d.submission_id, code: lastCode, lang: lastLang }
            }));
          }
        } catch(_) {}
      });
    }

    // Watch check endpoint
    if (url.includes("/check/")) {
      this.addEventListener("load", function() {
        try {
          const d = JSON.parse(this.responseText);
          if (d?.lang)  lastLang = d.lang;
          if (d?.code)  lastCode = d.code;
          if (d?.status_msg === "Accepted") {
            console.log("[LC→GH] XHR check — Accepted! lang:", lastLang);
            window.dispatchEvent(new CustomEvent("__lc_gh_accepted", {
              detail: { code: lastCode, lang: lastLang, data: d }
            }));
          }
        } catch(_) {}
      });
    }

    return _send.apply(this, [body, ...rest]);
  };

  // Also override fetch
  const _fetch = window.fetch;
  window.fetch = async function(...args) {
    const url = typeof args[0] === "string" ? args[0] : args[0]?.url || "";

    if (url.includes("/submit/")) {
      try {
        const b = typeof args[1]?.body === "string" ? JSON.parse(args[1].body) : {};
        if (b.typed_code) { lastCode = b.typed_code; console.log("[LC→GH] fetch submit — code length:", lastCode.length); }
        if (b.lang)       { lastLang = b.lang;       console.log("[LC→GH] fetch submit — lang:", lastLang); }
      } catch(_) {}
      const resp = await _fetch(...args);
      resp.clone().json().then(d => {
        if (d?.submission_id) {
          console.log("[LC→GH] fetch submission_id:", d.submission_id);
          window.dispatchEvent(new CustomEvent("__lc_gh_submission", {
            detail: { submissionId: d.submission_id, code: lastCode, lang: lastLang }
          }));
        }
      }).catch(() => {});
      return resp;
    }

    if (url.includes("/check/")) {
      const resp = await _fetch(...args);
      resp.clone().json().then(d => {
        if (d?.lang)  lastLang = d.lang;
        if (d?.code)  lastCode = d.code;
        if (d?.status_msg === "Accepted") {
          console.log("[LC→GH] fetch check — Accepted! lang:", lastLang);
          window.dispatchEvent(new CustomEvent("__lc_gh_accepted", {
            detail: { code: lastCode, lang: lastLang, data: d }
          }));
        }
      }).catch(() => {});
      return resp;
    }

    return _fetch(...args);
  };

  console.log("[LC→GH] Injected into page context ✓");
})();
