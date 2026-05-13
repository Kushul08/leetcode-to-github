# 🧩 LeetCode to GitHub

A browser extension that automatically pushes your LeetCode solutions to a GitHub repository — so your grind is always saved, version-controlled, and visible on your profile.

---

## ✨ Features

- ✅ Auto-syncs accepted LeetCode submissions to your GitHub repo
- 📁 Organizes solutions by problem number and title
- 🏷️ Includes problem difficulty, tags, and your submission language
- 🔄 Works on submission — no manual copy-paste needed
- 🌐 Supports all LeetCode-supported languages (Python, Java, C++, JS, etc.)

---

## 📦 Installation

### From source (developer mode)

1. Clone this repo:
   ```bash
   git clone https://github.com/Kushul08/leetcode-to-github
   ```

2. Open your browser's extension page:
   - Chrome: `chrome://extensions`
   - Edge: `edge://extensions`

3. Enable **Developer Mode** (top right toggle)

4. Click **Load unpacked** and select the cloned folder

---

## ⚙️ Setup

1. Generate a GitHub **Personal Access Token** with `repo` scope:
   👉 [github.com/settings/tokens](https://github.com/settings/tokens)

2. Create a **new GitHub repository** to store your solutions (can be private or public)

3. Open the extension popup and enter:
   - Your GitHub username
   - Your Personal Access Token
   - Your target repository name

4. Hit **Save** — you're all set!

---

## 🚀 Usage

1. Solve a problem on [leetcode.com](https://leetcode.com)
2. Submit your solution
3. On a successful submission, the extension automatically pushes your code to GitHub

Your repo will be organized like:
```
📂 your-repo/
 ┣ 📂 0001-two-sum/
 ┃ ┗ solution.py
 ┣ 📂 0042-trapping-rain-water/
 ┃ ┗ solution.cpp
 ┗ ...
```

---

## 🛠️ Tech Stack

- JavaScript (Chrome Extensions API)
- GitHub REST API
- LeetCode DOM / submission hooks

---

## 🤝 Contributing

Contributions are welcome! Here's how:

1. Fork the repo
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -m "Add my feature"`
4. Push and open a Pull Request

Please open an issue first for major changes.

---


## 🙏 Acknowledgements

Inspired by the grind. Built for developers who want their GitHub to reflect their real work.
