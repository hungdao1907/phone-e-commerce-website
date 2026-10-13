/** Only server environment may supply webhook credentials; never use Customer input. */
export function chatbotWebhookHeaders(
  env: Record<string, string | undefined>,
  requireAuthentication = false,
): Record<string, string> {
  const name = env.N8N_CHAT_AUTH_HEADER?.trim();
  const value = env.N8N_CHAT_AUTH_VALUE;
  if (!name && !value && !requireAuthentication) return { 'Content-Type': 'application/json' };
  if (!name || !value || !/^[!#$%&'*+.^_`|~0-9A-Za-z-]+$/.test(name)
    || /[\r\n]/.test(value) || !value.trim()
    || ['content-type', 'content-length', 'host', 'connection', 'cookie', 'transfer-encoding'].includes(name.toLowerCase())) {
    throw new Error('Chatbot webhook authentication is not configured correctly.');
  }
  return { 'Content-Type': 'application/json', [name]: value };
}
