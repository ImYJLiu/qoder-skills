---
name: esmplus-invite-manager
description: Invite and configure an ESM Plus Manager account from a verified Master session, including Master identity verification, role and restriction selection, invitation delivery, and pending-status checks. Use for 매니저 관리, Manager invitation, delegated ESM Plus access, permission updates, or troubleshooting dev invitation email delivery.
---

# ESM Plus Invite Manager

## Scope

Invite a Manager under an existing ESM Plus Master and verify that the invitation is pending or accepted.

Use `https://www-dev.esmplus.com/Home/v2` unless the user explicitly authorizes another environment.

## Safety

- Confirm the user is authorized to administer the Master account.
- Never persist passwords, verification codes, tokens, cookies, or personal data in files or memory.
- Confirm the intended Manager ID, contact, and permissions before sending an invitation.
- Do not delete Managers or broaden permissions without explicit approval.
- Ask the user to open Qoder's Browser panel before a visual walkthrough.

## Establish a real Master session

1. On the login page, select the `ESM PLUS` tab.
2. Enter the Master ID and its ESM Plus password.
3. Do not use the `지마켓` tab for this workflow. A linked Gmarket Seller login can display a Master label while still producing `esmLoginType: SITE`.
4. If needed, verify the session through `https://seller-dev.esmplus.com/api/member/memberInfo/member` and require `esmLoginType: MASTER`.
5. If a customer-contact verification notice appears, use `ESM+ 바로가기` unless the user asked to update the contact.

## Open Manager management

1. Open `판매자정보` → `매니저 관리`.
2. If the embedded content is not visible to automation, open `https://seller-dev.esmplus.com/member/manage-manager` directly.
3. Review active and pending Managers before creating another invitation.

## Complete Master identity verification

1. Click `매니저 초대하기`.
2. If prompted, acknowledge that identity verification is required.
3. Select a linked Gmarket or Auction Seller ID and continue.
4. Choose phone or email verification.
5. Enter the exact registered personal/business name and matching contact value.
6. Request the verification code and submit it before expiry.
7. In dev only, when delivery is unavailable and the authorized API response explicitly returns a test code, use that code. Never bypass verification or extract codes in production.
8. Confirm that verification succeeds and the Manager invitation form opens.

## Prepare and send an invitation

1. Enter a unique Manager ID using 6–10 lowercase letters or digits.
2. Select menu permissions and product-management restrictions.
   - For “minimum permissions,” grant only the specific module needed for the stated job.
   - Do not interpret “minimum” as zero permissions unless the user explicitly wants a login with no usable menu access.
3. Select invitation contact type: email or Korean-format mobile number.
4. Enter the contact and click `매니저 추가하기` to stage it.
5. Verify the staged Manager ID, contact, permission count, and restriction count.
6. Obtain or rely on the user's prior explicit approval, then click the final `확인` to send.

## Verify the result

- Require HTTP 200 and an `OK` response from `postInviteManager`.
- Verify the Manager appears under `초대중인 매니저` with status `초대중`.
- Report the exact expiration time shown by the UI. Invitation links expire after 24 hours; expired pending IDs are deleted after 5 days.
- The recipient must open the link, complete identity verification, and set login details before the account becomes active.

## Troubleshoot delivery

- Confirm the stored masked contact corresponds to the requested address.
- Use `재발송` only when the user asks or reports non-delivery.
- Distinguish API acceptance from actual delivery: an `OK` response and `초대중` status prove creation, not mailbox delivery.
- The dev API may suppress external email and may not expose the invitation URL. If resending still does not deliver, request a dev-supported mailbox or have an authorized environment administrator retrieve the message from the mail queue.
