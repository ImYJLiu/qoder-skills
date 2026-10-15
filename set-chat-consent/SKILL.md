---
name: set-chat-consent
description: Set or check the ESM+ chat-service consent (채팅 서비스 이용 동의 / isConsented) per seller ID in dev (and prod/STG). Use when asked to 改 isConsented、设置聊天同意、开通/取消聊天服务同意, or fix 「채팅 서비스 이용 동의가 필요합니다」 popups / blocked 직접 상담하기. Covers the 기본 정보 관리 page operation, batch rules, verification, and known per-account states.
---

# Set Chat Service Consent (동의)

## Scope

Change the per-seller-ID chat consent flag that gates `직접 상담하기` (direct consultation). 「동의함」 enables direct replies; 「동의안함」 restores the informational popup behaviors.

## Speed: fast path (use by default)

On the basic-information page, copy `scripts/apply-consent.js` into `evaluate_script` (edit CONFIG: sellerId / agree) — it locates the row, checks it, sets the radio, saves and confirms the dialog in ONE call. Then reload once and re-read the state column to verify. The manual steps below are the fallback/reference path.

## Why it matters

- The chat center shows 「채팅 서비스 이용 동의가 필요합니다」 when the master has NO consented seller ID; the popup is informational (session list still loads after 확인).
- Trying to switch a room to direct consultation without consent only pops the consent guide — `mtop.gmkt.im.seller.mode.switch` is not even called.
- Oracles: `GET chat-dev.esmplus.com/api/chat-permission` → `{hasPermission}`; `mtop.gmkt.im.seller.accountrel.get` lists `sellerList[].isConsented` per ID.

## Operation (dev)

1. Log into dev as the owning Master (see `login-esmplus`; gemsell17 family = 지마켓 tab).
2. Open `https://www-dev.esmplus.com/Home/v2/chat-basic-info`, or straight to the iframe page `https://seller-dev.esmplus.com/chat/basic-information` (기본 정보 관리).
3. The table lists each seller ID + consent state (footer `총 N개의 아이디`).
4. Check ONLY the target row's checkbox (`#checkbox-0..N` in row order; header `checkboxIdAll` stays unchecked).
5. Select radio `#serviceAgree` = 동의함 (or `#serviceDisagree` = 동의안함).
6. Click the blue `저장` → confirm `…아이디가 채팅 서비스 이용 동의 상태로 변경되었습니다.` → `확인`.
7. Verify: reload and re-read the state column.

Rules: 「동의함」 applies in batch to all selected IDs; 「동의안함」 must be set individually per ID. Takes effect immediately, no logout needed.

## Prod / STG variant

- prod shell: `https://www.esmplus.com/Home/v2/chat-basic-info`
- STG: same path on `av.esmplus.com` (or `www-av.esmplus.com`), or go straight to the iframe page `https://seller-av.esmplus.com/chat/basic-information`. Log in at prod first (e.g. gemsell17 via 지마켓 tab — enters the geminiaidc master session), then swap the domain; no second login.

## Known states (2026-10-15)

- dev gemsell17 family: 17 / 17b / 17c / luna = 동의함; **17a = 동의안함** (only one left).
- prod/STG geminiaidc family: geminiaidc / gemsell01 / gemsell11 = 동의함; **gemsell02 = 동의안함** (2026-10-10: agreed in the morning, released again per user request — release verified on reload); gemsell03–08 = 동의안함 (page-1 view; the family has 16 IDs).
- **2026-10-15 STG notice**: a batch switch of the released IDs back to 동의함 only applied to **gemsell01** — every other account was refused because it is still inside the post-release 7-day lock (「동의 해제 후 7일이 지나지 않아 변경되지 않았습니다」, this time a REAL refusal). Check the release date before promising a change.

## Pitfalls

- Releasing (동의안함) is a TWO-dialog flow: a warning confirm first (「동의안함으로 변경 시 구매자와 1:1 채팅 상담이 불가능…미노출」，취소/확인), then a result dialog 「모든 아이디가 동의 해제 후 7일이 지나지 않아 변경되지 않았습니다」. **That result text is misleading — on 2026-10-10 the release HAD applied (verified by reload).** Never judge by the dialog wording and never retry: reload and re-read the state column.
- **The post-release 7-day lock is real and blocks both directions (confirmed 2026-10-15)**: switching a released ID BACK to 동의함 inside 7 days is refused with the same text — and that time it genuinely did not change. So: re-agreeing a released ID must wait until the 7-day window passes; always reload and re-read the state column to judge, in both directions.

- The page also has 프로필 / 상담시간 sections with their own checkboxes and 저장 buttons — only touch the consent section.
- After agreeing, `직접 상담하기` writes 「판매자와 대화가 시작되었습니다」 and the reply editor appears; flows detailed in `inspect-esmplus-chat`.
