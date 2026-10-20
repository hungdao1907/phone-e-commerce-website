import express from 'express';
import crypto from 'crypto';
import { authenticateToken, AuthRequest } from '../middleware/auth.middleware';
import { requireRoles } from '../middleware/authorization.middleware';
import { safeErrorSummary, safeFetchErrorSummary } from '../utils/safe-error-summary';

const ADMIN_CHATBOT_UPSTREAM_TIMEOUT_MS = 90_000;

const router = express.Router();

router.post('/message', authenticateToken, requireRoles('admin', 'superadmin'), async (req: AuthRequest, res) => {
  try {
    // Role check: Only allow users with access to the Admin Dashboard
    const ADMIN_DASHBOARD_ROLES = new Set(['superadmin', 'admin', 'manager', 'user']);
    const role = req.user?.role;
    if (!role || !ADMIN_DASHBOARD_ROLES.has(role)) {
      return res.status(403).json({
        result_type: 'error',
        response_type: 'text',
        success: false,
        response: 'Bạn không có quyền sử dụng trợ lý quản trị.'
      });
    }

    // 1. Validate 'message'
    const { message } = req.body;
    if (!message || typeof message !== 'string') {
      return res.status(400).json({
        result_type: 'error',
        response_type: 'text',
        success: false,
        response: 'Nội dung tin nhắn không được để trống.'
      });
    }

    const trimmedMessage = message.trim();
    if (trimmedMessage.length === 0) {
      return res.status(400).json({
        result_type: 'error',
        response_type: 'text',
        success: false,
        response: 'Nội dung tin nhắn không được để trống.'
      });
    }

    if (trimmedMessage.length > 2000) {
      return res.status(400).json({
        result_type: 'error',
        response_type: 'text',
        success: false,
        response: 'Tin nhắn không được vượt quá 2000 ký tự.'
      });
    }

    // The frontend sends a compact, source-derived UI context only.
    // Keep this bounded and ignore unrecognised payloads; no live business data is accepted here.
    const rawAdminContext = typeof req.body.adminContext === 'string' ? req.body.adminContext.trim() : '';
    const adminContext = rawAdminContext.startsWith('WEBPHONE ADMIN CONTEXT')
      ? rawAdminContext.slice(0, 24000)
      : '';

    // 2. Validate or generate 'sessionId'
    let sessionId = req.body.sessionId;
    if (!sessionId || typeof sessionId !== 'string' || sessionId.trim().length === 0 || sessionId.length > 100) {
      sessionId = crypto.randomUUID();
    } else {
      sessionId = sessionId.trim();
    }

    // 3. Ensure Environment Variable
    const n8nUrl = process.env.N8N_ADMIN_CHAT_WEBHOOK_URL;
    if (!n8nUrl) {
      console.error('[Admin Chatbot Route] N8N_ADMIN_CHAT_WEBHOOK_URL is not configured.');
      return res.status(503).json({
        result_type: 'error',
        response_type: 'text',
        success: false,
        response: 'Dịch vụ Admin Chat hiện không khả dụng.',
        sessionId
      });
    }

    // 4. Prepare n8n Request
    const n8nPayload = {
      chatInput: trimmedMessage,
      sessionId: sessionId,
      source: 'admin_chat',
      adminContext
    };

    const controller = new AbortController();
    let abortReason: 'deadline' | 'client_disconnected' | undefined;
    const abortUpstream = (reason: 'deadline' | 'client_disconnected') => {
      if (controller.signal.aborted) return;
      abortReason = reason;
      controller.abort();
    };
    const onDisconnect = () => {
      if (!res.writableEnded) abortUpstream('client_disconnected');
    };
    res.once('close', onDisconnect);
    if (req.aborted || res.destroyed) abortUpstream('client_disconnected');
    const deadlineAt = performance.now() + ADMIN_CHATBOT_UPSTREAM_TIMEOUT_MS;
    const timeoutId = setTimeout(() => abortUpstream('deadline'), ADMIN_CHATBOT_UPSTREAM_TIMEOUT_MS);
    const checkDeadline = () => {
      if (abortReason === 'client_disconnected') throw new Error('ADMIN_CHAT_CLIENT_DISCONNECTED');
      if (abortReason === 'deadline' || performance.now() >= deadlineAt) {
        abortUpstream('deadline');
        throw new Error('ADMIN_CHAT_TIMEOUT');
      }
    };

    try {
      const n8nResponse = await fetch(n8nUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(n8nPayload),
        signal: controller.signal
      });
      checkDeadline();

      // A failed upstream response never needs to be retained. Cancel its body without waiting
      // indefinitely for a peer that has already failed the request.
      if (!n8nResponse.ok) {
        void n8nResponse.body?.cancel().catch(() => undefined);
        console.error('[Admin Chatbot Route] n8n returned an error status.', { status: n8nResponse.status });
        return res.status(502).json({
          result_type: 'error',
          response_type: 'text',
          success: false,
          response: 'Dịch vụ Admin Chat gặp lỗi phản hồi.',
          sessionId
        });
      }

      // The deadline remains armed through body consumption, not only through headers.
      const rawBody = await n8nResponse.text();
      checkDeadline();

      let responseData;
      let parseError = false;
      try {
        responseData = JSON.parse(rawBody);
      } catch {
        parseError = true;
      }

      // Normalize if array with 1 item
      if (!parseError && Array.isArray(responseData) && responseData.length === 1) {
        responseData = responseData[0];
      }

      // Check if it's a valid chatbot response
      const isValidResponse = !parseError && responseData && typeof responseData === 'object' && !Array.isArray(responseData) && typeof responseData.response === 'string';

      // 6. Handle JSON Response errors
      if (parseError || !isValidResponse) {
        console.error('[Admin Chatbot Route] Failed to parse n8n JSON response or invalid payload');
        return res.status(502).json({
          result_type: 'error',
          response_type: 'text',
          success: false,
          response: 'Dữ liệu trả về từ Admin Chat không hợp lệ.',
          sessionId
        });
      }

      // Fallback to inject sessionId if missing
      if (typeof responseData === 'object' && responseData !== null && !Array.isArray(responseData)) {
        if (!responseData.sessionId) {
          responseData.sessionId = sessionId;
        }
      }

      return res.status(200).json(responseData);
    } catch (fetchError) {
      if (abortReason === 'client_disconnected' || res.destroyed || req.aborted) return;
      if (abortReason === 'deadline' || performance.now() >= deadlineAt) {
        console.error('[Admin Chatbot Route] n8n request timed out.');
        return res.status(504).json({
          result_type: 'error', response_type: 'text', success: false,
          response: 'Kết nối đến dịch vụ Admin Chat bị quá hạn.', sessionId
        });
      }
      console.error('[Admin Chatbot Route] Network error calling n8n:', safeFetchErrorSummary(fetchError));
      return res.status(502).json({
        result_type: 'error', response_type: 'text', success: false,
        response: 'Không thể kết nối đến dịch vụ Admin Chat.', sessionId
      });
    } finally {
      clearTimeout(timeoutId);
      res.off('close', onDisconnect);
    }

  } catch (err) {
    console.error('[Admin Chatbot Route] Unexpected error:', safeErrorSummary(err));
    return res.status(500).json({
      result_type: 'error',
      response_type: 'text',
      success: false,
      response: 'Lỗi server nội bộ.'
    });
  }
});

export default router;
