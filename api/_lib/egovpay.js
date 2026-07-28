import { createHmac, randomBytes } from 'node:crypto';

const DEMO_AMOUNT = 155;
const DEMO_ITEM = 'PSA Birth Certificate — Demo request';

function requireConfig(env) {
  const baseUrl = env.EGOVPAY_API_BASE_URL?.replace(/\/$/, '');
  const apiKey = env.EGOVPAY_API_KEY;
  const settlementTemplateUuid = env.EGOVPAY_SETTLEMENT_TEMPLATE_UUID;

  if (!baseUrl || !apiKey || !settlementTemplateUuid) {
    throw new Error('eGovPay test configuration is incomplete.');
  }

  if (!apiKey.startsWith('test_')) {
    throw new Error('Live eGovPay credentials are disabled for this demo.');
  }

  return { baseUrl, apiKey, settlementTemplateUuid };
}

function createTransactionId() {
  return `EABOT-DEMO-${Date.now()}-${randomBytes(3).toString('hex').toUpperCase()}`;
}

async function readUpstream(response) {
  const text = await response.text();
  let payload;
  try {
    payload = text ? JSON.parse(text) : {};
  } catch {
    payload = { message: text || 'Empty response from eGovPay.' };
  }

  if (!response.ok) {
    const message = payload?.message || payload?.error || `eGovPay returned HTTP ${response.status}.`;
    const error = new Error(message);
    error.status = response.status;
    error.details = payload?.errors;
    throw error;
  }

  return payload;
}

export async function createDemoTransaction({ env, origin }) {
  const { baseUrl, apiKey, settlementTemplateUuid } = requireConfig(env);
  const appUrl = (env.EGOVPAY_APP_URL || origin).replace(/\/$/, '');
  const txnid = createTransactionId();
  const digest = createHmac('sha256', apiKey)
    .update(`${DEMO_AMOUNT}|${txnid}`)
    .digest('hex');

  const requestBody = {
    items: [{ name: DEMO_ITEM, amount: DEMO_AMOUNT }],
    amount: DEMO_AMOUNT,
    settlement_template_uuid: settlementTemplateUuid,
    redirect_url: `${appUrl}/?payment=return&txnid=${encodeURIComponent(txnid)}`,
    txnid,
    callback_url: `${appUrl}/api/egovpay/callback`,
    digest,
    currency: 'PHP',
    name: 'Mika Reyes — Demo Profile',
  };

  const response = await fetch(`${baseUrl}/api/v1/transaction`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'X-eGovPay-Token': apiKey,
    },
    body: JSON.stringify(requestBody),
    signal: AbortSignal.timeout(12_000),
  });
  const payload = await readUpstream(response);
  const data = payload?.data || payload;

  if (!data?.uuid || !data?.url) {
    throw new Error('eGovPay did not return a transaction UUID and hosted URL.');
  }

  return {
    uuid: data.uuid,
    url: data.url,
    refno: data.channel?.refno || null,
    txnid,
    amount: DEMO_AMOUNT,
    currency: 'PHP',
    paymentStatus: 'INITIAL',
    testMode: true,
  };
}

export async function getDemoTransaction({ env, uuid }) {
  const { baseUrl, apiKey } = requireConfig(env);
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(uuid || '')) {
    const error = new Error('A valid eGovPay transaction UUID is required.');
    error.status = 400;
    throw error;
  }

  const response = await fetch(`${baseUrl}/api/v1/transaction/${encodeURIComponent(uuid)}`, {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'X-eGovPay-Token': apiKey,
    },
    signal: AbortSignal.timeout(12_000),
  });
  const payload = await readUpstream(response);
  const data = payload?.data || payload;

  return {
    uuid,
    txnid: data.txnid || null,
    amount: data.amount || null,
    currency: data.currency || 'PHP',
    paymentStatus: data.payment_status || 'UNKNOWN',
    paidAt: data.paid_at || null,
    createdAt: data.created_at || null,
    linkExpiresAt: data.link_expires_at || null,
    testMode: true,
  };
}
