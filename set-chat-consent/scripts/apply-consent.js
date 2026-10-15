// One-shot chat-consent change — copy into browser-use evaluate_script, run ON
// the seller-*/chat/basic-information page. Edit CONFIG, run, then RELOAD once
// and re-read the state column to verify.
// NOTE: dialog texts are NOT trustworthy. The release flow (agree:false) shows
// a warning-confirm dialog first, then a result dialog whose wording may look
// like a failure ("...변경되지 않았습니다") even when the change actually applied
// (2026-10-10: release applied despite the message). Always reload-verify;
// never retry based on the dialog wording.
(async () => {
  const CFG = { sellerId: 'gemsell02', agree: false }; // agree: true = 동의함, false = 동의안함
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const row = [...document.querySelectorAll('tr')].find(tr => tr.querySelector('input[type=checkbox]') && (tr.innerText || '').includes(CFG.sellerId));
  if (!row) return { ok: false, reason: 'row not found', url: location.href.slice(0, 110) };
  const before = (row.innerText || '').replace(/\s+/g, ' ').trim();
  const cb = row.querySelector('input[type=checkbox]');
  if (!cb.checked) cb.click();
  await wait(400);
  const radio = document.querySelector(CFG.agree ? '#serviceAgree' : '#serviceDisagree');
  if (radio && !radio.checked) radio.click();
  await wait(400);
  const save = [...document.querySelectorAll('button')].find(b => b.innerText.trim() === '저장' && b.className.includes('button--blue'));
  if (!save) return { ok: false, reason: 'save button missing' };
  save.click();
  // dialog chain: optional warning-confirm -> result; collect every text
  const dialogs = [];
  const t0 = Date.now();
  let lastSeen = 0;
  while (Date.now() - t0 < 15000) {
    const dlg = document.querySelector('.box__layer.is-active');
    if (dlg) {
      const txt = (dlg.innerText || '').replace(/\s+/g, ' ').slice(0, 160);
      if (!dialogs.includes(txt)) {
        dialogs.push(txt);
        lastSeen = Date.now();
        const ok = [...dlg.querySelectorAll('button')].find(b => b.innerText.trim() === '확인');
        if (ok) ok.click();
        await wait(900);
        continue;
      }
    }
    if (dialogs.length && Date.now() - lastSeen > 1500) break;
    await wait(400);
  }
  await wait(600);
  return { ok: true, before, dialogs: dialogs, note: 'reload to verify actual state' };
})()
