# Qoder Skills (private)

个人 Qoder CLI 自定义技能备份。

> ⚠️ 私有仓库，内容含内部信息（内部 Jira 地址、账号、组件 ID 等），请勿转为公开。

## Skills

| Skill | 说明 |
| --- | --- |
| [dingtalk-doc-ops](dingtalk-doc-ops/SKILL.md) | 钉钉文档读写（alidocs）：全文抓取、视频抽帧、合成粘贴写入 |
| [esmplus-add-seller-id](esmplus-add-seller-id/SKILL.md) | ESM+ 新增 G마켓/옥션 Seller ID：申请 → 校验 → 创建 → 首登联动 |
| [esmplus-buyer-withdraw-chat-verify](esmplus-buyer-withdraw-chat-verify/SKILL.md) | 买家注销 + GEMINI-3825 聊天隐藏验证全流程（含强制截图点） |
| [esmplus-invite-manager](esmplus-invite-manager/SKILL.md) | ESM+ Manager 邀请 / 权限 / 交付检查 |
| [esmplus-shop-name-change](esmplus-shop-name-change/SKILL.md) | 改 Shop 名（卖家显示名）：dev/STG 路径、중복체크→저장、一月一次、聊天不跟进 |
| [file-gemini-issue](file-gemini-issue/SKILL.md) | GEMINI Jira 提单/改单/评论/传附件规范：按单指定语言、组件 ID、Epic Link 必挂、STG 单规则 |
| [gmarket-buyer-shopping-ops](gmarket-buyer-shopping-ops/SKILL.md) | 买家购物操作：批量加心愿单（AddFavoriteItem）、心愿单核对（售罄隐藏）、加购物车/下单（不支付） |
| [inspect-esmplus-chat](inspect-esmplus-chat/SKILL.md) | 聊天排查与联调：mtop 抓包、卡片渲染、买卖双方测试、按钮禁用策略（2920）、留言板落地 |
| [login-esmplus](login-esmplus/SKILL.md) | ESM+ dev/prod/STG 登录（Master/Manager/Seller ID）、会话判断、CDP 兜底（scripts/cdp） |
| [register-gmarket-buyer](register-gmarket-buyer/SKILL.md) | 注册 Gmarket 买家测试号（dev gembuyN / prod NNlunaliu） |
| [set-chat-consent](set-chat-consent/SKILL.md) | 设置/查询聊天服务同意（isConsented）与解除后 7 天锁定规则 |

## 使用方法

把技能目录复制到 Qoder 技能目录即可生效：

- Windows: `C:\Users\<user>\.qoder\skills\`
- macOS / Linux: `~/.qoder/skills/`

例：`file-gemini-issue/SKILL.md` → `~/.qoder/skills/file-gemini-issue/SKILL.md`

---
Last synced: 2026-10-18
