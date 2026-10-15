---
name: inspect-esmplus-chat
description: Inspect, capture, and drive ESM+ / Gmarket chat — hook mtop message APIs, extract messageId/templateData/iconUrl, check DOM rendering, and run seller-side or buyer-side test conversations. Use for 抓聊天消息、排查聊天不显示/商品卡图片、IM GEMINI 单复现、买卖双方联调测试、chat-dev / chat-av / n/chat debugging.
---

# Inspect ESM+ Chat (seller & buyer)

## Scope

Debug and drive the chat systems: seller center dev `chat-dev.esmplus.com` (STG `chat-av.esmplus.com`), buyer pages `www-dev.gmarket.co.kr/n/chat` / `www-stg.gmarket.co.kr/n/chat`.

## Prerequisites

- Seller: ESM+ session (`login-esmplus`) + chat consent for direct replies (`set-chat-consent`).
- Buyer: Gmarket buyer session (`register-gmarket-buyer`).
- Screenshots need the Browser panel open; `evaluate_script` works regardless.

## IDs & gateways

- sid: `6#103#<sellerCustNo>#2#<buyerCustNo>#1`; message ID = `typeData.mid` in the message JSON.
- Seller account = G마켓 sellerCustNo (gemsell17=500000149); buyer = buyer custNo.
- mtop gateways: dev `acs-daily.esmplus.com` / `acs-daily.gmarket.co.kr`; STG/prod `acs-m.esmplus.com` / `acs-m.gmarket.co.kr`.

## Capture message data

1. Hook XHR + fetch in the chat page BEFORE opening the room (wrap `open`/`send`/`setRequestHeader`, read bodies on `loadend`; also hook `fetch`).
2. Keep response bodies WHOLE — the `traceId` is at the END of the mtop JSON (also in the `x-eagleeye-id` response header); truncation loses it.
3. Key APIs: `mtop.gmkt.im.use.web.seller.messagebox.querySessionList`, `…queryMessageListBySessionId`, `mtop.gmkt.im.seller.list.status.query`, `receiver.web.seller.usermessage.putRangeReadOffset`, `mtop.gmkt.im.seller.accountrel.get` (per-ID `isConsented`).
4. If re-clicking a room doesn't refetch: switch seller accounts via `.im-seller-account-trigger` → `.im-seller-account-item` and back; digging messages from the React fiber is a fallback.

## Extract & verify rendering

- Goods-card messages: `body.templateData` (JSON string) — `itemId`, `title`, `price`, `iconUrl`, `actionUrl`, `skuId`. **Known bug class: `iconUrl` missing the `https://` scheme → frontend shows a fallback placeholder (no `<img>` in DOM). Flag the affected `typeData.mid`s; CDN-check the image separately before blaming it.**
- DOM: bubbles carry `data-message-id`; broken card images render `.im-seller-card-product-image-fallback`. Scroll the list to the top to render old messages.
- UI states: consent popup (see `set-chat-consent`); 「다른 상담사 상담중」 = taken over by another agent; `연결에 실패하였습니다` = gateway/connection issue.

## Seller-side test replies

1. In a 스마트챗/자동상담 room click `직접 상담하기` (needs consent; writes 「판매자와 대화가 시작되었습니다」).
2. Editor: `textarea.im-seller-editor-input` — React-controlled, use the native setter + `input` event before clicking `button.im-seller-editor-send`.
3. Switch back with `자동 상담 전환` (writes 「판매자와 대화가 종료되었습니다」). Both buttons call `mtop.gmkt.im.seller.mode.switch`.
4. Unread belongs to the current handler; opening a room does NOT clear another agent's unread — the `내가 상담하기` takeover does.

## Buyer-side programmatic send

On `www-dev.gmarket.co.kr/n/chat`:

```js
const t = new IMChat({ isNew: true, role: 'buyer' }); await t.init();
const sm = t.engine.managers.sessionManager, mm = t.engine.managers.messageManager;
const sess = await sm.createSession('<sellerCustNo>', 'seller');
mm.setActiveSessionId(sess.sessionId); await mm.sendMessage(1, { txt: 'test' });
```

- Buyer editor: `textarea.im-buyer-editor-input` + `button.im-buyer-editor-send` (same React setter trick). `fetchSessionListFirstPage()` gives `nonReadNumber` / `selfPosition`.
- Use English for test messages, and AVOID the word 「채팅」 — the content filter blocks it (`warn:true`, `onlyForSelf:true`, sender sees a sensitivity notice).

## STG seller-console chat menus (2026-10-15)

Shell pages `https://av.esmplus.com/Home/v2/<slug>`, content = iframe — opening the `seller-av` iframe URL directly is easiest:

