import { sendPaymentSuccessEmail } from './src/services/email.service';
const mockOrder = {
  orderCode: 'TEST001',
  createdAt: new Date(),
  totalAmount: 15990000,
  shippingFee: 0,
  discountAmount: 0,
  paymentMethod: 'BANK_TRANSFER',
  paymentStatus: 'PAID',
  shippingAddress: '123 Test Street, Hanoi',
  shippingPhone: '0987654321',
  customer: {
    fullName: 'Nguyen Van Test',
    email: process.env.SMTP_EMAIL
  },
  items: [
    {
      productName: 'iPhone 15 Pro Max',
      variantInfo: 'Titan Tự Nhiên - 256GB',
      quantity: 1,
      unitPrice: 15990000
    }
  ]
};
sendPaymentSuccessEmail(mockOrder).then(() => console.log('Done')).catch(console.error);
