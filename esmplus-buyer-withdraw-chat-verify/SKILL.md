---
name: esmplus-buyer-withdraw-chat-verify
description: Create (optional) and deactivate a Gmarket dev buyer test account (gembuyN), then verify the conversation disappears from the seller's chat list (GEMINI-3825 rule 2). Full loop: register fresh buyer → start a conversation → screenshot → withdraw → screenshot → seller-side hidden check. Use when asked to 注销买家账号、跑 3825 注销+聊天隐藏测试、注册新买家测试号、造已注销买家样本, or withdraw a gembuyN test buyer. Two screenshots are mandatory: after starting the conversation and after withdrawal.
---

# Buyer Withdraw + Chat Hide Verify (GEMINI-3825)

## Scope

Dev-environment workflow covering the full GEMINI-3825 test loop: optionally register a fresh buyer (`gembuyN`), ensure an IM conversation with a seller, screenshot it, withdraw the buyer via member-web-dev, screenshot the result, then confirm the seller no longer sees the conversation in the ESM+ seller chat center (chat-dev). Covers the buyer-deactivation direction only — seller-account withdrawal is order-blocked and cannot produce a sample. Rule 1 of GEMINI-3825 ("store history separately") is backend-only and is NOT verifiable from the UI; do not claim it.

## Safety

- Withdrawal CONSUMES the account: re-registration needs a NEW ID after 7 days (individual) / 30 days (business). Withdraw only the account the user explicitly designates.
- HARD GATE before withdrawal: even when the user said "run the full flow", STOP before Step 2 and wait for an explicit in-the-moment instruction to withdraw. The user may still be taking their own screenshots or reviewing the thread — never infer approval from the earlier "run the flow" request. (2026-10-08: gembuy45 was withdrawn without this gate while the user was still mid-screenshot; they objected strongly.)
- Verify the account identity (custNo) before calling the withdraw API; abort on mismatch.
- Never persist passwords, verification codes, tokens, or cookies.
- Screenshots are mandatory evidence. Ask the user to open Qoder's Browser panel BEFORE starting. Canary it with a `take_screenshot` of any page; if it returns `NATIVE_BROWSER_VIEWPORT_UNAVAILABLE`, STOP and ask the user to open the panel — the evidence cannot be captured retroactively.

## Preconditions

- Buyer test account — either reuse an existing `gembuyN` (e.g. gembuy43; live browser session, or a password supplied by the user) or register a fresh one in Step 0.
- Seller-side session available in the same browser profile (for the chat-dev verification), and a conversation between buyer and a seller — if missing, create it in Step 1.
- Know the buyer custNo (read from the withdraw page, Step 2).

## Step 0 — Register a fresh buyer (optional; skip if reusing an account)

1. Log out of any current buyer session first — a lingering session makes `/signup` bounce to the home page.
2. Navigate directly to `https://signup-web-dev.gmarket.co.kr/signup/buyer` (the classic `sslmember2-dev` / `mobile-dev` entry chain is broken on this workstation).
3. Choose `개인 구매회원`, then click `간편 가입하고 쇼핑하기` with `el.click()` inside `evaluate_script` — native tool clicks are no-ops on this SPA.
4. On the terms page click `#terms-all` (the real 전체동의; `#form__checkbox-all` does not cascade).
5. Fill `input-id` (6–10 chars, letters+digits mixed), `input-password`, `input-password2`, `input-name`, `input-phone-number`, `input-email` — use the standard test identity: name `루나`, mobile `010-9999-00NN` (last two digits = account serial, e.g. gembuy44 → `010-9999-0044`), email `gembuyNN@gmail.com`; password is the team's established test password (never persist it). Assign `.value` and dispatch `input`/`keyup`/`change`/`blur` events.
6. CDP fills do not fire the jQuery validation handlers — call the page's validators directly with DOM element objects (NOT selector strings), then poll the six flags (`idValidation`, `pwdValidation`, `rePwdValidation`, `nameValidation`, `mobileNoValidation`, `emailValidation`):
   `getIdValidateType(elId)` (async) → `checkMobileNoValidation(elPhone)` → `validatePasswordType(elPwd)` → `validateRePassword(elPwd2)` → `checkNameValidation(elName, false)` → `getEmailValidateType(elEmail)` (async).
7. Once all six flags are true the page submits by itself (`POST /signup/privateBuyerProc` → `/signup/privateBuyerCompleted`, auto-logged-in). No SMS/identity verification in dev. Proceed to Step 1.

## Step 1 — Ensure the conversation exists, then screenshot

1. Buyer session: open `https://www-dev.gmarket.co.kr` and check the header for `로그아웃` (logged out). If not signed in, use `https://signinssl-dev.gmarket.co.kr/login/login?url=...`; the form's `onsubmit` is broken, so run `login.checkValid()` then `document.getElementById('loginForm').submit()`. Dismiss the passkey notice (`다음에 하기`) if it appears.
2. Open `https://www-dev.gmarket.co.kr/n/chat`. Buyers are shown masked (`gemb****`); match the target by its session item or create a new one:
   ```js
   const t = new IMChat({ isNew: true, role: 'buyer' }); await t.init();
   const sm = t.engine.managers.sessionManager, mm = t.engine.managers.messageManager;
   const sess = await sm.createSession('<sellerCustNo>', 'seller');
   mm.setActiveSessionId(sess.sessionId); await mm.sendMessage(1, { txt: 'test' });
   ```
