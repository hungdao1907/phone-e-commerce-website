import dotenv from 'dotenv';
dotenv.config({ override: true });
import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import customerRoutes from './routes/customer.routes';
import planRoutes from './routes/plan.routes';
import productRoutes from './routes/product.routes';
import categoryRoutes from './routes/category.routes';
import orderRoutes from './routes/order.routes';
import reviewRoutes from './routes/review.routes';
import disputeRoutes from './routes/dispute.routes';
import invoiceRoutes from './routes/invoice.routes';
import campaignRoutes from './routes/campaign.routes';
import promoCodeRoutes from './routes/promoCode.routes';
import bannerRoutes from './routes/banner.routes';
import uploadRoutes from './routes/upload.routes';
import footerRoutes from './routes/footer.routes';
import rewardRoutes from './routes/reward.routes';
import leadRoutes from './routes/lead.routes';
import dashboardRoutes from './routes/dashboard.routes';
import notificationRoutes from './routes/notification.routes';

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from uploads folder (reliably resolves to backend/uploads)
const uploadsDir = path.resolve(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
const bannersUploadsDir = path.resolve(uploadsDir, 'banners');
if (!fs.existsSync(bannersUploadsDir)) {
  fs.mkdirSync(bannersUploadsDir, { recursive: true });
}

app.use('/uploads', express.static(uploadsDir));
const cwdUploads = path.resolve(process.cwd(), 'uploads');
if (cwdUploads !== uploadsDir && fs.existsSync(cwdUploads)) {
  app.use('/uploads', express.static(cwdUploads));
}

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/plans', planRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/disputes', disputeRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/promo-codes', promoCodeRoutes);
app.use('/api/banners', bannerRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/footer', footerRoutes);
app.use('/api/rewards', rewardRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/notifications', notificationRoutes);

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.listen(port, () => {
  console.log(`Backend server is running on port ${port}`);
});
