const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'backend/src/routes/product.routes.ts');
let content = fs.readFileSync(filePath, 'utf-8');

const importStatements = `
import multer from 'multer';
import { parseExcelPreview, processImport } from '../services/import.service';
`;
if (!content.includes('parseExcelPreview')) {
    content = content.replace("import { extractFiltersFromProducts", importStatements + "\nimport { extractFiltersFromProducts");
}

const multerConfig = `
const uploadMemory = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});
`;
if (!content.includes('uploadMemory')) {
    content = content.replace("const prisma = new PrismaClient();", "const prisma = new PrismaClient();\n" + multerConfig);
}

const importRoutes = `
// POST /import/preview - Preview Excel Import
router.post('/import/preview', authenticateToken, uploadMemory.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Không tìm thấy file tải lên.' });
    }
    const result = await parseExcelPreview(req.file.buffer);
    res.json(result);
  } catch (error: any) {
    console.error('Import preview error:', error);
    res.status(500).json({ message: 'Lỗi khi đọc file Excel: ' + error.message });
  }
});

// POST /import/confirm - Confirm Excel Import
router.post('/import/confirm', authenticateToken, async (req, res) => {
  try {
    const { groupedProducts } = req.body;
    if (!groupedProducts || !Array.isArray(groupedProducts)) {
      return res.status(400).json({ message: 'Dữ liệu không hợp lệ.' });
    }
    
    const result = await processImport(groupedProducts);
    res.json(result);
  } catch (error: any) {
    console.error('Import confirm error:', error);
    res.status(500).json({ message: 'Lỗi khi import dữ liệu: ' + error.message });
  }
});

// POST /admin/bulk-action`;

if (!content.includes('/import/preview')) {
    content = content.replace("// POST /admin/bulk-action", importRoutes);
}

fs.writeFileSync(filePath, content, 'utf-8');
console.log('Routes added');
