// Click 저장 (#btnShopInfoModify) after a passed 중복체크; collects native dialogs non-blockingly.
// Run via login-esmplus scripts/cdp/cdp-run.ps1 -EvalFile <this>.
(async () => {
  const wait = ms => new Promise(r => setTimeout(r, ms));
  if (!window.__dlg) window.__dlg = [];
  window.alert = m => { window.__dlg.push(['alert', String(m)]); };
  window.confirm = m => { window.__dlg.push(['confirm', String(m)]); return true; };
  const btn = document.querySelector('#btnShopInfoModify');
  if (!btn) return JSON.stringify({ ok: false, reason: 'no save button' });
  btn.click();
  await wait(2200);
  const layerBtns = [...document.querySelectorAll('a,button')].filter(e => e.offsetParent !== null && ['확인', '예', '저장'].includes((e.innerText || '').trim())).map(e => ({ id: e.id, cls: (e.className || '').toString().slice(0, 40), txt: e.innerText.trim() }));
  return JSON.stringify({ ok: true, dlg: window.__dlg, layerBtns, tail: document.body.innerText.slice(-500) });
})()
