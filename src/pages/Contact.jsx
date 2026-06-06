import React, { useState } from "react";
import { useToast } from "../context/ToastContext";
import { sendEmail } from "../api/auth";

const faqs = [
{
  question: "Tôi có thể hủy vé và hoàn tiền như thế nào?",
  answer: "Bạn có thể vào mục 'Vé của tôi' trong Hồ sơ cá nhân để yêu cầu hủy vé. Số tiền hoàn lại sẽ phụ thuộc vào chính sách của từng nhà xe và thời điểm bạn báo hủy."
},
{
  question: "Làm sao để xuất hóa đơn VAT?",
  answer: "Khi đặt vé, bạn hãy tick vào mục 'Yêu cầu xuất hóa đơn' và điền đầy đủ thông tin công ty. Hóa đơn điện tử sẽ được gửi về email của bạn sau khi chuyến đi hoàn tất."
},
{
  question: "Tôi bị lỡ chuyến xe thì có được hỗ trợ đổi vé không?",
  answer: "Trường hợp lỡ chuyến do lỗi chủ quan của hành khách, nhà xe thường không hỗ trợ đổi trả vé. Tuy nhiên, bạn vui lòng gọi ngay Hotline để chúng tôi tìm cách hỗ trợ tốt nhất có thể."
},
{
  question: "BusGo có hỗ trợ đón trả tận nơi không?",
  answer: "Nhiều nhà xe trên BusGo có dịch vụ xe trung chuyển đưa rước tận nơi miễn phí. Bạn vui lòng kiểm tra kỹ điểm đón/trả hoặc ghi chú yêu cầu trung chuyển khi đặt vé."
}];


