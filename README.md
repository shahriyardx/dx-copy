# 🚀 dx-copy

**Copy any GitHub repository instantly — interactively or from the command line.**

`dx-copy` lets you clone a source GitHub repo and push it to a new destination with a single command.  
Perfect for duplicating repos, migrating projects, or quickly copying templates.

---

## ✨ Features

- 🧠 **Interactive Mode** – just run `npx dx-copy` and answer a few prompts  
- ⚙️ **Non-interactive Mode** – pass source & destination directly  
- 🔁 **Copies All Branches + Tags**  
- 🧹 **Optional Cleanup** – delete local copy automatically  
- 💻 **Cross-platform** – works on macOS, Linux, and Windows  
- 🧩 **No dependencies** beyond Git + Node  
- 🎨 Beautiful ASCII banner in interactive mode  

---

## 📦 Installation

You can use it **without installing globally** thanks to npm’s `npx`:

```bash
npx dx-copy
```

or install globally:
```bash
npm install -g dx-copy
```

## Usage
Provide source and destination directly:
```bash
npx dx-copy <source> <destination> [--preserve|-p]
```

Example
```bash
npx dx-copy https://github.com/shahriyardx/dx-copy.git https://github.com/yourname/dx-copy.git
```
