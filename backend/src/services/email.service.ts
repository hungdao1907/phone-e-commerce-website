import dotenv from 'dotenv';
import { isEmailConfigured, mailer } from './mailer';
import { trackingEmailErrorCategory, trackingOtpDiagnostic } from '../utils/tracking-otp-diagnostics';

dotenv.config();

const transporter = mailer;

const FRONTEND_URL = process.env.FRONTEND_URL || process.env.VITE_APP_URL || 'http://localhost:3000';

function escapeHtml(value: unknown): string {
  return String(value ?? '').replace(/[&<>"']/g, character => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[character]!));
}

export const sendOrderReceivedEmail = async (order: any) => {
  try {
    const customerName = escapeHtml(order.customer?.fullName || 'Khách hàng');
    const recipientName = escapeHtml(order.recipientName?.trim() || order.customer?.fullName || 'Khách hàng');
    const customerEmail = order.customer?.email;
    if (!customerEmail) return;

    const currentYear = new Date().getFullYear();
    const orderDate = new Date(order.createdAt).toLocaleDateString('vi-VN', {
      hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric'
    });

    let itemsHtml = '';
    let subtotal = 0;
    if (order.items && order.items.length > 0) {
      order.items.forEach((item: any) => {
        const itemTotal = item.quantity * item.unitPrice;
        subtotal += itemTotal;
        itemsHtml += `
          <div style="display:flex;justify-content:space-between;border-bottom:1px solid #eaeaea;padding:12px 0;font-size:14px;color:#333;">
            <div style="flex:1;">
              <p style="margin:0 0 4px 0;font-weight:600;color:#111;">${item.productName}</p>
              <p style="margin:0 0 4px 0;font-size:12px;color:#666;">${item.variantInfo}</p>
              <p style="margin:0;font-size:12px;color:#888;">SL: ${item.quantity} x ${new Intl.NumberFormat('vi-VN').format(item.unitPrice)}đ</p>
            </div>
            <div style="font-weight:600;color:#111;">${new Intl.NumberFormat('vi-VN').format(itemTotal)}đ</div>
          </div>
        `;
      });
    }

    const htmlContent = `
      <div style="font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;max-width:600px;margin:0 auto;padding:32px;background:#ffffff;border:1px solid #eaeaea;border-radius:12px;box-shadow:0 4px 24px rgba(0,0,0,0.04)">
        <div style="text-align:center;margin-bottom:32px">
          <h1 style="color:#000;font-size:24px;font-weight:800;margin:0;letter-spacing:-0.5px">H&M Phone Store</h1>
        </div>
        
        <h2 style="color:#111;font-size:20px;font-weight:600;margin:0 0 16px 0;text-align:center">Đã tiếp nhận đơn hàng của bạn!</h2>
        <p style="color:#444;font-size:15px;line-height:1.6;margin:0 0 16px 0">Xin chào <strong>${customerName}</strong>,</p>
        <p style="color:#444;font-size:15px;line-height:1.6;margin:0 0 24px 0">Cảm ơn bạn đã mua sắm tại H&M Phone Store.<br><br>Chúng tôi đã nhận được yêu cầu đặt hàng của bạn với mã đơn hàng <strong>${order.orderCode}</strong>.<br>Đơn hàng hiện đang được cửa hàng kiểm tra và xử lý. Chúng tôi sẽ gửi thông báo cho bạn ngay khi đơn hàng được xác nhận.</p>
        
        <div style="background:#f9f9f9;padding:24px;border-radius:8px;margin-bottom:24px;">
          <h3 style="margin:0 0 16px 0;font-size:16px;color:#111;border-bottom:2px solid #99e300;display:inline-block;padding-bottom:4px;">Thông tin đơn hàng</h3>
          <p style="margin:0 0 8px 0;font-size:14px;color:#444;"><strong>Mã đơn hàng:</strong> ${order.orderCode}</p>
          <p style="margin:0 0 8px 0;font-size:14px;color:#444;"><strong>Ngày đặt:</strong> ${orderDate}</p>
          <p style="margin:0 0 8px 0;font-size:14px;color:#444;"><strong>Trạng thái:</strong> Chờ xử lý</p>
        </div>

        <div style="margin-bottom:24px;">
          <h3 style="margin:0 0 16px 0;font-size:16px;color:#111;border-bottom:2px solid #99e300;display:inline-block;padding-bottom:4px;">Sản phẩm</h3>
          ${itemsHtml}
        </div>
        
        <div style="background:#f9f9f9;padding:24px;border-radius:8px;margin-bottom:24px;font-size:14px;color:#333;">
          <div style="display:flex;justify-content:space-between;margin-bottom:8px;"><span style="color:#666;">Tạm tính:</span> <span>${new Intl.NumberFormat('vi-VN').format(subtotal)}đ</span></div>
          <div style="display:flex;justify-content:space-between;margin-bottom:8px;"><span style="color:#666;">Phí vận chuyển:</span> <span>${new Intl.NumberFormat('vi-VN').format(order.shippingFee || 0)}đ</span></div>
          ${order.discountAmount ? `<div style="display:flex;justify-content:space-between;margin-bottom:8px;"><span style="color:#666;">Giảm giá:</span> <span style="color:#ef4444;">-${new Intl.NumberFormat('vi-VN').format(order.discountAmount)}đ</span></div>` : ''}
          <div style="display:flex;justify-content:space-between;margin-top:16px;padding-top:16px;border-top:1px solid #eaeaea;font-weight:700;font-size:16px;color:#111;"><span>Tổng cộng:</span> <span style="color:#99e300;">${new Intl.NumberFormat('vi-VN').format(order.totalAmount)}đ</span></div>
        </div>

        <div style="background:#f9f9f9;padding:24px;border-radius:8px;margin-bottom:24px;">
          <h3 style="margin:0 0 16px 0;font-size:16px;color:#111;border-bottom:2px solid #99e300;display:inline-block;padding-bottom:4px;">Thông tin giao hàng</h3>
          <p style="margin:0 0 8px 0;font-size:14px;color:#444;"><strong>Người nhận:</strong> ${recipientName}</p>
          <p style="margin:0 0 8px 0;font-size:14px;color:#444;"><strong>Số điện thoại giao hàng:</strong> ${escapeHtml(order.shippingPhone)}</p>
          <p style="margin:0;font-size:14px;color:#444;line-height:1.5;"><strong>Địa chỉ:</strong> ${escapeHtml(order.shippingAddress)}</p>
        </div>

        <div style="background:#f9f9f9;padding:24px;border-radius:8px;margin-bottom:32px;">
          <h3 style="margin:0 0 16px 0;font-size:16px;color:#111;border-bottom:2px solid #99e300;display:inline-block;padding-bottom:4px;">Phương thức thanh toán</h3>
          <p style="margin:0 0 8px 0;font-size:14px;color:#444;">${order.paymentMethod === 'COD' ? 'Thanh toán khi nhận hàng (COD)' : order.paymentMethod === 'BANK_TRANSFER' ? 'Thanh toán chuyển khoản' : order.paymentMethod}</p>
          <p style="margin:0;font-size:14px;color:#444;"><strong>Trạng thái thanh toán:</strong> ${order.paymentStatus === 'PAID' ? 'Đã thanh toán' : 'Chưa thanh toán'}</p>
        </div>

        <div style="text-align:center;margin-bottom:32px;">
          <p style="color:#666;font-size:14px;margin-bottom:16px;">Bạn có thể theo dõi trạng thái đơn hàng trực tiếp trên website H&M Phone Store.</p>
          <a href="${FRONTEND_URL}/profile/orders/${order.id}" style="display:inline-block;padding:14px 28px;background:#99e300;color:#000;font-weight:700;text-decoration:none;border-radius:8px;font-size:14px;letter-spacing:0.5px;">XEM CHI TIẾT ĐƠN HÀNG</a>
        </div>

        <hr style="border:none;border-top:1px solid #eaeaea;margin:32px 0">
        <div style="text-align:center;color:#888;font-size:12px;line-height:1.6">
          <p style="margin:0 0 8px 0">Cảm ơn bạn đã tin tưởng và mua sắm tại H&M Phone Store.</p>
          <p style="margin:0 0 16px 0">Đây là email được gửi tự động, vui lòng không trả lời trực tiếp email này.</p>
          <p style="margin:0">H&M Phone Store<br>© ${currentYear} H&M Phone Store. All rights reserved.</p>
        </div>
      </div>
    `;

    transporter.sendMail({
      from: `"H&M Phone Store" <${process.env.SMTP_EMAIL}>`,
      to: customerEmail,
      subject: `[H&M Phone Store] Đã tiếp nhận đơn hàng #${order.orderCode}`,
      html: htmlContent,
    }).then(() => {
      console.log(`Email "Order Received" sent to ${customerEmail}`);
    }).catch((error) => {
      console.error('Error sending order received email:', error);
    });
  } catch (error) {
    console.error('Error preparing order received email:', error);
  }
};

export const sendOrderConfirmedEmail = async (order: any) => {
  try {
    const customerName = escapeHtml(order.customer?.fullName || 'Khách hàng');
    const recipientName = escapeHtml(order.recipientName?.trim() || order.customer?.fullName || 'Khách hàng');
    const customerEmail = order.customer?.email;
    if (!customerEmail) return;

    const currentYear = new Date().getFullYear();
    const orderDate = new Date(order.createdAt).toLocaleDateString('vi-VN', {
      hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric'
    });

    let itemsHtml = '';
    let subtotal = 0;
    if (order.items && order.items.length > 0) {
      order.items.forEach((item: any) => {
        const itemTotal = item.quantity * item.unitPrice;
        subtotal += itemTotal;
        itemsHtml += `
          <div style="display:flex;justify-content:space-between;border-bottom:1px solid #eaeaea;padding:12px 0;font-size:14px;color:#333;">
            <div style="flex:1;">
              <p style="margin:0 0 4px 0;font-weight:600;color:#111;">${item.productName}</p>
              <p style="margin:0 0 4px 0;font-size:12px;color:#666;">${item.variantInfo}</p>
              <p style="margin:0;font-size:12px;color:#888;">SL: ${item.quantity} x ${new Intl.NumberFormat('vi-VN').format(item.unitPrice)}đ</p>
            </div>
            <div style="font-weight:600;color:#111;">${new Intl.NumberFormat('vi-VN').format(itemTotal)}đ</div>
          </div>
        `;
      });
    }

    const htmlContent = `
      <div style="font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;max-width:600px;margin:0 auto;padding:32px;background:#ffffff;border:1px solid #eaeaea;border-radius:12px;box-shadow:0 4px 24px rgba(0,0,0,0.04)">
        <div style="text-align:center;margin-bottom:32px">
          <h1 style="color:#000;font-size:24px;font-weight:800;margin:0;letter-spacing:-0.5px">H&M Phone Store</h1>
        </div>
        
        <h2 style="color:#111;font-size:20px;font-weight:600;margin:0 0 16px 0;text-align:center">Đơn hàng đã được xác nhận thành công! 🎉</h2>
        <p style="color:#444;font-size:15px;line-height:1.6;margin:0 0 16px 0">Xin chào <strong>${customerName}</strong>,</p>
        <p style="color:#444;font-size:15px;line-height:1.6;margin:0 0 24px 0">Đơn hàng <strong>${order.orderCode}</strong> của bạn đã được H&M Phone Store xác nhận thành công.<br><br>Cửa hàng đang chuẩn bị sản phẩm để giao đến bạn. Bạn có thể theo dõi tiến trình đơn hàng trực tiếp trên website.</p>
        
        <div style="background:#f9f9f9;padding:24px;border-radius:8px;margin-bottom:24px;text-align:center;">
          <h3 style="margin:0 0 12px 0;font-size:16px;color:#111;">Đơn hàng của bạn đang được xử lý</h3>
          <p style="margin:0;font-size:14px;color:#99e300;font-weight:bold;">Đã đặt hàng → Đã xác nhận ✅ → Đang chuẩn bị hàng → Đang giao → Đã giao</p>
        </div>

        <div style="background:#f9f9f9;padding:24px;border-radius:8px;margin-bottom:24px;">
          <h3 style="margin:0 0 16px 0;font-size:16px;color:#111;border-bottom:2px solid #99e300;display:inline-block;padding-bottom:4px;">Thông tin đơn hàng</h3>
          <p style="margin:0 0 8px 0;font-size:14px;color:#444;"><strong>Mã đơn hàng:</strong> ${order.orderCode}</p>
          <p style="margin:0 0 8px 0;font-size:14px;color:#444;"><strong>Ngày đặt hàng:</strong> ${orderDate}</p>
        </div>

        <div style="margin-bottom:24px;">
          <h3 style="margin:0 0 16px 0;font-size:16px;color:#111;border-bottom:2px solid #99e300;display:inline-block;padding-bottom:4px;">Sản phẩm</h3>
          ${itemsHtml}
        </div>
        
        <div style="background:#f9f9f9;padding:24px;border-radius:8px;margin-bottom:24px;font-size:14px;color:#333;">
          <div style="display:flex;justify-content:space-between;margin-bottom:8px;"><span style="color:#666;">Tạm tính:</span> <span>${new Intl.NumberFormat('vi-VN').format(subtotal)}đ</span></div>
          <div style="display:flex;justify-content:space-between;margin-bottom:8px;"><span style="color:#666;">Phí vận chuyển:</span> <span>${new Intl.NumberFormat('vi-VN').format(order.shippingFee || 0)}đ</span></div>
          ${order.discountAmount ? `<div style="display:flex;justify-content:space-between;margin-bottom:8px;"><span style="color:#666;">Giảm giá:</span> <span style="color:#ef4444;">-${new Intl.NumberFormat('vi-VN').format(order.discountAmount)}đ</span></div>` : ''}
          <div style="display:flex;justify-content:space-between;margin-top:16px;padding-top:16px;border-top:1px solid #eaeaea;font-weight:700;font-size:16px;color:#111;"><span>Tổng cộng:</span> <span style="color:#99e300;">${new Intl.NumberFormat('vi-VN').format(order.totalAmount)}đ</span></div>
          <div style="margin-top:16px;padding-top:16px;border-top:1px solid #eaeaea;">
            <p style="margin:0 0 8px 0;font-size:14px;color:#444;"><strong>Phương thức thanh toán:</strong> ${order.paymentMethod === 'COD' ? 'Thanh toán khi nhận hàng (COD)' : order.paymentMethod === 'BANK_TRANSFER' ? 'Thanh toán chuyển khoản' : order.paymentMethod}</p>
            <p style="margin:0;font-size:14px;color:#444;"><strong>Trạng thái thanh toán:</strong> ${order.paymentStatus === 'PAID' ? 'Đã thanh toán' : 'Chưa thanh toán'}</p>
          </div>
        </div>

        <div style="background:#f9f9f9;padding:24px;border-radius:8px;margin-bottom:24px;">
          <h3 style="margin:0 0 16px 0;font-size:16px;color:#111;border-bottom:2px solid #99e300;display:inline-block;padding-bottom:4px;">Thông tin giao hàng</h3>
          <p style="margin:0 0 8px 0;font-size:14px;color:#444;"><strong>Người nhận:</strong> ${recipientName}</p>
          <p style="margin:0 0 8px 0;font-size:14px;color:#444;"><strong>Số điện thoại giao hàng:</strong> ${escapeHtml(order.shippingPhone)}</p>
          <p style="margin:0;font-size:14px;color:#444;line-height:1.5;"><strong>Địa chỉ:</strong> ${escapeHtml(order.shippingAddress)}</p>
        </div>

        <div style="text-align:center;margin-bottom:32px;">
          <a href="${FRONTEND_URL}/profile/orders/${order.id}" style="display:inline-block;padding:14px 28px;background:#99e300;color:#000;font-weight:700;text-decoration:none;border-radius:8px;font-size:14px;letter-spacing:0.5px;">THEO DÕI ĐƠN HÀNG</a>
        </div>
        
        <div style="background:#fff8f8;padding:24px;border-radius:8px;margin-bottom:32px;">
          <h3 style="margin:0 0 12px 0;font-size:16px;color:#111;">Cần hỗ trợ?</h3>
          <p style="margin:0;font-size:14px;color:#444;line-height:1.6;">Nếu bạn có bất kỳ câu hỏi nào về đơn hàng, vui lòng liên hệ bộ phận hỗ trợ của H&M Phone Store hoặc truy cập trang Hỗ trợ trên website.</p>
        </div>

        <hr style="border:none;border-top:1px solid #eaeaea;margin:32px 0">
        <div style="text-align:center;color:#888;font-size:12px;line-height:1.6">
          <p style="margin:0 0 8px 0">Cảm ơn bạn đã tin tưởng và mua sắm tại H&M Phone Store.</p>
          <p style="margin:0 0 16px 0">Đây là email được gửi tự động, vui lòng không trả lời trực tiếp email này.</p>
          <p style="margin:0">H&M Phone Store<br>© ${currentYear} H&M Phone Store. All rights reserved.</p>
        </div>
      </div>
    `;

    transporter.sendMail({
      from: `"H&M Phone Store" <${process.env.SMTP_EMAIL}>`,
      to: customerEmail,
      subject: `[H&M Phone Store] Đơn hàng #${order.orderCode} đã được xác nhận`,
      html: htmlContent,
    }).then(() => {
      console.log(`Email "Order Confirmed" sent to ${customerEmail}`);
    }).catch((error) => {
      console.error('Error sending order confirmed email:', error);
    });
  } catch (error) {
    console.error('Error preparing order confirmed email:', error);
  }
};

export const sendPaymentSuccessEmail = async (order: any) => {
  try {
    const customerName = escapeHtml(order.customer?.fullName || 'Khách hàng');
    const recipientName = escapeHtml(order.recipientName?.trim() || order.customer?.fullName || 'Khách hàng');
    const customerEmail = order.customer?.email;
    if (!customerEmail) return;

    const currentYear = new Date().getFullYear();
    const orderDate = new Date(order.createdAt).toLocaleDateString('vi-VN', {
      hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric'
    });

    let itemsHtml = '';
    let subtotal = 0;
    if (order.items && order.items.length > 0) {
      order.items.forEach((item: any) => {
        const itemTotal = item.quantity * item.unitPrice;
        subtotal += itemTotal;
        itemsHtml += `
          <div style="display:flex;justify-content:space-between;border-bottom:1px solid #eaeaea;padding:12px 0;font-size:14px;color:#333;">
            <div style="flex:1;">
              <p style="margin:0 0 4px 0;font-weight:600;color:#111;">${item.productName}</p>
              <p style="margin:0 0 4px 0;font-size:12px;color:#666;">${item.variantInfo}</p>
              <p style="margin:0;font-size:12px;color:#888;">SL: ${item.quantity} x ${new Intl.NumberFormat('vi-VN').format(item.unitPrice)}đ</p>
            </div>
            <div style="font-weight:600;color:#111;">${new Intl.NumberFormat('vi-VN').format(itemTotal)}đ</div>
          </div>
        `;
      });
    }

    const htmlContent = `
      <div style="font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;max-width:600px;margin:0 auto;padding:32px;background:#ffffff;border:1px solid #eaeaea;border-radius:12px;box-shadow:0 4px 24px rgba(0,0,0,0.04)">
        <div style="text-align:center;margin-bottom:32px">
          <h1 style="color:#000;font-size:24px;font-weight:800;margin:0;letter-spacing:-0.5px">H&M Phone Store</h1>
        </div>
        
        <h2 style="color:#111;font-size:20px;font-weight:600;margin:0 0 16px 0;text-align:center">ĐẶT HÀNG THÀNH CÔNG</h2>
        <p style="color:#444;font-size:15px;line-height:1.6;margin:0 0 16px 0">Xin chào <strong>${customerName}</strong>,</p>
        <p style="color:#444;font-size:15px;line-height:1.6;margin:0 0 24px 0">Cảm ơn bạn đã mua hàng tại H&M Phone Store.<br><br>Chúng tôi đã xác nhận thanh toán thành công cho đơn hàng <strong>#${order.orderCode}</strong>.<br>Đơn hàng của bạn đã được tiếp nhận và đang được chuẩn bị để giao đến bạn.</p>
        
        <div style="background:#f9f9f9;padding:24px;border-radius:8px;margin-bottom:24px;">
          <h3 style="margin:0 0 16px 0;font-size:16px;color:#111;border-bottom:2px solid #99e300;display:inline-block;padding-bottom:4px;">THÔNG TIN ĐƠN HÀNG</h3>
          <p style="margin:0 0 8px 0;font-size:14px;color:#444;"><strong>Mã đơn hàng:</strong> ${order.orderCode}</p>
          <p style="margin:0 0 8px 0;font-size:14px;color:#444;"><strong>Ngày đặt hàng:</strong> ${orderDate}</p>
          <p style="margin:0 0 8px 0;font-size:14px;color:#444;"><strong>Trạng thái thanh toán:</strong> Đã thanh toán</p>
          <p style="margin:0 0 8px 0;font-size:14px;color:#444;"><strong>Phương thức thanh toán:</strong> Chuyển khoản ngân hàng</p>
        </div>

        <div style="margin-bottom:24px;">
          <h3 style="margin:0 0 16px 0;font-size:16px;color:#111;border-bottom:2px solid #99e300;display:inline-block;padding-bottom:4px;">SẢN PHẨM</h3>
          ${itemsHtml}
        </div>
        
        <div style="background:#f9f9f9;padding:24px;border-radius:8px;margin-bottom:24px;font-size:14px;color:#333;">
          <div style="display:flex;justify-content:space-between;margin-bottom:8px;"><span style="color:#666;">Tạm tính:</span> <span>${new Intl.NumberFormat('vi-VN').format(subtotal)}đ</span></div>
          <div style="display:flex;justify-content:space-between;margin-bottom:8px;"><span style="color:#666;">Phí vận chuyển:</span> <span>${new Intl.NumberFormat('vi-VN').format(order.shippingFee || 0)}đ</span></div>
          ${order.discountAmount ? `<div style="display:flex;justify-content:space-between;margin-bottom:8px;"><span style="color:#666;">Giảm giá:</span> <span style="color:#ef4444;">-${new Intl.NumberFormat('vi-VN').format(order.discountAmount)}đ</span></div>` : ''}
          <div style="display:flex;justify-content:space-between;margin-top:16px;padding-top:16px;border-top:1px solid #eaeaea;font-weight:700;font-size:16px;color:#111;"><span>TỔNG TIỀN:</span> <span style="color:#99e300;">${new Intl.NumberFormat('vi-VN').format(order.totalAmount)}đ</span></div>
        </div>

        <div style="background:#f9f9f9;padding:24px;border-radius:8px;margin-bottom:24px;">
          <h3 style="margin:0 0 16px 0;font-size:16px;color:#111;border-bottom:2px solid #99e300;display:inline-block;padding-bottom:4px;">THÔNG TIN GIAO HÀNG</h3>
          <p style="margin:0 0 8px 0;font-size:14px;color:#444;"><strong>Người nhận:</strong> ${recipientName}</p>
          <p style="margin:0 0 8px 0;font-size:14px;color:#444;"><strong>Số điện thoại giao hàng:</strong> ${escapeHtml(order.shippingPhone)}</p>
          <p style="margin:0;font-size:14px;color:#444;line-height:1.5;"><strong>Địa chỉ:</strong> ${escapeHtml(order.shippingAddress)}</p>
        </div>

        <div style="background:#f9f9f9;padding:24px;border-radius:8px;margin-bottom:32px;">
          <h3 style="margin:0 0 16px 0;font-size:16px;color:#111;border-bottom:2px solid #99e300;display:inline-block;padding-bottom:4px;">PHƯƠNG THỨC THANH TOÁN</h3>
          <p style="margin:0 0 8px 0;font-size:14px;color:#444;">Chuyển khoản ngân hàng</p>
          <p style="margin:0;font-size:14px;color:#444;"><strong>Trạng thái:</strong> Đã thanh toán</p>
        </div>

        <div style="text-align:center;margin-bottom:32px;">
          <a href="${FRONTEND_URL}/profile/orders/${order.id}" style="display:inline-block;padding:14px 28px;background:#99e300;color:#000;font-weight:700;text-decoration:none;border-radius:8px;font-size:14px;letter-spacing:0.5px;">XEM CHI TIẾT ĐƠN HÀNG</a>
          <p style="color:#666;font-size:14px;margin-top:16px;">Bạn có thể theo dõi trạng thái đơn hàng bằng cách nhấn vào nút bên trên.</p>
        </div>

        <hr style="border:none;border-top:1px solid #eaeaea;margin:32px 0">
        <div style="text-align:center;color:#888;font-size:12px;line-height:1.6">
          <p style="margin:0 0 8px 0">Cảm ơn bạn đã tin tưởng H&M Phone Store.</p>
          <p style="margin:0 0 16px 0">Đây là email được gửi tự động, vui lòng không trả lời trực tiếp email này.</p>
          <p style="margin:0">H&M Phone Store<br>© ${currentYear} H&M Phone Store. All rights reserved.</p>
        </div>
      </div>
    `;

    transporter.sendMail({
      from: `"H&M Phone Store" <${process.env.SMTP_EMAIL}>`,
      to: customerEmail,
      subject: `[H&M Phone Store] Thanh toán thành công đơn hàng #${order.orderCode}`,
      html: htmlContent,
    }).then(() => {
      console.log(`Email "Payment Success" sent to ${customerEmail}`);
    }).catch((error) => {
      console.error('Error sending payment success email:', error);
    });
  } catch (error) {
    console.error('Error preparing payment success email:', error);
  }
};

export const sendTrackingOtpEmail = async (customerEmail: string, customerName: string, orderCode: string, otp: string) => {
  try {
    const htmlContent = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px 24px; border: 1px solid #e5e7eb; border-radius: 16px; background-color: #ffffff; color: #1f2937;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h2 style="margin: 0; font-size: 20px; font-weight: 700; color: #111827;">TRA CỨU ĐƠN HÀNG</h2>
          <p style="margin: 6px 0 0; font-size: 13px; color: #6b7280;">Mã xác thực bảo mật tra cứu thông tin đơn hàng</p>
        </div>

        <p style="font-size: 15px; margin: 0 0 12px;">Xin chào <strong>${customerName}</strong>,</p>
        <p style="font-size: 14px; line-height: 1.6; color: #4b5563; margin: 0 0 20px;">
          Bạn vừa yêu cầu tra cứu thông tin và hành trình giao hàng cho mã đơn: <strong>#${orderCode}</strong>.
          Vui lòng nhập mã OTP dưới đây để hoàn tất bước xác thực bảo mật:
        </p>

        <div style="background-color: #f3f4f6; border-radius: 12px; padding: 20px; text-align: center; margin: 20px 0; border: 1px solid #e5e7eb;">
          <span style="font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #000000; font-family: ui-monospace, Menlo, Consolas, monospace;">${otp}</span>
          <p style="margin: 8px 0 0; font-size: 12px; color: #6b7280;">Mã xác thực có hiệu lực trong 5 phút</p>
        </div>

        <p style="font-size: 13px; line-height: 1.5; color: #6b7280; margin: 0 0 24px;">
          Vì lý do bảo mật quyền riêng tư cá nhân và thông tin đơn hàng, mã này chỉ cung cấp cho chủ sở hữu đơn hàng. Nếu bạn không yêu cầu tra cứu, xin hãy bỏ qua email này.
        </p>

        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
        <p style="font-size: 12px; color: #9ca3af; text-align: center; margin: 0;">H&M Phone Store • Hệ thống xác thực đơn hàng tự động</p>
      </div>
    `;

    if (!isEmailConfigured()) {
      trackingOtpDiagnostic('email_config', 'skipped');
      return;
    }

    trackingOtpDiagnostic('email_send', 'attempted');
    const result = await transporter.sendMail({
      from: `"H&M Phone Store" <${process.env.SMTP_EMAIL || 'no-reply@localhost'}>`,
      to: customerEmail,
      subject: `[H&M Phone Store] Mã xác thực OTP tra cứu đơn hàng #${orderCode}`,
      html: htmlContent,
    });
    const accepted = Array.isArray(result?.accepted) && result.accepted.length > 0;
    const rejected = Array.isArray(result?.rejected) && result.rejected.length > 0;
    trackingOtpDiagnostic('email_send', accepted ? 'accepted' : rejected ? 'rejected' : result?.messageId ? 'accepted' : 'completed');
  } catch (error) {
    trackingOtpDiagnostic('email_send', trackingEmailErrorCategory(error));
    console.error('Error sending tracking OTP email.');
  }
};