3. Confirm the conversation renders (session list item `.im-buyer-session-item`, or open the room and check the message bubbles).
4. **Screenshot A — MANDATORY (after starting the conversation).** Capture the buyer chat page showing this conversation — room with messages preferred (header shows the seller), list item acceptable. It must visibly show the seller and a recent time. This is the only proof the conversation existed before withdrawal. If the screenshot fails, stop and ask the user to open the Browser panel.

## Step 2 — Withdraw the buyer, then screenshot

0. STOP — confirmation gate. Report that the conversation(s) are ready and ask the user to confirm BOTH: (a) they have finished any screenshots/captures they need, and (b) they explicitly instruct you to withdraw now. Wait for their reply. Do NOT proceed on your own judgment that "the mandatory screenshot is done".
1. Open `https://member-web-dev.gmarket.co.kr/member/withdraw` → it redirects to `/member/withdraw-new`.
2. Read the identity with the BARE identifier `withdrawForm.custNo` (never `window.withdrawForm` — it is shadowed by a DOM collection) and compare with the designated buyer's custNo. Abort on mismatch.
3. Read `withdrawForm.onGoingTransaction`. If `true`, the server will reject (`returnCode:-2`, `진행중인 주문이 남아있어요`); capture the exact message and report instead of retrying.
4. Fire the real submit — the page global `withdrawCustomer()` (defined in `/js/withdraw/withdrawCustomer-*.js`): POST `/member/deleteAccount`, empty body, CSRF from `meta[name=_csrf_header]`/`meta[name=_csrf]`. Do NOT click the UI `회원 탈퇴` button — it never submits (known `setModalTarget()` frontend bug). To capture failures, wrap `showErrorModal` before calling:
   ```js
   window.__wdErr = null;
   if (typeof showErrorModal === 'function') {
     const orig = showErrorModal;
     window.showErrorModal = function (m) { window.__wdErr = m; return orig.apply(this, arguments); };
   }
   withdrawCustomer();
   ```
   Success = the page navigates; the evaluate call may error with `Inspected target navigated or closed` — that IS the success signal, not a failure.
5. **Screenshot B — MANDATORY (after withdrawal).** Capture `/member/withdrawComplete` (`계정삭제가 완료되었습니다`). If the withdrawal was blocked, capture the modal message instead and report it.

## Step 3 — Verify the seller side no longer sees the conversation

1. Open `https://chat-dev.esmplus.com/` (shares the ESM+ session; no second login). Switch to the seller that had the conversation via `.im-seller-account-trigger` → `.im-seller-account-item` (native `el.click()` inside `evaluate_script`).
2. Check ALL three filter tabs — `전체`, `직접상담`, `스마트챗 Beta` (click `span.im-seller-filter-tab-label`'s `.closest('.im-seller-filter-tab')`; the 스마트챗 label is not a leaf node). The withdrawn buyer's conversation MUST be absent from every tab.
3. Sanity-contrast, to avoid false positives: the seller's other/older sessions still render; other accounts still show active buyers' conversations.
4. **Screenshot C — recommended.** Seller-side list showing the absence (e.g. only old sessions left).
5. Do NOT use the seller search box as evidence: in dev, buyer-ID search returns nothing even for active buyers (verified with a control test) — only the session list counts.

## Step 4 — Report

Bundle: Screenshots A/B/C, buyer custNo, seller ID, conversation time from Screenshot A, and the conclusion ("GEMINI-3825 rule 2 holds in the buyer-deactivation direction"). State limitations: rule 1 backend-only; seller-direction untestable; post to Jira only after user approval.

## Known pitfalls

- Buyer signup auto-submit can land on a browser error page while the account IS still created — verify with the `checkIDValidation` oracle (`true` = created, use controls), then log in via signinssl-dev (`login.checkValid()` + `form.submit()`; skip the passkey notice with `다음에 하기`).
- Bare `withdrawForm` identifier; `window.withdrawForm` reads the wrong object.
- `Inspected target navigated or closed` right after `withdrawCustomer()` = success redirect.
- The deactivated account can no longer log in (generic error) — expected, do not re-verify.
- Buyer (gmarket domains) and seller (esmplus.com) sessions coexist in one browser profile — do not log the other side out.
- Old ended conversations remain visible after a buyer withdraws; only the deactivated counterpart's conversation disappears — compare against the right session.

## Environment

| Purpose | URL |
|---|---|
| Buyer login (dev) | `https://signinssl-dev.gmarket.co.kr/login/login` |
| Buyer chat (dev) | `https://www-dev.gmarket.co.kr/n/chat` |
| Withdraw wizard | `https://member-web-dev.gmarket.co.kr/member/withdraw` → `/member/withdraw-new` → `/member/withdrawComplete` |
| Seller chat center (dev) | `https://chat-dev.esmplus.com/` |
