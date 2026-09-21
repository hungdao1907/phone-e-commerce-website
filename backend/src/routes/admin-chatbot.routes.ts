import express from 'express';
import crypto from 'crypto';
import { authenticateToken, AuthRequest } from '../middleware/auth.middleware';

const router = express.Router();

router.post('/message', authenticateToken, async (req: AuthRequest, res) => {
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
      source: 'admin_chat'
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 90000); // 90 seconds timeout

    let n8nResponse;
    try {
      n8nResponse = await fetch(n8nUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(n8nPayload),
        signal: controller.signal
      });
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      if (fetchError.name === 'AbortError') {
        console.error('[Admin Chatbot Route] n8n request timed out.');
        return res.status(504).json({ 
          result_type: 'error', 
          response_type: 'text', 
          success: false, 
          response: 'Kết nối đến dịch vụ Admin Chat bị quá hạn.', 
          sessionId 
        });
      }
      console.error('[Admin Chatbot Route] Network error calling n8n:', fetchError.message);
      return res.status(502).json({ 
        result_type: 'error', 
        response_type: 'text', 
        success: false, 
        response: 'Không thể kết nối đến dịch vụ Admin Chat.', 
        sessionId 
      });
    }
    
    clearTimeout(timeoutId);

    // Read the body once
    const rawBody = await n8nResponse.text();

    let responseData;
    let parseError = false;
    try {
      responseData = JSON.parse(rawBody);
    } catch (e) {
      parseError = true;
    }

    // Normalize if array with 1 item
    if (!parseError && Array.isArray(responseData) && responseData.length === 1) {
      responseData = responseData[0];
    }

    // Check if it's a valid chatbot response
    const isValidResponse = !parseError && responseData && typeof responseData === 'object' && !Array.isArray(responseData) && typeof responseData.response === 'string';

    // 5. Handle non-2xx Response
    if (!n8nResponse.ok) {
      console.error(`[Admin Chatbot Route] n8n returned status ${n8nResponse.status} ${n8nResponse.statusText}`);
      return res.status(502).json({ 
        result_type: 'error', 
        response_type: 'text', 
        success: false, 
        response: 'Dịch vụ Admin Chat gặp lỗi phản hồi.', 
        sessionId
      });
    }

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

  } catch (err: any) {
    console.error('[Admin Chatbot Route] Unexpected error:', err.message);
    return res.status(500).json({ 
      result_type: 'error', 
      response_type: 'text', 
      success: false, 
      response: 'Lỗi server nội bộ.' 
    });
  }
});

export default router;
