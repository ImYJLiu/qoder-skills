---
name: gmarket-buyer-shopping-ops
description: Drive Gmarket buyer shopping flows on test accounts (STG pages) — batch-add items to the 찜/wishlist via AddFavoriteItem, verify wishlist rendering (sold-out items hide but stay saved), add items to the cart, and complete an unpaid order end-to-end (배송지 추가, 무통장 입금 + bank selection, 결제하기 submit, order-history verification). Use for 加心愿单/찜、心愿清单核对、批量加收藏、加购物车/下单测试/走完整下单流程、lunaliu 买家购物操作、cart-av / checkout-av / order 排查.
---

# Gmarket Buyer Shopping Ops (wishlist / cart / order)

## Scope & safety

Shopping operations with a shared test buyer (`lunaliu*` / `gembuyN`) on STG pages. 「下单不支付」 is the normal test ask ("不支付没关系，先保障能够正常下单") — the deliverable is a submitted order in **입금대기 (awaiting deposit)** state via 무통장 입금 (no money moves; auto-cancels if not deposited by deadline). **Get the user's explicit go before clicking the final 결제하기** (submission-class step), then report the order numbers. Reuse an existing buyer session; if login is needed, `login-stg` direct login works for these accounts (prod `www.gmarket.co.kr` is Cloudflare-blocked).

## URLs

- PDP: `https://item-stg.gmarket.co.kr/Item?goodscode=<n>` (`goodscode` numeric; PDPs from the seller console are `item-av.esmplus.com/goods/list`).
- Wishlist: `https://diary2.gmarket.co.kr/Favorite/MyFavoriteItems` → lands on `/Favorite/MyFavoriteItems3?page=1&order=OrderBySaveDate&itemType=All`.
- Cart: `https://cart-av.gmarket.co.kr/ko/cart` (SPA → `/ko/pc/cart/`; count = 「장바구니 갯수 N개」 text).
- Checkout: clicking 구매하기 navigates to `https://checkout-av.gmarket.co.kr/ko/pc/checkout?chid=<cart-item-ids>&...` (chid = comma list of the selected cart item ids).
- Order history: `https://my-av.gmarket.co.kr/ko/pc/list/all`.
- Session oracle: `https://my-av.gmarket.co.kr/ko/pc/main` (header 로그인/로그아웃).

### Dev environment (gembuyN accounts)

`gembuyN` buyers live in **dev**, not STG (custNos 5xxxxx, e.g. gembuy36=500000137, header 닉네임 알인증36). Same flows, different domains (verified end-to-end 2026-10-19):

- PDP `https://item-dev.gmarket.co.kr/Item?goodsCode=<n>`; Cart `https://cart-dev.gmarket.co.kr/ko/cart` (count 「상품수 N개」); Wishlist `https://diary2-dev.gmarket.co.kr/Favorite/MyFavoriteItems`; login `https://login-dev.gmarket.co.kr/login/login?type=MEMBER&url=…` (fill `#typeMemberInputId`/`#typeMemberInputPassword`, `login.checkValid()`, set `#loginForm` action to `/login/loginProc`, submit; a `login/password-notice` page may follow — just navigate to the target).
- `AddFavoriteItem` and the `button.btn_mycart` cart flow work identically on `item-dev`. No checkout walkthrough verified on dev yet.
- Seller-ID search does NOT work on dev (`/n/search?keyword=gemsell17` = 0 results; `/minishop/<sellerId>` is a dead route). Get goodscodes from prior chat `itemId`s or PDP HTML (`"SellerId"`/`"SellerCustNo"`), or ask the user.
- gemsell17 (dev custNo 500000149) test items: `8003641205`–`8003641209` = Test Product 1–5, `8000120424` (Motorheadphones Trigger, 31,000원), `8000051605`. Note `8003641212` (Test Product 8) belongs to gemselluna.

## Wishlist (찜 / 心愿单)

1. Batch add from any `item-stg` PDP (same-origin, no CSRF/signature needed):
   ```js
   fetch('/Item/AddFavoriteItem', {
     method: 'POST',
     headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8', 'X-Requested-With': 'XMLHttpRequest' },
     body: 'goodsCode=<n>'
   })
   ```
   Success = `{"ResultCode":0,"Message":"정상등록 되었습니다."}`. Verified 9/9 on 2026-10-10 (lunaliu1) and 2026-10-15 (lunaliu031).
