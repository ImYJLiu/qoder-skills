(() => {
  const t = document.body.innerText || '';
  const skip = [...document.querySelectorAll('button')].find(b => b.innerText.trim() === 'ESM+ 바로가기');
  let skipClicked = false;
  if (skip) { skip.click(); skipClicked = true; }
  const otp = document.querySelector('#authenticationNumber01');
  const onHome = location.hostname.startsWith('www-dev') && location.pathname.startsWith('/Home');
  const m = t.match(/마스터[^\n]{0,60}/);
  let capKeys = [];
  try { capKeys = Object.keys(window.__cap || {}); } catch (e) {}
  return {
    u: location.href.slice(0, 150),
    onHome,
    skipClicked,
    otpVisible: !!otp,
    header: m ? m[0].trim() : null,
    pwErr: t.includes('비밀번호를 입력해주세요'),
    ready: document.readyState,
    capKeys
  };
})()
