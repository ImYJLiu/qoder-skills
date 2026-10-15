---
name: esmplus-add-seller-id
description: Add a Gmarket or Auction Seller ID under an existing ESM Plus account, validate the application, verify creation, and guide first login, identity verification, Master linking, and required password reset. Use for ESM Plus seller registration, 판매아이디 추가 신청, G마켓 아이디 추가 신청, 옥션 아이디 추가 신청, or first-login linkage in the dev environment.
---

# ESM Plus Add Seller ID

## Scope

Create an additional Gmarket or Auction Seller ID under an existing ESM Plus account and verify its lifecycle through first login.

Use `https://www-dev.esmplus.com/Home/v2` unless the user explicitly authorizes another environment.

## Safety

- Confirm the user is authorized to manage the account.
- Never persist passwords, verification codes, tokens, cookies, or personal data in files or memory.
- Confirm immediately before submitting a new Seller ID if the user has not already explicitly requested creation.
- Do not submit a duplicate account during a walkthrough; stop before `신청하기`.
- Ask the user to open Qoder's Browser panel before a visual walkthrough.

## Open the application

1. Open the ESM Plus login page.
2. Choose the login tab that matches the supplied credential:
   - `ESM PLUS`: Master or Manager credentials.
   - `지마켓`: Gmarket Seller ID credentials.
   - `옥션`: Auction Seller ID credentials.
3. After login, dismiss optional contact-verification notices with `ESM+ 바로가기` when the task does not require updating contact verification.
4. Open `판매자정보` → `판매아이디 추가 신청`.
5. If the embedded content is not visible to automation, open the iframe source directly: `https://seller-dev.esmplus.com/member/request-sale-id`.

## Create a Seller ID

1. Select `G마켓 아이디 추가 신청` or `옥션 아이디 추가 신청` according to the requested marketplace.
2. Check the current/maximum account count before proceeding.
3. Fill the required fields:
   - Seller ID: 6–10 ASCII letters or digits, no spaces.
   - Password: 8–15 characters containing uppercase, lowercase, number, and special character.
   - Password confirmation.
   - Email address.
   - Customer-service phone: digits only, maximum 11 digits; remove an international country prefix when the form expects a Korean-style local number.
   - Mini Shop name: 3–10 Korean characters or 6–20 ASCII letters/digits, no spaces.
   - Mini Shop URL suffix: 6–20 ASCII letters/digits.
   - Mini Shop description: 5–90 characters.
4. Trigger blur on duplicate-checked fields and wait for validation responses before submission.
5. Leave optional marketing agreements unchecked unless the user requests them.
6. Select every required agreement.
7. Review the visible values, then click `신청하기` and accept the confirmation.

## Verify creation

- Require a success message and HTTP 200 response from `postPluralIdRequest`.
- Reload the page and verify the current account count increased.
- Optionally verify the new ID appears under `판매자정보` → `아이디 관리`.
- Report that sales approval normally takes 3–5 business days.

## First login and Master linkage

1. Log out and select the marketplace tab matching the new Seller ID, not the `ESM PLUS` tab.
2. Enter the new Seller ID and its password.
3. If shown as an unlinked ID, continue to `마스터 아이디 연결`.
4. Use the exact registered personal or business name and the registered phone/email.
5. In dev only, if mail delivery is unavailable and the authorized API response explicitly includes a test verification code, use that returned code. Never bypass verification or extract codes in production.
6. Accept required linkage terms and link the displayed Master ID.
7. Verify the completion message names the expected Master.
8. If Gmarket forces a password reset, complete it through the official reset page. Do not bypass this requirement. If the reset host is unreachable, report the network failure and leave the account linked but not independently login-ready.

## Important distinctions

- A Seller ID is a marketplace identity for Gmarket or Auction operations.
- A Manager ID is an invited ESM Plus operator with delegated permissions.
- A page header showing `마스터` does not prove a true Master session. When authorization level matters, check `/api/member/memberInfo/member`; `esmLoginType` must be `MASTER`, not `SITE`.
