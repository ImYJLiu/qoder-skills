(async () => {
  const summary = '【STG】[IM/Buyer/Web+App] 卖家未开通聊天服务时，卖家资料「상담 가능 시간」行应隐藏 / Hide the "상담 가능 시간" (consultation-hours) row in the seller profile when the seller has not activated the chat service';
  const desc = [
    'h3. 环境 / Environment',
    'STG；卖家 gemsell12（未开通聊天服务，密码 Gmkt1004!）；买家侧。PC 聊天卖家资料弹窗 + 手机 App 卖家资料页。',
    'EN: STG; seller gemsell12 (chat service NOT activated); buyer side. PC chat seller-profile popup + mobile App seller-profile page.',
    '',
    'h3. 现象 / Symptom',
    '卖家未开通聊天（IM）服务时，卖家资料仍显示「상담 가능 시간」行（卖家名下方第二行）：',
    '* PC 弹窗：상담 가능 시간 : 휴무',
    '* App：상담시간 평일 : 휴무 / 주말/공휴일 :',
    'EN: When the seller has not activated the chat (IM) service, the seller profile still shows the "상담 가능 시간" row (2nd line under the seller name): PC popup "상담 가능 시간 : 휴무"; App "상담시간 평일 : 휴무 / 주말/공휴일 :".',
    '',
    'h3. 复现 / Steps',
    '# 卖家未开通聊天服务（gemsell12）',
    '# 买家侧打开与该卖家的聊天 → 卖家资料（PC 弹窗 / App 资料页）',
    '# 观察到「상담 가능 시간」行仍显示（当前显示「휴무」）',
    'EN: seller without chat service -> buyer opens the chat with the seller -> seller profile (PC popup / App page) -> the "상담 가능 시간" row is still displayed ("휴무").',
    '',
    'h3. 预期 / Expected',
    '卖家未开通聊天服务时，该行应整体隐藏（不应显示「휴무」）。',
    'EN: This row should be hidden entirely when the seller has not activated the chat service (must not display "휴무").',
    '',
    'h3. 证据 / Evidence',
    '附件 2 张：PC 卖家资料弹窗截图（gemsell12 부재중 / 상담 가능 시간 : 휴무）、App 卖家资料页截图。'
  ].join('\n');
  const fields = {
    project: { key: 'GEMINI' },
    issuetype: { id: '1' },
    summary: summary,
    description: desc,
    assignee: { name: 'ddcm44' },
    labels: ['STG'],
    components: [{ id: '30978' }],
    customfield_10501: 'GEMINI-2453'
  };
  const r = await fetch('/rest/api/2/issue', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' }, body: JSON.stringify({ fields: fields }) });
  const d = await r.json();
  return JSON.stringify({ status: r.status, key: d.key, errors: d.errors, errorMessages: d.errorMessages });
})()
