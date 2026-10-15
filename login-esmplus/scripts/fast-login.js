// Fast ESM+ login — copy into browser-use evaluate_script (one call).
// Edit CONFIG, run on the signin page. Handles: tab switch -> fill -> submit
// -> JWT bridge settle -> auto-skip the 연락처 notice popup.
// Uses condition-polling (no fixed long sleeps). After it returns ok, navigate
// STRAIGHT to the target page — do NOT detour to verify Home.
(async () => {
  const CFG = { loginId: 'gemsell17', password: 'Gmkt1004!', tab: 'gmarket' }; // tab: 'esm' | 'gmarket' | 'auction'
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const waitFor = async (fn, timeout = 30000, step = 700) => {
    const t0 = Date.now();
    while (Date.now() - t0 < timeout) {
      try { const v = fn(); if (v) return v; } catch (e) {}
      await wait(step);
    }
    return null;
  };
  const setVal = (el, v) => {
    const d = Object.getOwnPropertyDescriptor(el.constructor.prototype, 'value');
    d.set.call(el, v);
    for (const t of ['input', 'change', 'keyup', 'blur']) el.dispatchEvent(new Event(t, { bubbles: true }));
  };
  const tabBtn = document.querySelector('button.button__tab--' + CFG.tab);
  if (tabBtn) tabBtn.click();
  await wait(1000);
  const idEl = document.querySelector('#typeMemberInputId01');
  const pwEl = document.querySelector('#typeMemberInputPassword01');
  if (!idEl || !pwEl) return { ok: false, reason: 'not on signin page' };
  setVal(idEl, CFG.loginId);
  setVal(pwEl, CFG.password);
  const btn = [...document.querySelectorAll('button')].find(b => b.innerText.trim() === '로그인' && b.className.includes('button--blue'));
  if (!btn) return { ok: false, reason: 'login button missing' };
  btn.click();
  let skipClicked = false;
  const settled = await waitFor(() => {
    const t = document.body.innerText || '';
    if (!skipClicked && t.includes('ESM+ 바로가기')) {
      const skip = [...document.querySelectorAll('button')].find(b => b.innerText.trim() === 'ESM+ 바로가기');
      if (skip) { skip.click(); skipClicked = true; return null; }
    }
    if (location.href.includes('/Home') && t.length > 100 && !t.includes('비밀번호를 입력해주세요')) return skipClicked ? 'home-after-skip' : 'home';
    return null;
  }, 30000);
  await wait(1200);
  const t2 = document.body.innerText || '';
  return { ok: !!settled, settled: settled, url: location.href.slice(0, 120), loggedIn: t2.includes('로그아웃') || t2.includes('마스터') };
})()
