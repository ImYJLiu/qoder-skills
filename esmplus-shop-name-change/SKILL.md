---
name: esmplus-shop-name-change
description: Change a seller's Shop 이름 (shop display name / minishopName — the seller name buyers see) on ESM Plus dev or STG/prod, and check its propagation. Use for 改卖家名字、改 Shop 名/seller 显示名、shop-basic 页操作、改名生效范围与变更历史查询. Covers dev/STG entries, 중복체크→저장 order, the once-per-month limit, the change-history popup that kills the embedded browser, and the fact that chat does NOT follow the rename.
---

# ESM+ Shop Name Change (Shop 이름)

## Scope

Change the Shop 이름 (국문 / 영문 / 중문) of one seller ID — this is the name on the mini shop and the name buyers are supposed to see in chat. One ID at a time; the page also edits Shop 주소/소개 but those are out of scope.

## Entries

- dev: `https://www-dev.esmplus.com/Home/v2/shop-basic` → iframe `https://shop-dev.esmplus.com/info/basicInfo` (menu 미니샵/스토어 관리 → 정보관리 → 기본정보 관리).
- STG/prod: `https://av.esmplus.com/Home/v2/shop-basic` (prod: `www.esmplus.com`) → iframe `https://shop.esmplus.com/info/basicInfo`. STG shares the prod login session — log in at prod, swap the domain (see `login-esmplus`).
- Direct content URL (skips the shell): `https://shop.esmplus.com/Info/BasicInfo/Index?sellerId=<base64(sellerId)>&siteId=2&custNo=<base64(custNo)>` — **both params are base64** (`gemsell01` → `Z2Vtc2VsbDAx`, `161248487` → `MTYxMjQ4NDg3`); siteId 2 = G마켓.

## Steps

1. Pick the seller ID in the 판매아이디 dropdown (`#selSellerIdList`; option value form `2|gemsell01|161248487`).
2. Write the new name into `#txtShopName` (국문) / `#txtShopNameEN` / `#txtShopNameCN`.
3. Click 중복체크 (`#btnNmCheck`) FIRST — expect 「사용가능한 이름입니다.」 (available). Saving without the dup check fails.
4. Click 저장 (`#btnShopInfoModify`) → page navigates/refreshes = applied.
5. Verify: the form shows the new name after reload; `https://minishop.gmarket.co.kr/<shopId>` updates title + header immediately.

## Rules & pitfalls

- **Shop 이름/주소 can only be changed once per month.** Check the history before planning a change — but never via the page button (next bullet).
- **Do NOT click 변경이력보기 (`#btnNmHistory`)**: its popup killed the embedded browser's CDP connection (all operations `isDestroyed`, unrecoverable in-session; 2026-10-15). If history is really needed, navigate directly to `https://shop.esmplus.com/Info/Popup/ShopNameHistory?Site=<siteId>&CustNo=<custNo>&LangType=` in a controlled way and monkey-patch `window.alert/confirm` to collect native dialogs non-blockingly.
- **Chat does NOT follow the rename (2026-10-10/13)**: after 젬셀17A → 젬셀17A변경, buyer chat session list + room header still showed the OLD name (suspected server cache; the gemsell17b control row showed its current name). No Jira exists for this — searched the whole tracker twice; closest: GEMINI-1905 (ad group rename, Done), 3462 (cache/CDC, Won't fix), 2981/3006/3075/2954/3847 (display issues).
- The chat display name auto-follows the seller nickname — there is NO chat-side edit entry (chat-basic-info states 프로필명은 판매자 닉네임 자동 노출).
- Do not confuse with other names: 사업자 상호/법인명 is review-gated (사업자정보 변경 신청); 회원 이름 is not editable at all.

## Scripts (ideal for external test Chrome via CDP)

`scripts/check-name.js` (fill name + 중복체크, dialog-collecting) and `scripts/save-name.js` (click 저장, dialog-collecting). Run through `login-esmplus`'s `scripts/cdp/cdp-run.ps1 -EvalFile <file>`; edit the `NAME` constant first. Edit values inside these scripts before use — do not blind-run.
Fallback when the embedded browser is stuck/closed: use the external test Chrome CDP path (see `login-esmplus` "Second simultaneous session") — verified for exactly this flow on 2026-10-15 (STG gemsell01 → gemsell01변경 via prod login + domain swap).
