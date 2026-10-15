---
name: login-esmplus
description: Log into ESM Plus (dev/prod/STG) as Master, Manager, or Gmarket/Auction Seller ID, and verify the true session type. Use for ESM+ 登录、代登录卖家后台、STG 测试准备（改域法）、登录报错判读（FAIL_* / FDS / 2FA）、연락처 인증弹窗处理、多账号会话判断与清理。
---

# Login to ESM Plus

## Scope

Establish a working session on the ESM Plus seller console (dev / prod / STG) before any seller-side operation (后台, 聊天中心, 账号管理).

## Speed: fast path (use by default)

1. **Start from the target page, not Home** — navigate straight to the page the task needs (e.g. chat-basic-info). If it loads, the session is alive; skip login entirely. Only a bounce to signin means you must log in.
2. Log in with ONE batched call: copy `scripts/fast-login.js` into `evaluate_script` (edit CONFIG: loginId / password / tab). It does tab switch → fill → submit → JWT-bridge settle → 연락처 popup auto-skip, using condition-polling instead of fixed sleeps.
   - Fallback (2026-10-12): if the batched async script is blocked with `EvalError: Possible side-effect in debug-evaluate`, split into separate **synchronous** evals — (a) click the tab, (b) fill fields + click `로그인`, (c) poll page state with one read-only eval per call (skip popup / handle 2FA when seen). For `loginResult` capture, inject fetch/XHR hooks via `navigate_page`'s `initScript` (store in `window.__cap`) — page-initiated requests are captured normally.
3. After it returns, navigate STRAIGHT to the target page — never detour to verify Home (it may render blank and is irrelevant to the task).
4. Batch all changes for the same environment into one request so a single login covers everything.

## Safety

- Never persist passwords, verification codes, tokens, or cookies.
- Prod identity verification / forced password resets must be completed through the official flows — never bypass. In dev only, a test code explicitly returned by an authorized API response may be used.
- After pressing login, do not interrupt the JWT bridge navigation.

## Environments & entries

| Env | Login | Home |
|---|---|---|
| dev (日常) | `https://signin-dev.esmplus.com/login` | `https://www-dev.esmplus.com/Home/v2` |
| prod | `https://signin.esmplus.com/login` | `https://www.esmplus.com/Home/v2` |
| STG | login via prod, then swap domain | `https://av.esmplus.com/Home/v2` |

Three login tabs: 1 `ESM PLUS` (Master/Manager ID), 2 `지마켓` (Gmarket Seller ID), 3 `옥션` (Auction Seller ID). **Daily dev login uses tab 2 (지마켓)** for Gmarket seller IDs; Manager IDs use tab 1. Wrong tab typically yields `FAIL_NOT_REGISTERED`.

## Login steps

1. Open the login page; click the tab matching the credential type.
2. Fill `#typeMemberInputId01` / `#typeMemberInputPassword01` (native setter + `input`/`change` events, or browser-use `fill`); overwrite any prefilled saved ID.
3. Click the blue `로그인` button via `el.click()`.
4. If the 「고객 응대 연락처 인증 및 변경」 notice appears, click `ESM+ 바로가기` to skip (unless the task is contact verification itself).
5. Let the JWT bridge finish: `/api/login` → token/cookie → finalize → `…/Member/Authenticate/JwtAuthService?NextUrl=/Home/v2`.
6. Verify on Home: header shows `마스터<id>(<sellerId>)`.

## Failure codes & capture

Hook `fetch` on the signin page (it uses fetch, not XHR) and read `/api/login` response `data.loginResult`:

- `FAIL_NOT_REGISTERED` — account not registered in this tab/system (e.g. seller ID used on the ESM PLUS tab).
- `FAIL_GMKT_LOGIN` — Gmarket-side login failed (wrong combination / dirty session state).
- `FDS_AUTH_PW_CHG_REQ_GMKT` — password correct but forced reset required (`nextUrl=/password-change`).
- Success `data.info` carries masterLoginId/masterId/loginId/sellerCustNo — use it to confirm account ownership.

The UI itself often shows no error (toast disappears) — always judge from the API response or subsequent page state.

## 2FA / FDS (dev)

- Manager logins may trigger `2단계 인증` (phone input `#authenticationNumber01` → `/api/verification/verify/token/<seq>` → `certYn:"Y"`). In dev, the `PhoneOwner` response contains the test `certNo` (6 digits) — read it from the response instead of waiting for SMS.
- 2FA / FDS requirements are non-deterministic — retry once before treating as a hard gate.

## Verify the real session type

Page header `마스터` label is NOT proof. After login, read Home's own XHR: `GetMenuAuthByLoginId?masterId=…&loginId=…` (real login ID) and `GetHomeMainGoodsCount?loginType=MASTER|…&sellerId=…`. All values consistent and `loginType=MASTER` = a real Master session.

## Multi-account pitfalls

- ESM+ supports multiple simultaneous sessions (`/Home/MultiLoginUsers`); "아이디 저장" can prefill an old ID. Log out completely (`로그아웃`) before judging the active account.
- After a forced-reset-blocked login, the form may jump back to the ESM PLUS tab and clear the password — that's a re-render, not evidence of a wrong-tab login.

## STG

- Log in at prod (`signin.esmplus.com`) and then simply change the domain to `av.esmplus.com` — the prod session carries over, no second login. Buyers: log in at `www.gmarket.co.kr`, then swap to `www-stg.gmarket.co.kr`.
- Direct `signin-av.esmplus.com` login exists but its JWT bridge bounces to LogOff (broken since 2026-09) — prefer prod-login + domain swap.

## Browser panel closed

All steps work via `evaluate_script` + `el.click()`; `fill` and `press_key` also work. Pointer tools (click/hover/screenshot) require the Browser panel to be open.

## Second simultaneous session: external test Chrome (CDP)

The embedded browser holds ONE ESM+ login (single page). For a second account in parallel — **or as the recovery path when the embedded browser's CDP connection dies** (e.g. a native-dialog popup killed it: shop-name 변경이력보기, 2026-10-15) — launch an external test Chrome with a fresh profile + `--remote-debugging-port=9377` and drive it over CDP with PowerShell `ClientWebSocket` (no node/python on the box). Reusable pieces in `scripts/cdp/`: `cdp-run.ps1` (actions `-Navigate / -EvalFile / -EvalStr / -AddInitFile / -Screenshot`; password passed via env var `ESMP_PW` replaced into the `__PW__` placeholder — never persisted) + `hook.js` / `status.js` / `fill-example.js` / `login-master.js` (ready-made ESM PLUS-tab master login: fills view `#typeMemberInputId01/#typeMemberInputPassword01` + clicks the blue 로그인). STG work flows through this path too: log in at prod inside the test Chrome, swap the domain to `av.`/`www-stg.`. Verify the result by reading the Home header. Full recipe + pitfalls: memory `test-chrome-cdp`.
