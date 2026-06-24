// Apps-in-Toss Smart Messaging (server-to-server push + in-app messages).
// Docs: https://developers-apps-in-toss.toss.im/smart-message/intro.html
//
// Requires a partner auth token with the message-sending scope (console) and a
// registered 알림 동의문 / templateCode. Env-gated: when not configured we no-op
// and log, so the crons run safely in dev/sandbox.

interface SendMessageInput {
  userKey: string; // Toss user key (users.toss_user_id)
  templateCode: string; // console-registered functional/promotional template
  title: string;
  body: string;
  linkUrl?: string; // deep link into the mini-app
  variables?: Record<string, string>;
}

function configured(): boolean {
  return Boolean(process.env.TOSS_SMART_MESSAGE_TOKEN && process.env.TOSS_PARTNER_API_BASE);
}

export async function sendMessage(input: SendMessageInput): Promise<boolean> {
  if (!configured()) {
    console.log('[smart-message:mock]', input.userKey, input.title, '-', input.body);
    return false;
  }
  try {
    const base = process.env.TOSS_PARTNER_API_BASE!.replace(/\/$/, '');
    const res = await fetch(`${base}/api-partner/v1/apps-in-toss/message/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.TOSS_SMART_MESSAGE_TOKEN}`,
      },
      body: JSON.stringify({
        userKey: input.userKey,
        templateCode: input.templateCode,
        title: input.title,
        body: input.body,
        linkUrl: input.linkUrl,
        variables: input.variables ?? {},
      }),
    });
    if (!res.ok) {
      console.error('sendMessage failed', res.status, await res.text().catch(() => ''));
      return false;
    }
    return true;
  } catch (e) {
    console.error('sendMessage error', e);
    return false;
  }
}

export async function sendBulkMessage(inputs: SendMessageInput[]): Promise<number> {
  let sent = 0;
  for (const input of inputs) {
    if (await sendMessage(input)) sent += 1;
  }
  return sent;
}

// Template codes (register these in the console; functional vs promotional).
export const TEMPLATES = {
  priceDrop: process.env.TOSS_TEMPLATE_PRICE_DROP || 'price_drop_alert',
  dailyReport: process.env.TOSS_TEMPLATE_DAILY_REPORT || 'daily_savings_report',
  hotDeal: process.env.TOSS_TEMPLATE_HOT_DEAL || 'hot_deal_alert',
};
