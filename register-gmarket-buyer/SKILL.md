---
name: register-gmarket-buyer
description: Register a Gmarket test buyer account (dev gembuyN / prod-STG NNlunaliu) in dev or prod, then log in/out. Use when asked to 注册买家测试号、造买家账号、gembuyNN、lunaliuN、03lunaliu、register a dev/prod buyer for chat or 3825 testing. Covers entry URLs, 간편 가입 form filling, the jQuery validator workaround, submit signals, login form quirks, and the ID-availability oracle.
---

# Register Gmarket Buyer (gembuyN / lunaliuN)

## Scope

Create a fresh Gmarket buyer account (`gembuyN`) in the **dev** or **prod** environment with the team's established test identity, and get it logged in.

## Safety

- **Prod registrations are real production data** — use minimal-impact settings (below) and an increasing serial; check availability first.
- Withdrawal consumes an account (new ID needed for 7/30 days) — the withdraw flow has a hard confirmation gate (see `esmplus-buyer-withdraw-chat-verify`).
- Never persist the password (team's established test password).

## Identity convention

- 이름 `루나` | mobile `010-9999-00NN` (NN = serial) | ID 6–10 chars English/numbers — letters-only also passes (`checkIsAlphabetNumericValidation` only rejects non-alphanumerics; the "mixed letters+digits" copy is misleading).
- Naming per env: **dev = `gembuyN`** (email `gembuyNN@gmail.com`); **prod/STG = serial-prefix `NNlunaliu`** (2-digit serial + lunaliu, e.g. `03lunaliu`; email `NNlunaliu@gmail.com`) — user revised from the suffix style on 2026-10-12; `lunaliu` itself is taken in prod.
- Serial tracking: dev 39–43 active (39=500000140, 41=500001532, 42=500001535, 43=500001546), 44–46 withdrawn; prod gembuy47 **withdrawn** same day (162342932). 2026-10-12 prefix series: **03lunaliu=162347135 (010-9999-0050), 04lunaliu=162347139 (010-9999-0051)**; legacy suffix pair lunaliu1=162342958 / lunaliu2=162342964 — retirement pending user confirmation. (prod custNo is a 9-digit range — dev numbers don't exist there.)

## Preconditions

- Log out any current buyer session first (a lingering session bounces `/signup` to the home page).
- Availability check: from a same-origin signup-web page (logged out), `POST /api/checkIDValidation` body `{loginId}` → `{Data:true|false}` (true = taken). Works on prod too.

## Steps (same flow for dev & prod)

1. Entry — dev `https://signup-web-dev.gmarket.co.kr/signup/buyer`, prod `https://signup-web.gmarket.co.kr/signup/buyer` (classic sslmember2/mobile redirect chain is broken).
2. `개인 구매회원` → `간편 가입하고 쇼핑하기` — the SPA ignores native tool clicks; use `el.click()` inside `evaluate_script`.
3. Terms page: dev — click `#terms-all` (real 전체동의; `#form__checkbox-all` does NOT cascade). **Prod — do NOT 전체동의**: check only the 6 required IDs (`G_BUYER_USE`, `G_SMILEPAY_USE`, `G_SMILEPAY_FINANCE`, `G_PRIVACY_SUMMARY`, `G_SMILEPAY_PROVIDE`, `G_14AGE`), skip 신세계 유니버스 클럽 (universeJoinYn=N); after `다음 단계로`, decline the marketing dialog (`괜찮아요` → receiveEmailSmsAppPush=false).
4. Fill `input-id`, `input-password`, `input-password2`, `input-name`, `input-phone-number`, `input-email` — assign `.value` + dispatch `input`/`keyup`/`change`/`blur`.
5. CDP fills don't fire the jQuery validators — call them on `buyerSignupValidation` with DOM element objects (NOT selector strings): `getIdValidateType(elId)` → `checkMobileNoValidation(elPhone)` → `validatePasswordType(elPwd)` → `validateRePassword(elPwd2)` → `checkNameValidation(elName, false)` → `getEmailValidateType(elEmail)` (id/email async; the phone callback chains into pwd). Poll the six flags: idValidation, pwdValidation, rePwdValidation, nameValidation, mobileNoValidation, emailValidation.
6. All six true → submit (click the `완료` button if it doesn't auto-submit within a few seconds): `POST /signup/privateBuyerProc` → auto-login → `/signup/privateBuyerCompleted` (header `루나님`). No SMS/identity verification in either env.
7. Quirks: `Inspected target navigated or closed` right after submit = success redirect. If it lands on a browser error page but the account exists (oracle says true), just log in manually.

## Login / logout

- Login pages — dev `https://signinssl-dev.gmarket.co.kr/login/login?url=…`, prod `https://signinssl.gmarket.co.kr/login/login?url=…`.
- The form `onsubmit` is broken — run `login.checkValid()` then `document.getElementById('loginForm').submit()`. Prod UI (2026-10-12): visible fields `#typeMemberInputId` / `#typeMemberInputPassword` (`bindValue()` copies into hidden `#loginId`/`#password`); on success `checkValid()` returns undefined but sets `action=/login/loginProc` — submit when the action is set.
- Dismiss the passkey notice with `다음에 하기` if it appears. Prod may skip it. Logout = `https://signinssl.gmarket.co.kr/logout/logoutproc` — must be the signinssl host (`www.gmarket.co.kr/logout/logoutproc` is a no-op).
- Read custNo (both envs): open `member-web[-dev].gmarket.co.kr/member/withdraw` (→ `/member/withdraw-new`) and regex the page-scoped `let withdrawForm = {"custNo":"…","custNm":"…",…}` from the DOM (`window.withdrawForm` is shadowed by the form element).

## Report

New account ID + custNo + env; prod: confirm completion URL shows `signupType=PP&receiveEmailSmsAppPush=false&universeJoinYn=N`.

## Related

- Shopping flows with a registered buyer (wishlist / cart / order): `gmarket-buyer-shopping-ops`.
- Withdrawal + chat-hide verification: `esmplus-buyer-withdraw-chat-verify`.
