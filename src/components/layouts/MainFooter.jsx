import React from "react";

const MainFooter = () => {
  return (
    <footer id="footer" className="w-full rounded-t-3xl mt-auto bg-gray-50">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-12 px-8 py-16 max-w-7xl mx-auto text-sm leading-6">
        {/* Brand */}
        <div>
          <div className="flex items-center gap-2 mb-6">
            <img src="/img/busgo.jpg" alt="BusGo" className="h-16 mix-blend-multiply" />
            <span className="text-xl font-bold text-primary">Bus Go</span>
          </div>
          <p className="text-gray-500 mb-6">
            Nền tảng đặt vé xe khách trực tuyến hàng đầu Việt Nam, giúp bạn kết nối với hàng nghìn hành trình mỗi ngày.
          </p>
          <div className="flex space-x-4">
            <a href="#" className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-all">
              <span className="material-symbols-outlined">public</span>
            </a>
            <a href="#" className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-all">
              <span className="material-symbols-outlined">phone</span>
            </a>
          </div>
        </div>

        {/* Dịch vụ */}
        <div>
          <h4 className="font-bold text-on-surface mb-6">Dịch vụ</h4>
          <ul className="space-y-4">
            <li>
              <a href="#" className="text-gray-500 hover:text-secondary transition-colors">Về chúng tôi</a>
            </li>
            <li>
              <a href="#" className="text-gray-500 hover:text-secondary transition-colors">Đăng ký nhà xe</a>
            </li>
            <li>
              <a href="#" className="text-gray-500 hover:text-secondary transition-colors">Hướng dẫn đặt vé</a>
            </li>
          </ul>
        </div>

        {/* Pháp lý */}
        <div>
          <h4 className="font-bold text-on-surface mb-6">Pháp lý</h4>
          <ul className="space-y-4">
            <li>
              <a href="#" className="text-gray-500 hover:text-secondary transition-colors">Điều khoản</a>
            </li>
            <li>
              <a href="#" className="text-gray-500 hover:text-secondary transition-colors">Chính sách</a>
            </li>
            <li>
              <a href="#" className="text-gray-500 hover:text-secondary transition-colors">Hỗ trợ</a>
            </li>
          </ul>
        </div>

        {/* Liên hệ */}
        <div>
          <h4 className="font-bold text-on-surface mb-6">Liên hệ</h4>
          <ul className="space-y-4 text-gray-500">
            <li className="flex items-start gap-3">
              <span className="material-symbols-outlined text-primary">mail</span>
              <span>hotro@busgo.vn</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="material-symbols-outlined text-primary">call</span>
              <span>1900 6789</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="material-symbols-outlined text-primary">location_on</span>
              <span>Số 123, Đường Lê Lợi, Quận 1, TP. HCM</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Copyright */}
      <div className="max-w-7xl mx-auto px-8 pb-12 border-t border-outline-variant/20 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
        <p className="text-gray-500 text-sm">
          © 2024 BusGo. Tất cả quyền được bảo lưu.
        </p>
      </div>
    </footer>
  );
};

export default MainFooter;
