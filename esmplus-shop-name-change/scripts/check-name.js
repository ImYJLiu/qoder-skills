// Fill 국문 Shop 이름 + click 중복체크; collects native dialogs non-blockingly.
// EDIT `name` before running. Run via login-esmplus scripts/cdp/cdp-run.ps1 -EvalFile <this>.
(async () => {
  const CONFIG = { name: 'gemsell01변경' };
  const wait = ms => new Promise(r => setTimeout(r, ms));
  window.__dlg = [];
  window.alert = m => { window.__dlg.push(['alert', String(m)]); };
  window.confirm = m => { window.__dlg.push(['confirm', String(m)]); return true; };
  const setVal = (el, v) => {
    const d = Object.getOwnPropertyDescriptor(el.constructor.prototype, 'value');
    d.set.call(el, v);
    for (const t of ['input', 'change', 'keyup', 'blur']) el.dispatchEvent(new Event(t, { bubbles: true }));
  };
  const nm = document.querySelector('#txtShopName');
  if (!nm) return JSON.stringify({ ok: false, reason: 'no field' });
  setVal(nm, CONFIG.name);
  await wait(400);
  const chk = document.querySelector('#btnNmCheck');
  if (!chk) return JSON.stringify({ ok: false, reason: 'no check button' });
  chk.click();
  await wait(1500);
  return JSON.stringify({ ok: true, name: nm.value, dlg: window.__dlg, tail: document.body.innerText.slice(-600) });
})()
