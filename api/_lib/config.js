import { ApiError } from './errors.js';

export const CAPABILITIES = {
  sso:          { baseUrl: 'EGOV_SSO_API_BASE_URL',      creds: ['EGOV_SSO_PARTNER_CODE', 'EGOV_SSO_PARTNER_SECRET'] },
  everify:      { baseUrl: 'EVERIFY_API_BASE_URL',       creds: ['EVERIFY_CLIENT_ID', 'EVERIFY_CLIENT_SECRET'] },
  faceLiveness: { baseUrl: 'FACE_LIVENESS_API_BASE_URL', creds: ['FACE_LIVENESS_API_KEY'] },
  emessage:     { baseUrl: 'EMESSAGE_API_BASE_URL',      creds: ['EMESSAGE_ACCESS_TOKEN'] },
  egovAi:       { baseUrl: 'EGOV_AI_API_BASE_URL',       creds: ['EGOV_AI_ACCESS_CODE'] },
  egovpay:      { baseUrl: 'EGOVPAY_API_BASE_URL',       creds: ['EGOVPAY_API_KEY', 'EGOVPAY_SETTLEMENT_TEMPLATE_UUID'] },
  ereport:      { baseUrl: 'EREPORT_API_BASE_URL',       creds: ['EREPORT_ACCESS_TOKEN'] },
  compass:      { baseUrl: 'COMPASS_API_BASE_URL',       creds: ['COMPASS_API_KEY'] },
};

function definition(name) {
  const found = CAPABILITIES[name];
  if (!found) throw new ApiError(`Unknown capability: ${name}`, 500);
  return found;
}

function filled(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

export function capabilityStatus(env, name) {
  const { baseUrl, creds } = definition(name);
  if (!filled(env?.[baseUrl])) return 'unconfigured';
  return creds.every((key) => filled(env?.[key])) ? 'live' : 'unconfigured';
}

export function capabilityConfig(env, name) {
  const { baseUrl, creds } = definition(name);
  if (capabilityStatus(env, name) !== 'live') {
    throw new ApiError('This service is not configured.', 503);
  }
  return {
    baseUrl: env[baseUrl].trim().replace(/\/$/, ''),
    creds: Object.fromEntries(creds.map((key) => [key, env[key].trim()])),
  };
}
