(async () => {
  const inp = document.querySelector('#__up');
  if (!inp || !inp.files || inp.files.length === 0) return JSON.stringify({ ok: false, reason: 'no files on input' });
  const fd = new FormData();
  for (const f of inp.files) fd.append('file', f, f.name);
  const r = await fetch('/rest/api/2/issue/GEMINI-4314/attachments', {
    method: 'POST',
    headers: { 'X-Atlassian-Token': 'no-check', 'X-Requested-With': 'XMLHttpRequest' },
    body: fd
  });
  let d = null;
  try { d = await r.json(); } catch (e) { d = String(e); }
  return JSON.stringify({ status: r.status, files: Array.isArray(d) ? d.map(a => ({ fn: a.filename, size: a.size })) : d });
})()
