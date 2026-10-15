(async () => {
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const setVal = (el, v) => {
    const d = Object.getOwnPropertyDescriptor(el.constructor.prototype, 'value');
    d.set.call(el, v);
    for (const t of ['input', 'change', 'keyup', 'blur']) el.dispatchEvent(new Event(t, { bubbles: true }));
  };
  const idEl = document.querySelector('#typeMemberInputId01');
  const pwEl = document.querySelector('#typeMemberInputPassword01');
  if (!idEl || !pwEl) return JSON.stringify({ ok: false, reason: 'no fields', u: location.href });
  setVal(idEl, 'geminiaidc');
  setVal(pwEl, '__PW__');
  const btn = [...document.querySelectorAll('button')].find(b => b.innerText.trim() === '로그인' && b.className.includes('button--blue'));
  if (!btn) return JSON.stringify({ ok: false, reason: 'no login button' });
  btn.click();
  return JSON.stringify({ ok: true, id: idEl.value, pwLen: pwEl.value.length });
})()