export default function Contact() {
  const { addToast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await sendEmail({
        to: formData.email,
        subject: `[BusGo] Xác nhận tiếp nhận thông tin liên hệ: ${formData.subject}`,
        text: `Chào ${formData.name},\n\nCảm ơn bạn đã liên hệ với BusGo. Chúng tôi đã tiếp nhận thông tin của bạn với nội dung sau:\n\n---\nChủ đề: ${formData.subject}\nSố điện thoại: ${formData.phone}\nNội dung:\n${formData.message}\n---\n\nĐội ngũ hỗ trợ của chúng tôi sẽ liên hệ lại với bạn trong thời gian sớm nhất.\n\nTrân trọng,\nĐội ngũ hỗ trợ BusGo`,
        template: "default",
        params: {}
      });

      addToast("Cảm ơn bạn đã liên hệ! Tin nhắn của bạn đã được gửi thành công, chúng tôi sẽ phản hồi sớm nhất.", "success");
      setFormData({ name: "", email: "", phone: "", subject: "", message: "" });
    } catch (err) {
      console.error("Lỗi gửi email liên hệ:", err);
      addToast("Có lỗi xảy ra khi gửi email, nhưng thông tin đã được ghi nhận.", "warning");
      setFormData({ name: "", email: "", phone: "", subject: "", message: "" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-surface min-h-screen pb-20">
      {}
      <section className="relative pt-32 pb-32 overflow-hidden bg-primary">
        <div className="absolute inset-0 z-0">
          <img
            className="w-full h-full object-cover opacity-30"
            src="https://images.unsplash.com/photo-1423666639041-f56000c27a9a?auto=format&fit=crop&q=80&w=2000"
            alt="Contact us background" />
          
          <div className="absolute inset-0 bg-gradient-to-t from-primary to-transparent opacity-90"></div>
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-6 text-center">
          <h1 className="text-4xl md:text-6xl font-black text-white mb-6 tracking-tight drop-shadow-md">
            Liên hệ với BusGo
          </h1>
          <p className="text-white/90 text-lg md:text-xl font-medium max-w-2xl mx-auto drop-shadow">
            Chúng tôi luôn ở đây để lắng nghe, hỗ trợ và đồng hành cùng bạn trên mọi nẻo đường. Đừng ngần ngại liên hệ nếu bạn cần giúp đỡ.
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-6 -mt-16 relative z-20">
        {}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          <div className="bg-white p-8 rounded-3xl shadow-editorial text-center transform hover:-translate-y-2 transition-transform duration-300">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6 text-primary">
              <span className="material-symbols-outlined text-4xl">location_on</span>
            </div>
            <h3 className="text-xl font-bold mb-3 text-on-surface">Văn phòng đại diện</h3>
            <p className="text-on-surface-variant leading-relaxed">
              33 Xô Viết Nghệ Tĩnh, Hòa Cường, Đà Nẵng 550000, Việt Nam
            </p>
          </div>

          <div className="bg-white p-8 rounded-3xl shadow-editorial text-center transform hover:-translate-y-2 transition-transform duration-300 border-2 border-primary/20">
            <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-6 text-white shadow-lg shadow-primary/30">
              <span className="material-symbols-outlined text-4xl">support_agent</span>
            </div>
            <h3 className="text-xl font-bold mb-3 text-on-surface">Tổng đài hỗ trợ</h3>
            <p className="text-2xl font-black text-primary mb-1">1900 6868</p>
            <p className="text-on-surface-variant text-sm">Trực tổng đài 24/7 (Phím 1)</p>
          </div>

          <div className="bg-white p-8 rounded-3xl shadow-editorial text-center transform hover:-translate-y-2 transition-transform duration-300">
            <div className="w-16 h-16 bg-secondary/10 rounded-2xl flex items-center justify-center mx-auto mb-6 text-secondary">
              <span className="material-symbols-outlined text-4xl">mail</span>
            </div>
            <h3 className="text-xl font-bold mb-3 text-on-surface">Email hỗ trợ</h3>
            <p className="text-lg font-bold text-secondary mb-1">support@busgo.vn</p>
            <p className="text-on-surface-variant text-sm">Phản hồi trong vòng 24 giờ làm việc</p>
          </div>
        </div>

        {}
        <div className="bg-white rounded-3xl shadow-editorial overflow-hidden mb-16">
          <div className="grid grid-cols-1 lg:grid-cols-2">
            {}
            <div className="p-10 lg:p-12 bg-surface-container-lowest">
              <div className="mb-8">
                <h2 className="text-3xl font-black text-on-surface mb-2">Gửi tin nhắn cho chúng tôi</h2>
                <div className="w-16 h-1.5 bg-primary-container rounded-full mb-4"></div>
                <p className="text-on-surface-variant">Bạn có thắc mắc, phản hồi hoặc cần hỗ trợ đặc biệt? Hãy gửi tin nhắn ngay tại đây.</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-outline mb-2 block">Họ và tên *</label>
                    <input required type="text" name="name" value={formData.name} onChange={handleChange} className="w-full bg-surface border border-outline-variant/50 rounded-xl p-3.5 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" placeholder="Nhập tên của bạn" />
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-outline mb-2 block">Số điện thoại *</label>
                    <input required type="tel" name="phone" value={formData.phone} onChange={handleChange} className="w-full bg-surface border border-outline-variant/50 rounded-xl p-3.5 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" placeholder="Nhập SĐT liên lạc" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-outline mb-2 block">Email *</label>
                    <input required type="email" name="email" value={formData.email} onChange={handleChange} className="w-full bg-surface border border-outline-variant/50 rounded-xl p-3.5 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" placeholder="Nhập Email" />
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-outline mb-2 block">Tiêu đề *</label>
                    <input required type="text" name="subject" value={formData.subject} onChange={handleChange} className="w-full bg-surface border border-outline-variant/50 rounded-xl p-3.5 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" placeholder="Ví dụ: Lỗi thanh toán" />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-outline mb-2 block">Nội dung chi tiết *</label>
                  <textarea required rows="4" name="message" value={formData.message} onChange={handleChange} className="w-full bg-surface border border-outline-variant/50 rounded-xl p-3.5 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none" placeholder="Vui lòng mô tả chi tiết vấn đề của bạn..."></textarea>
                </div>

                <button disabled={isSubmitting} type="submit" className="w-full bg-primary text-white py-4 rounded-xl font-bold text-lg hover:bg-primary/90 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed">
                  {isSubmitting ?
                  <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Đang gửi...
                    </> :

                  <>
                      <span className="material-symbols-outlined">send</span>
                      Gửi tin nhắn ngay
                    </>
                  }
                </button>
              </form>
            </div>

            {}
            <div className="min-h-[400px] lg:min-h-full w-full bg-gray-200 relative">
              <iframe
                src="https://maps.google.com/maps?q=33%20X%C3%B4%20Vi%E1%BA%BFt%20Ngh%E1%BB%87%20T%C4%A9nh,%20H%C3%B2a%20C%C6%B0%E1%BB%9Dng,%20%C4%90%C3%A0%20N%E1%BA%B5ng%20550000,%20Vi%E1%BB%87t%20Nam&t=&z=16&ie=UTF8&iwloc=&output=embed"
                className="absolute inset-0 w-full h-full border-0"
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Bản đồ văn phòng BusGo">
              </iframe>
            </div>
          </div>
        </div>

        {}
        <div className="bg-surface-container-low rounded-3xl p-10 lg:p-16 border border-surface-container/50">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-black text-on-surface mb-4">Các câu hỏi thường gặp (FAQ)</h2>
            <p className="text-on-surface-variant max-w-2xl mx-auto">Vui lòng kiểm tra các câu hỏi bên dưới xem có đúng vấn đề bạn đang gặp phải không trước khi liên hệ tổng đài nhé.</p>
          </div>

          <div className="max-w-3xl mx-auto space-y-4">
            {faqs.map((faq, index) =>
            <div key={index} className="bg-white border border-outline-variant/30 rounded-2xl overflow-hidden transition-all duration-300">
                <button
                onClick={() => setOpenFaq(openFaq === index ? null : index)}
                className="w-full flex items-center justify-between p-6 text-left hover:bg-surface-container-lowest focus:outline-none">
                
                  <span className="font-bold text-lg text-on-surface pr-4">{faq.question}</span>
                  <div className={`w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 transition-transform duration-300 ${openFaq === index ? 'rotate-180 bg-primary text-white' : 'text-primary'}`}>
                    <span className="material-symbols-outlined text-sm">expand_more</span>
                  </div>
                </button>
                <div className={`px-6 overflow-hidden transition-all duration-300 ease-in-out ${openFaq === index ? 'max-h-40 pb-6 opacity-100' : 'max-h-0 opacity-0'}`}>
                  <p className="text-on-surface-variant border-t border-outline-variant/20 pt-4">{faq.answer}</p>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>);

}