2. Verify on the wishlist page by scanning the HTML for goodscode. **SOLD OUT (품절) items register but do NOT render in the list** (footnote 「상품 상태에 따라 노출되지 않을 수 있습니다」, no pagination — don't hunt for missing pages). For those, verify via the PDP: `button.add-interest` with `aria-pressed=true`.
3. The wishlist page has NO add-to-cart buttons — don't hunt for one; go to the PDP.
4. Identity caveat: the header nickname is masked (`lunal***님`) — same-prefix accounts (lunaliu1 / lunaliu031) are indistinguishable. Confirm the custNo via member-web `withdrawForm.custNo` (see `register-gmarket-buyer`; lunaliu031 = 162297097).

## Cart

- From the PDP click 장바구니: `el.click()` on visible `button.btn_mycart`. Success = layer 「장바구니에 상품을 담았습니다」; header badge / cart count +1. Verify by reading the cart page count.
- 품절 items show NO visible cart button (`no visible btn`) — not addable. 판매종료 rows may sit in the cart but render 「판매 종료되어 주문할 수 없습니다」 and are excluded from checkout totals.
- Old test items may already be in the cart — leave them; only 판매종료/품절 rows are inert. The totals (「상품수 N개」) count orderable items only.
- **Known broken PDP: 4873697817 (IZOD 치노 3rd).** Clicking its 장바구니 freezes the page main thread (5/5 repros on both `item-stg` and `item.` domains — CDP goes dead, recover via `Page.navigate`). Sibling items 4873701923 / 4873701452 work fine. Suspected blocked-external-dependency in its click path. Skip it (or try another day / other entry).
- Useful test goods: **gemsell17 MRT_챗봇_테스트상품 01 `4876842979` / 02 `4876844082` / 04 `4879726658` (15,000원, all in stock — gemsell17's full STG catalog, verified 2026-10-19 via ESM+ `POST item-av.esmplus.com/api/ea/goods/search` as master geminiaidc)**; gemsell01 `4855766038` (test, in stock); gemsell11 물티슈 4873693605 / 4873693149 (in stock) / 4823172209 (SOLD OUT); 4856553025 (SOLD OUT) / 4855820722 (test_option, has 색상 option — must select first). **gemsell05 IZOD 4873701923 / 4873701452 / 4873697817 are delisted as of 2026-10-19 (PDP returns empty title, no cart button).** gemsell17's seller login on STG is blocked by forced password reset (FDS_AUTH_PW_CHG_REQ_GMKT) — use master geminiaidc / Gmkt1004! on the ESM PLUS (first) tab instead.

## Order (checkout walkthrough — verified end-to-end 2026-10-15/16, lunaliu031, 6 items 175,610원, pno=5537654226)

1. Cart → click 구매하기 (`button` with exact text 구매하기) → lands on checkout-av `checkout` page (주문서). The sheet lists 주문상품 N 개.
2. **배송지 (address)** — if the account has none, click 배송지 추가. The modal is a cross-origin iframe (`mmyg.gmarket.co.kr/ShippingAddress/GetAddressDetail?...`) whose CDP contexts do NOT respond — do NOT fight the iframe. Instead navigate the TAB directly to the iframe's full URL (grab `document.querySelector('iframe[src*=ShippingAddress]').src` first). On that top-level page:
   - Fill `#reciverName` (name), `#hpNo` (phone); set hidden `#zipCode` and `#frontAddress`, reveal `#backAddress` (`style.display=''`) and fill it.
   - **우편번호 찾기 is dead in this environment** (its `address.gmarket.com/map` sub-app never binds; search fires zero network requests) — don't use it. Fill a real (zip, road-address) pair manually, e.g. zipCode=06236, frontAddress=서울특별시 강남구 테헤란로 152, backAddress=강남파이낸스센터.
   - Click 저장하기 → custom confirm layer 「배송지를 변경하시겠습니까?」 (click `.button__check` inside the VISIBLE `.box__layer-smile-alert`; note `#addressAlert` is a same-class hidden twin — don't click the wrong one) → redirects to `.../gateway/-/address-book/success` = saved. Back on the checkout URL the address auto-loads (account-level; lunaliu031 now holds 「루나 / 010-9999-0031 / 서울특별시 강남구 테헤란로 152 강남파이낸스센터」).
3. **Payment**: select 무통장 입금 radio `#pay_chk_DynamicVaccount`. An informational modal appears (「무통장입금은 주문마다 새로운 계좌번호가 생성됩니다…」) — **do NOT click its 확인 (it wedges the page main thread, same freeze family as the 7817 PDP)**. Synthetic `el.click()` ignores the overlay; just proceed.
4. **Must also select 입금은행** (deposit bank): `div.box__method-cash ul.pay_lst_chk li a` (first item = 농협). Skipping this makes the final submit fail with alert 「입금하실 은행을 선택해 주세요.」.
5. Check the required consent `#xo_id_agreements_providing_personal_info` (필수 개인정보 제3자 제공동의).
6. **Wait for the user's explicit go**, then click 결제하기 (`button`, exact text). Submit itself does NOT freeze. Success → `checkout-av.gmarket.co.kr/ko/pc/complete?pno=<통합결제번호>` (주문완료 page) showing the virtual account (농협 79033589425703 for pno 5537654226), deposit deadline, and auto-cancel warning.
7. Verify in MyG 주문내역 (`my-av.gmarket.co.kr/ko/pc/list/all`): the order splits **per seller into sub 주문번호** (e.g. 4504335026~030 for 3 sellers / 6 items), all in 입금대기 (awaiting deposit).

### 2026-10-19 regression: 무통장 now requires a VERIFIED refund account

The STG checkout (both `ko/pc/checkout` and `ko/m/checkout`) now blocks submit until a **환불계좌 (refund account)** is entered AND verified — this did not exist in the 10-15/16 order:

- Fields: `#xo_id_refund_account_bank` (select, e.g. 011=농협), `#xo_id_refund_account_number`, `#xo_id_refund_account_owner_name` (prefilled 루나; must equal the orderer name).
- Click **계좌확인** → `POST https://checkout-av.gmarket.co.kr/server/ko/pc/api/payment/verifyAccount` body `{"bankCode":"011","accountNo":"…","accountName":"루나"}` → response `data.isValidate` must be `true`. Dummy/format-only numbers return `{"resultCode":"0000",…,"isValidate":false,"message":"INVALID"}` and submission stays blocked.
- Submit-time validation alerts (in order): 「환불 진행 시 환불받을 은행을 선택해 주세요.」→「선택한 환불은행의 계좌번호를 입력해 주세요.」→「계좌인증 후 주문이 가능합니다. 계좌확인을 진행해 주세요.」→「계좌 정보를 다시 확인해주세요.」. **Without a real (team test) bank account that passes verification, the order cannot be submitted** — 03lunaliu blocked 2026-10-19, user chose not to order. Ask the user for a valid test account.

### Native alert()/confirm() wedges the CDP-driven renderer (root cause of the "freeze" family)

Many "main-thread freeze" symptoms here are actually **native JS dialogs**: while an `alert()`/`confirm()` is open, every `Runtime.evaluate` hangs (looks like a dead renderer) and `Page.handleJavaScriptDialog` may answer `No dialog is showing` (dialog in another frame). Reliable workaround: **override the dialog functions BEFORE clicking** and record the messages:

```js
window.__alerts=[]; window.alert=m=>{window.__alerts.push(String(m))};
window.confirm=m=>{window.__alerts.push(String(m)); return true};
```

Then `el.click()` proceeds, the page stays responsive, and `window.__alerts` reveals the real validation error. Verified on checkout 결제하기 (refund-account prompts) and cart 상품 삭제 (delete confirm) — with the override the cart delete works per line. If a tab is already wedged, `Page.navigate` still recovers it. Cart lines duplicated by repeated AddCartV2/click calls each get their own `qty-…` line; delete extras via 상품 삭제 with confirm overridden.

### Session expiry mid-checkout

If the checkout silently bounces to `signinssl.gmarket.co.kr/login/login?url=<checkout URL>`, re-login:
1. Navigate to `https://login-stg.gmarket.co.kr/login/login?type=MEMBER&url=<url-encoded checkout URL>`.
2. Fill `#typeMemberInputId` / `#typeMemberInputPassword` (the button `#btn_memberLogin` 「로그인(Stage)」 does NOT submit — click alone is a no-op).
3. In the SAME script (fields can reset between steps): call `login.checkValid()` (on pass it sets the form action to `/login/loginProc`) then `document.getElementById('loginForm').submit()`.
4. You land back on the checkout with the cart intact; redo radio/consent/bank (address persists).

## Tooling

Drive via the test Chrome CDP scripts in `login-esmplus/scripts/cdp/` (`cdp-run.ps1` one-shot eval/navigate/screenshot). After navigating, `sleep 7-10s` before reading (SPA tables render late; `document.body` can be null right after navigate). Long sessions leave half-open CDP sockets — if new connections stop responding, kill the stray `powershell` processes running cdp scripts and `Page.navigate` to recover the wedged tab.

**Session collisions (2026-10-16)**: the 9377 Chrome may hold another workstream's login (e.g. gembuy39) — check before writing (header nickname + member-web `withdrawForm.custNo`); don't swap its account. Start a second instance instead: same launch flags, new `--user-data-dir`, another port (e.g. `--remote-debugging-port=9388`); `cdp-run.ps1`/`cdp-match.ps1` both take `-Port`, and `cdp-match.ps1 -UrlMatch <regex>` picks the tab by URL so other tabs stay untouched. If the in-app browser is bricked (every read answers "blank" — recurring since 10-15), don't fight it — use the test Chrome.
