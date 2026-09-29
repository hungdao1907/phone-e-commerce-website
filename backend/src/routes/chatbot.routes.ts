import express from 'express';
import crypto from 'crypto';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = express.Router();

// Setup directories for quotation uploads
const uploadsDir = path.resolve(__dirname, '..', '..', 'uploads');
const quotationsDir = path.resolve(uploadsDir, 'quotations');

if (!fs.existsSync(quotationsDir)) {
  fs.mkdirSync(quotationsDir, { recursive: true });
}

// Configure multer for PDF quotations
const quotationStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, quotationsDir);
  },
  filename: (req, file, cb) => {
    // Do not rely on req.body for multipart uploads as it may not be parsed yet.
    // Instead, extract a safe name from file.originalname
    let safeName = 'UNNAMED';
    if (file.originalname) {
      const baseName = path.basename(file.originalname, '.pdf');
      const sanitized = baseName.replace(/[^a-zA-Z0-9-]/g, '');
      if (sanitized) {
        safeName = sanitized;
      }
    }
    
    const randomHex = crypto.randomBytes(4).toString('hex');
    cb(null, `${safeName}-${randomHex}.pdf`);
  }
});

const quotationUpload = multer({
  storage: quotationStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB limit
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'application/pdf' && path.extname(file.originalname).toLowerCase() === '.pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  }
});

router.post('/message', async (req, res) => {
  try {
    // 1. Validate 'message'
    const { message } = req.body;
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ result_type: 'error', response_type: 'text', success: false, response: 'Nội dung tin nhắn không được để trống.' });
    }
    
    const trimmedMessage = message.trim();
    if (trimmedMessage.length === 0) {
      return res.status(400).json({ result_type: 'error', response_type: 'text', success: false, response: 'Nội dung tin nhắn không được để trống.' });
    }
    
    if (trimmedMessage.length > 2000) {
      return res.status(400).json({ result_type: 'error', response_type: 'text', success: false, response: 'Tin nhắn không được vượt quá 2000 ký tự.' });
    }

    // 2. Validate or generate 'sessionId'
    let sessionId = req.body.sessionId;
    if (!sessionId || typeof sessionId !== 'string' || sessionId.trim().length === 0 || sessionId.length > 100) {
      sessionId = crypto.randomUUID();
    } else {
      sessionId = sessionId.trim();
    }

    // 3. Ensure Environment Variable
    const n8nUrl = process.env.N8N_CHAT_WEBHOOK_URL;
    if (!n8nUrl) {
      console.error('[Chatbot Route] N8N_CHAT_WEBHOOK_URL is not configured.');
      return res.status(503).json({ result_type: 'error', response_type: 'text', success: false, response: 'Chat service is temporarily unavailable', sessionId });
    }

    // 4. Prepare n8n Request
    const n8nPayload = {
      chatInput: trimmedMessage,
      sessionId: sessionId,
      source: 'web_chat'
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
        console.error('[Chatbot Route] n8n request timed out.');
        return res.status(504).json({ result_type: 'error', response_type: 'text', success: false, response: 'Chat service timed out. Please try again later.', sessionId });
      }
      console.error('[Chatbot Route] Network error calling n8n:', fetchError.message);
      return res.status(502).json({ result_type: 'error', response_type: 'text', success: false, response: 'Failed to communicate with chat service.', sessionId });
    }
    
    clearTimeout(timeoutId);

    // 5. Handle non-2xx Response
    if (!n8nResponse.ok) {
      console.error(`[Chatbot Route] n8n returned status ${n8nResponse.status} ${n8nResponse.statusText}`);
      return res.status(502).json({ result_type: 'error', response_type: 'text', success: false, response: 'Chat service encountered an error.', sessionId });
    }

    // 6. Check Content-Type for Binary/PDF
    const contentType = n8nResponse.headers.get('content-type') || '';
    
    if (contentType.includes('application/pdf') || contentType.includes('application/octet-stream') || contentType.includes('application/vnd.')) {
      // Proxy binary response
      res.setHeader('Content-Type', contentType);
      
      const contentDisposition = n8nResponse.headers.get('content-disposition');
      if (contentDisposition) {
        res.setHeader('Content-Disposition', contentDisposition);
      }
      
      res.setHeader('X-Chat-Session-Id', sessionId);
      
      // Convert web stream to node stream or send buffer
      const arrayBuffer = await n8nResponse.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      return res.send(buffer);
    }

    // 7. Handle JSON Response
    let responseData;
    try {
      responseData = await n8nResponse.json();
    } catch (parseError) {
      console.error('[Chatbot Route] Failed to parse n8n JSON response:', parseError);
      return res.status(502).json({ result_type: 'error', response_type: 'text', success: false, response: 'Received invalid data from chat service.', sessionId });
    }

    // Normalize if array with 1 item
    if (Array.isArray(responseData) && responseData.length === 1) {
      responseData = responseData[0];
    }
    
    // Fallback if somehow it's still an array or weird object without sessionId
    if (typeof responseData === 'object' && responseData !== null && !Array.isArray(responseData)) {
      if (!responseData.sessionId) {
        responseData.sessionId = sessionId;
      }
    } else if (Array.isArray(responseData)) {
       // if it's an array of multiple items, add a header for session id just in case.
       res.setHeader('X-Chat-Session-Id', sessionId);
    }

    return res.status(200).json(responseData);

  } catch (err: any) {
    console.error('[Chatbot Route] Unexpected error:', err.message);
    return res.status(500).json({ result_type: 'error', response_type: 'text', success: false, response: 'Internal server error' });
  }
});

