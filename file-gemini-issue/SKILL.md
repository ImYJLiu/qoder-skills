---
name: file-gemini-issue
description: File, update, comment on, or query GEMINI Jira issues (jira.gmarket.com) following team conventions. Use when asked to 提 Jira 单/提单, create or update a GEMINI issue, set Epic Link (团队 Kanban 必挂), add a bilingual comment, or attach files/videos. Covers component IDs, assignee mapping, Epic Link / Epic Name field IDs, Chinese+English style, in-page REST calls, and attachment upload.
---

# File GEMINI Jira Issue

## Scope

Create / update issues in the internal Jira `https://jira.gmarket.com`, project `GEMINI` (Bug id=1, Task id=3). Typical requests: "按文档提 Jira 单"（把钉钉文档/分析转成开发单）、补/改字段（assignee、component、Epic Link）、加评论、传附件。

## Safety

- Filing and field changes are visible to others. A "file it from this doc" request authorizes creating the issue as described; when title/assignee/component/attachments/epic link are ambiguous, confirm before submitting.
- Never put credentials, cookies, or session tokens into issue content.

## Conventions

- Reporter account: Luna (`ddcm41`).
- Default assignee for IM seller/app/web issues: Bruce (`ddcm57`). Do NOT default to `hyunlee` (이현성) — AIDC domain/session contact. Others seen: Runyon (`lzd2572`) for 부재중/absence logic; Paul (`ddcm45`) for server/AIDC.
- Language (updated 2026-10-15): follow the language the user asks for THAT ticket. Default = **Chinese + English**; Korean-facing tickets (e.g. GEMINI-4301) = **Korean + English**. **EVERY section must carry its translation, not just the title** — the user audits and will ask 「英文去哪里了？」. (The 10-09 blanket CN+EN rule is now "per-ticket instruction, each section translated".)
- Style: short and direct. One line when one line is enough. No long multi-section essays. Users WILL demand trimming (「太TM罗嗦了，精简一下」) — write it short the first time.
- IM issue title prefix: `[IM/Seller/App|Web]` or `[IM/Buyer/SDK]` + bilingual title.
- Description shape (2026-10-15, worked well): compact `h3` blocks — `h3. 환경 / Environment` → `h3. 문제 / Problem` → `h3. 재현 / Steps`, target ~600–1500 chars total. Put the repro accounts AND passwords (seller + buyer) in the environment block for STG tickets; paste raw responses (open.chat.page, OCP, frames) in `{code}` blocks.
- Links: paste FULL PDP URLs (`https://item-stg.gmarket.co.kr/Item?goodsCode=…`), not bare item IDs. Verify the URL form before putting it in the ticket.
- Screenshot-based sightings: do NOT interact with the scene; note 「现场未做任何操作，以截图为准」 in the description.
- Dedup first: JQL-search the itemId / keywords before creating. Link related tickets with a short comment (e.g. GEMINI-4290 ↔ 4242「已于 10-12 Done」).
- **STG 环境的单 / STG environment tickets（2026-10-13）**: 标题最前加 `【STG】` 前缀（例：`【STG】[IM/Buyer/Web] …`）；labels 必须包含 `STG`；Component 必须包含 `100. IM Core Function (Section 1)`（30978）。
- **Epic Link 必挂（2026-10-13 定，否则单不会出现在团队 Kanban 上）**：新建 IM / 聊天平台相关单时，必须设 Epic Link = `GEMINI-2453`（Epic Name「[G][ESM] 채팅 플랫폼 구축 Ph1_Gemini」＝「聊天平台构建 Ph1_Gemini」）。非聊天模块的单（如纯 ESM+ 登录会话类）另议。
  - Epic 搜索坑：该 epic 的 summary 显示为「…Ph1 QA」，且 JQL 按 `"Gemini"` / `"Ph1"` 都搜不到它（"Ph1_Gemini" 被分词成单个 token）。要搜用 `issuetype = Epic AND "Epic Name" ~ "Ph1*"`，或直接用单号 **2453**。
- Bug 单必须包含: what happened / root cause / how to reproduce / raw evidence (trace, response)。

## Field IDs / quick reference

- Issue types: Bug=1, Task=3.
- Components: `02. AIDC (Other topic)`=30408；`100. IM Core Function (Section 1)`=30978；`09. Gmarket ESM`=30334；`105. Others (login, push, etc.) (Section 6)`=30983。
- Epic Link = `customfield_10501`（值 = epic 单号字符串，如 `"GEMINI-2453"`）；Epic Name = `customfield_10502`。
- 聊天平台 Ph1 epic = **GEMINI-2453**（本条与 `gemini-epic-link-fields` 记忆互为备份）。

## Operate via the logged-in page

Shell `curl` returns 401 — do everything inside the browser on an authenticated jira.gmarket.com page via `evaluate_script`（请求头带 `X-Requested-With: XMLHttpRequest`）：

- Query: `fetch('/rest/api/2/issue/<KEY>?fields=...')` / `/rest/api/2/search?jql=<encoded>`。
- Create: `POST /rest/api/2/issue`，JSON body。创建时直接在 `fields` 里带上 `customfield_10501: "GEMINI-2453"` 一步到位；若不确定，创建后立即 PUT 补挂（已验证）。
- Update（含补 Epic Link）: `PUT /rest/api/2/issue/<KEY>`，body `{"fields":{"customfield_10501":"GEMINI-2453"}}` → 204；改字段后 GET 复查。
- Upload attachments: in-page `fetch` + `FormData` POST `/rest/api/2/issue/<KEY>/attachments` with header `X-Atlassian-Token: no-check`. For local files: inject `<input type=file>`, get its uid via `take_snapshot`, feed it with the browser-use `upload_file` tool, then FormData-POST (verified with an 890KB mp4; do not use shell curl).

## Workflow

1. Read the source doc/analysis; draft the bilingual title + description (concise).
2. Confirm component + assignee (+ title prefix / STG rules) per conventions.
3. Create in-page；IM 单同时挂 Epic Link `GEMINI-2453`。
4. Attach evidence files if any.
5. Verify via GET（summary、component、labels、`customfield_10501`）；report issue key + URL。
