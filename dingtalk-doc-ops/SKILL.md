---
name: dingtalk-doc-ops
description: Read and write DingTalk alidocs documents (alidocs.dingtalk.com) with the built-in browser — capture the full text of a virtualized doc, download/extract video frames, and insert or append content via synthesized paste including large-text injection. Use when the user shares an alidocs link, asks to 抓文档/读钉钉文档, record findings into 「复制粘贴文档」, or write/append anything to a DingTalk doc.
---

# DingTalk Doc Read & Write

## Scope

Capture or edit documents on `alidocs.dingtalk.com` (`/i/nodes/<id>`). The user's stash document is 「复制粘贴文档」 node `vy20BglGWOxjGpq0CvX0xd9xVA7depqY` (used for raw captures/links; new content goes to the TOP). Write format requirement: concise 3–5 line summary + raw evidence appended as-is (never paraphrase or keep only locally).

## Login

Sessions expire to `login.dingtalk.com` — ask the user to scan the QR code, then continue.

## Read (virtualized editor)

1. Body lives in the same-origin iframe `note/preview` inside `/i/nodes/<id>`; parent JS can reach `iframe.contentDocument`. Content is virtualized — `innerText` only holds the rendered window.
2. Force re-render: override `document.visibilityState='visible'` / `hidden=false` via `Object.defineProperty` inside the iframe, set the scroll container's `scrollTop`, dispatch a `scroll` event, wait ~1s.
3. The scroll container = div with `scrollHeight > clientHeight+100 && clientHeight>200`, largest `scrollHeight` (often `#layout_body`).
4. Capture screen-by-screen (step ~300–700px, wait 600–900ms), merge windows by tail-overlap; dedupe fixed header/footer lines (点赞/送能量/字数).
5. If the browser panel is CLOSED (viewport 0×0), the editor body does not render: set the iframe element size to 1280×900 (`style.cssText`), then `iframe.contentWindow.location.reload()`, wait ~8s — content renders.

## Videos in docs

- Videos are signed CDN mp4 URLs in the iframe. `curl` with `Referer: https://alidocs.dingtalk.com/` + browser UA downloads them.
- Frames: `navigate_page` to the signed URL (ERR_FAILED is fine — it enters the media document), then `canvas.drawImage(video)` + `toDataURL('image/jpeg')` inside same-origin.
- Large tool outputs auto-spill to tool-result files; recover base64 with `grep -o 'base64,[A-Za-z0-9+/=]*' | sed 's/^base64,//' | base64 -d`.

## Write (synthesized paste)

1. Editor iframe `note/edit?...` is same-origin with the parent; the editor is custom-rendered, no contenteditable. Input goes through a hidden `TEXTAREA`.
2. Activate it: synthesize pointer sequence (`pointerdown→mousedown→pointerup→mouseup→click` with clientX/Y) on a SAFE text block — **avoid `<a>` links (clicking a URL navigates away)**.
3. Verify `iframe.contentDocument.activeElement.tagName === 'TEXTAREA'`.
4. `Ctrl+Home` keydown (jump to doc start) → dispatch a synthetic paste:
   `const dt=new DataTransfer(); dt.setData('text/plain', text); ta.dispatchEvent(new ClipboardEvent('paste',{bubbles:true,cancelable:true,clipboardData:dt}))`.
5. Pasted markdown auto-converts to rich text (headings/lists/tables) — a 4-option menu may appear; a synthetic `Escape` keydown dismisses it. Raw markdown source cannot be stored this way.
6. Undo = synthesized `Ctrl+Z` after re-clicking a safe block (direct `.focus()` doesn't work for undo).
7. **Large text (10KB+) injection**: real CDP `press_key("Control+V")` does NOT work (browser focus doesn't enter the iframe). Instead serve the file locally: PowerShell `HttpListener` on `http://127.0.0.1:8899/` (non-admin can listen on 127.0.0.1; keep the .ps1 script ASCII-only — PS 5.1 reads scripts as ANSI and a Chinese path fails), then in the page `fetch('http://127.0.0.1:8899/doc.txt')` (https page fetching 127.0.0.1 bypasses mixed-content; return `Access-Control-Allow-Origin: *`) → store in `window.__pasteText` → paste as above. Stop the server afterwards.
8. Verify the insert: scroll to top and read lines; check for `已保存` next to the title; confirm old content still follows below.