// n8n uploads generated PDF
router.post('/quotation-files', (req, res) => {
  // Auth Check
  const expectedToken = process.env.CHATBOT_INTEGRATION_TOKEN;
  if (!expectedToken) {
    return res.status(503).json({ result_type: 'error', response_type: 'text', success: false, response: 'Server integration token is not configured.' });
  }

  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace(/^Bearer\s+/, '').trim();
  
  if (token !== expectedToken) {
    return res.status(401).json({ result_type: 'error', response_type: 'text', success: false, response: 'Unauthorized.' });
  }

  // Handle upload
  quotationUpload.single('file')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({ result_type: 'error', response_type: 'text', success: false, response: 'File is too large (max 10MB).' });
      }
      return res.status(400).json({ result_type: 'error', response_type: 'text', success: false, response: `Upload error: ${err.message}` });
    }
    if (err) {
      return res.status(400).json({ result_type: 'error', response_type: 'text', success: false, response: err.message || 'Invalid file format.' });
    }

    if (!req.file) {
      return res.status(400).json({ result_type: 'error', response_type: 'text', success: false, response: 'No file uploaded.' });
    }

    const downloadUrl = `/api/chatbot/quotation-files/${req.file.filename}`;

    return res.status(201).json({
      success: true,
      file_name: req.file.filename,
      mime_type: 'application/pdf',
      download_url: downloadUrl
    });
  });
});

// Client downloads PDF
router.get('/quotation-files/:fileName', (req, res) => {
  const fileName = req.params.fileName;
  
  // Basic sanitization
  if (!fileName || fileName.includes('/') || fileName.includes('\\') || fileName.includes('..')) {
    return res.status(400).json({ result_type: 'error', response_type: 'text', success: false, response: 'Invalid file name.' });
  }

  const filePath = path.resolve(quotationsDir, fileName);

  // Prevent path traversal
  if (!filePath.startsWith(quotationsDir)) {
    return res.status(400).json({ result_type: 'error', response_type: 'text', success: false, response: 'Invalid file path.' });
  }

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ result_type: 'error', response_type: 'text', success: false, response: 'File not found.' });
  }

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
  
  const stream = fs.createReadStream(filePath);
  stream.on('error', (err) => {
    console.error('[Chatbot Route] Error streaming quotation file:', err);
    if (!res.headersSent) {
      res.status(500).json({ result_type: 'error', response_type: 'text', success: false, response: 'Error reading file.' });
    }
  });

  stream.pipe(res);
});

export default router;
