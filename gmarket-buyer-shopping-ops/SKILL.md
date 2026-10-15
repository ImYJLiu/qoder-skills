---
name: gmarket-buyer-shopping-ops
description: Drive Gmarket buyer shopping flows on test accounts (STG pages) — batch-add items to the 찜/wishlist via AddFavoriteItem, verify the wishlist page (sold-out items hide but stay saved), and add products to the cart / start an order without paying. Use for 加心愿单/찜、心愿清单核对、批量加收藏、加购物车/下单测试、lunaliu 买家购物操作、cart-av/order 排查.
---

# Gmarket Buyer Shopping Ops (wishlist / cart / order)

## Scope & safety

Shopping operations with a shared test buyer (`lunaliu*` / `gembuyN`) on STG pages. 「下单不支付」 is the normal test ask ("不支付没关系，先保障能够正常下单") — walk the order flow to the payment step and STOP before real payment. Reuse an existing buyer session (prod login + domain swap, see `register-gmarket-buyer`).

## URLs

- PDP: `https://item-stg.gmarket.co.kr/Item?goodscode=<n>` (`goodscode` numeric; PDPs from the seller console are `item-av.esmplus.com/goods/list`).
- Wishlist: `https://diary2.gmarket.co.kr/Favorite/MyFavoriteItems` → lands on `/Favorite/MyFavoriteItems3?page=1&order=OrderBySaveDate&itemType=All`.
- Cart: `https://cart-av.gmarket.co.kr/ko/cart`.
- Session oracle: `https://my-av.gmarket.co.kr/ko/pc/main` (header 로그인/로그아웃).

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
3. Identity caveat: the header nickname is masked (`lunal***님`) — same-prefix accounts (lunaliu1 / lunaliu031) are indistinguishable. Confirm the custNo via member-web `withdrawForm.custNo` (see `register-gmarket-buyer`; lunaliu031 = 162297097).

## Cart / order

- From the PDP click 장바구니 (`el.click()` — works even where tool clicks don't; the page exposes `GmktItem.AddCartController` as the JS path) → layer 「장바구니에 상품을 담았습니다」 (added to cart). Header 장바구니 badge = current count.
- The cart may carry old test items — 판매종료 (sale-ended) rows cannot be ordered, ignore them.
- 2026-10-15: 「배송불가」 test goods (IZOD / 물티슈 batch) DID add to cart, so they are orderable in principle → continue to the order sheet (주문서) without paying.
- Full checkout (결제수단 → 결제) is NOT yet verified end-to-end — the 10-15 session ended at the first batch add. When doing it: stop before the payment submit and report the reached step.
- Useful test goods: gemsell05 IZOD 4873701923 / 4873701452 / 4873697817; gemsell11 물티슈 4873693605 / 4873693149 / 4823172209 (SOLD OUT); 4856553025 (SOLD OUT) / 4855820722 (test_option).
