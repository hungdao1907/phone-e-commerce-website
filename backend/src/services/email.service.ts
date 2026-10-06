import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_EMAIL,
    pass: process.env.SMTP_PASSWORD,
  },
});

export const sendOrderReceivedEmail = async (customerEmail: string, customerName: string, orderCode: string) => {
  try {
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #333; text-align: center;">Cảm ơn bạn đã đặt hàng tại AppleWeb!</h2>
        <p>Xin chào <strong>${customerName}</strong>,</p>
        <p>Chúng tôi đã nhận được yêu cầu đặt hàng của bạn với mã đơn hàng: <strong>${orderCode}</strong>.</p>
        <p>Hiện tại, đơn hàng của bạn đang được xử lý. Sẽ có nhân viên chăm sóc khách hàng của chúng tôi liên hệ với bạn trong vài phút tới để xác nhận lại thông tin đơn hàng và địa chỉ giao hàng.</p>
        <p>Vui lòng để ý điện thoại để quá trình xác nhận được diễn ra nhanh chóng.</p>
        <p>Xin chân thành cảm ơn bạn đã tin tưởng và mua sắm tại cửa hàng của chúng tôi!</p>
        <hr style="border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="font-size: 12px; color: #888; text-align: center;">Đây là email tự động, vui lòng không trả lời email này.</p>
      </div>
    `;

    await transporter.sendMail({
      from: `"AppleWeb Store" <${process.env.SMTP_EMAIL}>`,
      to: customerEmail,
      subject: `[AppleWeb] Xác nhận yêu cầu đặt hàng #${orderCode}`,
      html: htmlContent,
    });
    console.log(`Email "Order Received" sent to ${customerEmail}`);
  } catch (error) {
    console.error('Error sending order received email:', error);
  }
};

export const sendOrderConfirmedEmail = async (customerEmail: string, customerName: string, orderCode: string, estimatedDelivery: Date | null) => {
  try {
    const deliveryDateText = estimatedDelivery 
      ? new Date(estimatedDelivery).toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
      : '3-5 ngày làm việc';
      
    // Dummy driver info for now
    const carrier = "Giao Hàng Nhanh (GHN)";
    const driverName = "Nguyễn Văn Tuấn";
    const driverPhone = "0901234567";

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h2 style="color: #10B981; margin: 0;">Đơn hàng đã được xác nhận thành công! 🎉</h2>
        </div>
        <p>Xin chào <strong>${customerName}</strong>,</p>
        <p>Tuyệt vời! Đơn hàng <strong>${orderCode}</strong> của bạn đã được xác nhận và đang trong quá trình đóng gói để giao đến bạn.</p>
        
        <div style="background-color: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #374151;">Thông tin giao hàng</h3>
          <p style="margin-bottom: 8px;"><strong>Đơn vị vận chuyển:</strong> ${carrier}</p>
          <p style="margin-bottom: 8px;"><strong>Tên Shipper:</strong> ${driverName}</p>
          <p style="margin-bottom: 8px;"><strong>SĐT Shipper:</strong> ${driverPhone}</p>
          <p style="margin-bottom: 0;"><strong>Thời gian dự kiến nhận:</strong> ${deliveryDateText}</p>
        </div>

        <p>Bạn có thể theo dõi hành trình đơn hàng trực tiếp trên website của chúng tôi.</p>
        
        <h3 style="color: #374151; margin-top: 30px;">Hỗ trợ & Khiếu nại</h3>
        <p>Sau khi nhận hàng, nếu có bất kỳ vấn đề gì về sản phẩm (hư hỏng, sai mẫu mã, lỗi kỹ thuật...), xin đừng vội lo lắng. Hãy truy cập vào phần <strong>Giỏ hàng / Lịch sử đơn hàng</strong> của bạn trên website để thực hiện <strong>Đánh giá</strong> hoặc <strong>Khiếu nại</strong>.</p>
        <p>Đội ngũ của chúng tôi luôn sẵn sàng hỗ trợ và giải quyết mọi vấn đề để đảm bảo quyền lợi tốt nhất cho bạn.</p>
        
        <p style="margin-top: 30px;">Cảm ơn bạn đã đồng hành cùng AppleWeb!</p>
        
        <hr style="border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="font-size: 12px; color: #888; text-align: center;">Đây là email tự động, vui lòng không trả lời email này.</p>
      </div>
    `;

    await transporter.sendMail({
      from: `"AppleWeb Store" <${process.env.SMTP_EMAIL}>`,
      to: customerEmail,
      subject: `[AppleWeb] Đơn hàng #${orderCode} đã được xác nhận và đang giao`,
      html: htmlContent,
    });
    console.log(`Email "Order Confirmed" sent to ${customerEmail}`);
  } catch (error) {
    console.error('Error sending order confirmed email:', error);
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
        <p style="font-size: 12px; color: #9ca3af; text-align: center; margin: 0;">AppleWeb Store • Hệ thống xác thực đơn hàng tự động</p>
      </div>
    `;

    if (process.env.SMTP_EMAIL && process.env.SMTP_PASSWORD) {
      await transporter.sendMail({
        from: `"AppleWeb Store" <${process.env.SMTP_EMAIL}>`,
        to: customerEmail,
        subject: `[AppleWeb] Mã xác thực OTP tra cứu đơn hàng #${orderCode}`,
        html: htmlContent,
      });
      console.log(`[Email Service] Tracking OTP sent to ${customerEmail}`);
    } else {
      console.log(`[Email Service - Dev fallback] Tracking OTP for Order #${orderCode} sent to ${customerEmail}: ${otp}`);
    }
  } catch (error) {
    console.error('Error sending tracking OTP email:', error);
  }
};

