(async () => {
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const setVal = (el, v) => {
    const d = Object.getOwnPropertyDescriptor(el.constructor.prototype, 'value');
    d.set.call(el, v);
    for (const t of ['input', 'change', 'keyup', 'blur']) el.dispatchEvent(new Event(t, { bubbles: true }));
  };
  const idEl = document.querySelector('#username-field');
  const pwEl = document.querySelector('#password-field');
  const btn = document.querySelector('#login-button');
  if (!idEl || !pwEl || !btn) return JSON.stringify({ ok: false, reason: 'no fields', u: location.href });
  setVal(idEl, 'ddcm41');
  setVal(pwEl, '__PW__');
  await wait(300);
  btn.click();
  return JSON.stringify({ ok: true, id: idEl.value, pwLen: pwEl.value.length });
})()