- `chat-basic-info` (기본 정보 관리): per 판매 아이디 — 채팅 서비스 동의 / 프로필 / **상담 시간·부재중 설정** (consultable days+hours, 부재중 메시지 ≤500 chars, 일시적 부재중 메시지 toggle). iframe `seller-av.esmplus.com/chat/basic-information`.
- `chat-counseling-member` (상담 멤버 관리): who may enter the chat system — 마스터/판매 아이디 need NO permission; **매니저 아이디 need the 상담 멤버 permission**. Table 매니저 아이디 / 권한 상태 / 설정·해제. iframe `seller-av.esmplus.com/chat/counseling-member-management`. geminiaidc family (10-15): mnggem1 권한 있음; mnggem2 / mnggem3 권한 없음.
- `chat-quick-response` (자주 쓰는 문구 관리): 제목 ≤50 / 내용 ≤1000, 신규 등록 layer; **hard cap 10 entries** (max-10 dialog). iframe `seller-av.esmplus.com/chat/quick-response-management`. geminiaidc is at 10/10 (10-15).
- `chat-product-faq` (내 상품 FAQ 관리): FAQ list + **노출 순서 설정** draggable order layer (적용 submits). Order changes did NOT reach the buyer Qcard → GEMINI-4301.

## Button disable policy (GEMINI-2920 [Core Policy] ChatRoom Button Disabled Policy)

The rules for when chat-room card buttons are disabled:

- Buyer side, main rule: `message.contextId ≠ room.currentContextId` (old-context card) ⇒ **ALL buttons on that card disabled**.
- Same-context Rule Mode → Direct Mode switch also disables all buttons (Policy_B) — not only context switches.
- Q Card buttons stay enabled after a click (repeatable); CTA (Agent Flow) buttons disable after one click (Policy_D).
- Seller view: card buttons are always disabled — and NOT greyed (don't judge by color).

## Message board (게시판 문의 / 留言板)

- Entry from chat: card button 「문의 게시글 남기기」 → `inquiry.gmarket.co.kr/ask-seller?entryCode=AIMCHAT-G…`.
- **Where submissions land (verified live 2026-10-15, lunaliu031 → gemsell12, itemId 4852650004, 3 posts)**:
  - Buyer: MyG → 문의내역/쪽지함 → 「판매자 문의」 tab (status 접수완료). Direct: `diary2.gmarket.co.kr/MYBBS/MyInqueryList3` (STG `diary2-av` entry redirects there).
  - Seller: ESM+ 문의/리뷰 관리 → 문의 관리 →「게시판 문의」 (also shows in the notification list); iframe `seller-av.esmplus.com/qna/manage-qna` (조회결과 counts).
- Known defect: the board shows a Chinese validation 「请在列表中选择一项。」 when submitting without 문의 종류 → GEMINI-4302.

## Known issues worth remembering

- Opening the chat from the product page (OPEN_CHAT_PAGE) re-sends an auto bundle on EVERY open — GREETING guide (IM_RULE_WELCOME, autoMessageType=GREETING, texts rotate between variants) + goods card + reinquiry card; no dedup, N opens → N bundles (2026-10-10).
- PDP-entry bundle live gap (2026-10-14 STG): the bundle is written ~2.4s after `open.chat.page`, but the entering page's one-shot message fetch runs ~0.2s after it — so without a push the entered window never shows its OWN goods card (it always shows one-entry-behind content; user phrasing "第二个 PDP 的商品卡不下发"). Verified per-room: gemsell17's room got 0 ACCS push frames for 5/5 entries (bundles existed, silent) while gemsell05's pushed + auto-refetched + rendered 2/2 with the SAME buyer account — points at the server-side rule/sync notification for that room. Any later push (buyer sends a message) or a room reopen refetches and renders all missed bundles. Diagnosis recipe: `navigate_page` initScript hooking XHR/fetch + wrapping `WebSocket` (log in/out frames) → enter via `/n/chat?itemId=…` → compare bundle write time (autoRefetch / session preview / later message pull) vs inbound frames. **Filed 2026-10-15 as GEMINI-4292** (【STG】[IM/Buyer/SDK], with the full timeline + raw ACCS frame logs in the description).
- Waiting-timer stale: list 「买家等待计时」 (`firstTargetAfterSelfMsgTime`) is not updated by push for already-open windows; refresh fixes — GEMINI-3871.
- New-room message history can lag in dev (intermittent) — re-query before concluding messages were lost.
- STG seller gateway had `FAIL_SYS_SESSION_SERVICE_FAULT` (2026-10-09) — retry/check server side before blaming the client.
- Buyer report dialog shows failure although the API returns SUCCESS (2026-10-15): the buyer SDK rejects the empty successful response — the seller-report path is special-cased to accept `{}`, the buyer path is not. → GEMINI-4290 (front-end close-out of GEMINI-4242, Done 10-12).
- Buyer 「차단하기」 (block seller) toggles with NO confirmation popup — takes effect immediately. → GEMINI-4294.
- Same session can render in different orders across windows (welcome / goods card / Qcard shuffled). → GEMINI-4300.
- 부재중 (absence) auto-message missing the 「상담 가능 시간」 text / shows a Qcard instead of the business-info card. → GEMINI-4299.
