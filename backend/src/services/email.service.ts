import dotenv from 'dotenv';
import { mailer } from './mailer';

dotenv.config();

const transporter = mailer;

export const sendOrderReceivedEmail = async (order: any) => {
  try {
    const customerName = order.customer?.fullName || 'Khách hàng';
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
          <p style="margin:0 0 8px 0;font-size:14px;color:#444;"><strong>Người nhận:</strong> ${customerName}</p>
          <p style="margin:0 0 8px 0;font-size:14px;color:#444;"><strong>Số điện thoại:</strong> ${order.shippingPhone}</p>
          <p style="margin:0;font-size:14px;color:#444;line-height:1.5;"><strong>Địa chỉ:</strong> ${order.shippingAddress}</p>
        </div>

        <div style="background:#f9f9f9;padding:24px;border-radius:8px;margin-bottom:32px;">
          <h3 style="margin:0 0 16px 0;font-size:16px;color:#111;border-bottom:2px solid #99e300;display:inline-block;padding-bottom:4px;">Phương thức thanh toán</h3>
          <p style="margin:0 0 8px 0;font-size:14px;color:#444;">${order.paymentMethod === 'COD' ? 'Thanh toán khi nhận hàng (COD)' : order.paymentMethod === 'BANK_TRANSFER' ? 'Thanh toán chuyển khoản' : order.paymentMethod}</p>
          <p style="margin:0;font-size:14px;color:#444;"><strong>Trạng thái thanh toán:</strong> ${order.paymentStatus === 'PAID' ? 'Đã thanh toán' : 'Chưa thanh toán'}</p>
        </div>

        <div style="text-align:center;margin-bottom:32px;">
          <p style="color:#666;font-size:14px;margin-bottom:16px;">Bạn có thể theo dõi trạng thái đơn hàng trực tiếp trên website H&M Phone Store.</p>
          <a href="${process.env.VITE_APP_URL || 'http://localhost:3000'}/profile" style="display:inline-block;padding:14px 28px;background:#99e300;color:#000;font-weight:700;text-decoration:none;border-radius:8px;font-size:14px;letter-spacing:0.5px;">XEM CHI TIẾT ĐƠN HÀNG</a>
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
    const customerName = order.customer?.fullName || 'Khách hàng';
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

        <div style="text-align:center;margin-bottom:32px;">
          <a href="${process.env.VITE_APP_URL || 'http://localhost:3000'}/profile" style="display:inline-block;padding:14px 28px;background:#99e300;color:#000;font-weight:700;text-decoration:none;border-radius:8px;font-size:14px;letter-spacing:0.5px;">THEO DÕI ĐƠN HÀNG</a>
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
