# ⚡ LeetCode → GitHub Sync

> Automatically push every accepted LeetCode solution to your GitHub repo — just like NeetCode does, but for LeetCode.

## How it works

1. You submit a solution on LeetCode
2. The Chrome extension intercepts the API response
3. If status is **Accepted**, it commits the code to your GitHub repo
4. Solutions are organized as `solutions/<difficulty>/<number>-<slug>.<ext>`

```
solutions/
  easy/
    0001-two-sum.py
    0009-palindrome-number.js
  medium/
    0003-longest-substring-without-repeating-characters.py
    0146-lru-cache.cpp
  hard/
    0023-merge-k-sorted-lists.java
```

Each file gets a clean header comment:
```python
# ─────────────────────────────────────────────────
#  Problem    : 0001. Two Sum
#  Difficulty : Easy
#  Runtime    : 52 ms
#  Memory     : 16.4 MB
#  Solved     : 2024-01-15
# ─────────────────────────────────────────────────
```

---

## Setup (5 minutes)

### Step 1 — Create a GitHub repo

Create a new **public or private** repo on GitHub (e.g. `your-username/leetcode-solutions`).
It must already exist before the extension can push to it.

### Step 2 — Generate a GitHub Personal Access Token

1. Go to [github.com/settings/tokens/new](https://github.com/settings/tokens/new)
2. Give it a name like `LeetCode Sync`
3. Set **Expiration** to your preference
4. Check the `repo` scope (full repository access)
5. Click **Generate token** and copy it

### Step 3 — Load the extension in Chrome

1. Open Chrome and go to `chrome://extensions/`
2. Enable **Developer mode** (top-right toggle)
3. Click **Load unpacked**
4. Select this folder (`leetcode-github-sync/`)

### Step 4 — Configure the extension

1. Click the extension icon in your toolbar
2. Paste your **GitHub token**
3. Enter your **repo** as `username/repo-name`
4. Adjust **branch** and **base folder** if needed
5. Click **Save settings**

### Step 5 — Solve problems!

Go to any LeetCode problem, submit your solution, and if it's **Accepted** — it automatically appears in your GitHub repo within seconds. 🎉

---

## Supported Languages

| LeetCode Language | File Extension |
|---|---|
| Python 3 / Python | `.py` |
| JavaScript | `.js` |
| TypeScript | `.ts` |
| Java | `.java` |
| C++ | `.cpp` |
| C | `.c` |
| C# | `.cs` |
| Go | `.go` |
| Rust | `.rs` |
| Kotlin | `.kt` |
| Swift | `.swift` |
| Ruby | `.rb` |
| Scala | `.scala` |
| PHP | `.php` |

---

## Notes

- **Only "Accepted" submissions are pushed** — wrong answer, TLE, MRE are ignored
- **Re-submitting** an already-solved problem **updates** the file (it won't create duplicates)
- The extension uses the **GitHub Contents API** — no server or GitHub Actions needed
- Your token is stored in Chrome's encrypted `storage.sync`

---

## Troubleshooting

| Problem | Fix |
|---|---|
| Nothing happens on submit | Make sure the extension is enabled and you're on `leetcode.com/problems/*` |
| "GitHub push failed: 401" | Your token is invalid or expired — regenerate it |
| "GitHub push failed: 404" | Your repo doesn't exist yet — create it first |
| "GitHub push failed: 422" | Branch doesn't exist — change to `main` or `master` |
| Toast shows but repo is empty | Check the base folder setting matches your repo structure |
