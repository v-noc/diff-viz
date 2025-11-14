# Git Diff Visualizer (Prototype)

This is a prototype UI for a Git diff visualizer that I originally planned for [v-no](https://github.com/v-noc/IDE). Its goal is to minimize noise in diffs and show changes at the function/class level, instead of forcing you to read large blocks of raw text. By structuring diffs this way, we can make it easier and faster for both humans and LLMs to understand changes.

Right now, this prototype:
- Only supports **local repositories**
- Focuses purely on **visualization** (no editing or workflow actions yet)

In the future, this could evolve into a extension, desktop app, or CLI tool. The vision is to support richer workflows like **approving changes function-by-function or class-by-class**, instead of approving or rejecting an entire file or pull request at once.