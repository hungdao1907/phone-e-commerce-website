import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
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
import bannerRoutes from './routes/banner.routes';
import uploadRoutes from './routes/upload.routes';

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from uploads folder
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

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
app.use('/api/banners', bannerRoutes);
app.use('/api/upload', uploadRoutes);

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.listen(port, () => {
  console.log(`Backend server is running on port ${port}`);
});
