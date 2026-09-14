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
