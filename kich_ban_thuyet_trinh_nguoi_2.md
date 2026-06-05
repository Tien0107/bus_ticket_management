# KỊCH BẢN THUYẾT TRÌNH CHI TIẾT: NGƯỜI THỨ 2
**Đề tài:** Xây dựng phần mềm quản lý bán vé xe khách BusGo  
**Thời gian nói dự kiến:** ~4 phút  
**Phụ trách Slide:** Slide 6, 7, 8, 9 & Slide 14  

---

## 1. LỜI MỞ ĐẦU & CHUYỂN TIẾP (~30 giây)
*(Bắt đầu nói ngay khi Người thứ 1 vừa dứt lời và nhường mic)*

> *"Em xin cảm ơn phần trình bày mở đầu rất rõ ràng của bạn **[Tên Người 1]**.*
> 
> *Kính thưa Hội đồng cùng quý thầy cô giáo, để hiện thực hóa các mục tiêu và giải quyết những bất cập thực tiễn mà bạn **[Tên Người 1]** vừa nêu ở trên, nhóm chúng em đã nghiên cứu sâu sắc và xây dựng một nền tảng kỹ thuật vững chắc. Sau đây, em xin phép được trình bày chi tiết về **Cơ sở lý thuyết** và **Công nghệ phát triển** của dự án BusGo."*

---

## 2. SLIDE 6: KIẾN TRÚC HỆ THỐNG (~45 giây)
*(Nhìn lên slide hoặc chỉ vào sơ đồ kiến trúc 3 lớp)*

> *"Đầu tiên là về **Kiến trúc hệ thống**, nhóm chúng em lựa chọn mô hình **Kiến trúc 3 lớp (3-Tier Architecture)** chuẩn hóa, bao gồm:*
> 
> * **Lớp giao diện (Presentation Layer):** Nơi tương tác trực tiếp với khách hàng và quản trị viên thông qua trình duyệt.*
> * **Lớp xử lý nghiệp vụ (Application Layer):** Đảm nhận việc xử lý logic, tính toán giá vé, quản lý ghế ngồi và điều phối luồng dữ liệu.*
> * **Và Lớp dữ liệu (Database Layer):** Nơi lưu trữ thông tin cấu trúc của toàn bộ hệ thống.*
> 
> *Việc tách biệt rõ ràng 3 lớp này mang lại hai lợi thế cốt lõi cho dự án: Một là **khả năng mở rộng độc lập** – chúng em có thể nâng cấp công nghệ giao diện mà không làm ảnh hưởng đến dữ liệu; Hai là **tăng cường tính bảo mật**, ngăn chặn các truy cập trực tiếp và trái phép từ phía người dùng vào cơ sở dữ liệu."*

---

## 3. SLIDE 7: CÔNG NGHỆ BACKEND & CƠ SỞ DỮ LIỆU (~60 giây)
*(Nhấn mạnh tính tối ưu hiệu năng của hệ thống)*

> *"Đi sâu vào phần công nghệ triển khai Backend, chúng em sử dụng **Node.js** làm môi trường chạy ứng dụng nhờ khả năng xử lý bất đồng bộ mạnh mẽ.*
> 
> *Thay vì sử dụng ExpressJS truyền thống, nhóm đã quyết định chọn **Fastify** làm Web Framework chủ đạo. Fastify nổi bật với hiệu năng xử lý request cực kỳ nhanh, tiêu tốn ít tài nguyên phần cứng và hỗ trợ cấu trúc Schema Validation rất chặt chẽ, giúp tối ưu hóa thời gian phản hồi của hệ thống khi có lượng truy cập lớn đặt vé cùng lúc.*
> 
> *Về phần lưu trữ, chúng em lựa chọn hệ quản trị cơ sở dữ liệu quan hệ **PostgreSQL** để quản lý các thực thể có mối quan hệ chặt chẽ như Lịch trình, Chuyến xe và Vé đặt. Chúng em kết hợp với **Knex.js** làm Query Builder giúp viết các câu lệnh truy vấn SQL một cách mạch lạc, an toàn trước lỗi SQL Injection và dễ dàng quản lý database migration."*

---

## 4. SLIDE 8: CÔNG NGHỆ FRONTEND (~45 giây)
*(Giải thích lý do lựa chọn song song hai framework)*

> *"Kính thưa thầy cô, điểm đặc biệt trong dự án của chúng em là sự kết hợp linh hoạt giữa hai công nghệ Frontend hàng đầu hiện nay:*
> 
> * **Với trang Client dành cho khách hàng tìm kiếm và đặt vé:** Nhóm lựa chọn **ReactJS**. Cơ chế Virtual DOM và các React Hook giúp trang web phản hồi cực kỳ nhanh, mượt mà khi khách hàng chọn ghế ngồi thời gian thực, đồng thời tối ưu hóa SEO tốt hơn.*
> * **Với trang Dashboard dành cho đối tác nhà xe và người quản trị:** Nhóm lại ưu tiên sử dụng **Angular**. Angular cung cấp một cấu trúc MVC chặt chẽ, có sẵn các bộ công cụ quản lý state mạnh mẽ và cơ chế Double-binding data rất phù hợp để xây dựng các hệ thống quản trị dữ liệu quy mô lớn, nhiều bảng biểu thống kê phức tạp."*

---

## 5. SLIDE 9: BẢO MẬT & DỊCH VỤ TÍCH HỢP (~45 giây)
*(Trình bày các giải pháp bổ trợ)*

> *"Để hệ thống vận hành an toàn và chuyên nghiệp, nhóm chúng em đã tích hợp các giải pháp bảo mật và dịch vụ đám mây tiên tiến, bao gồm:*
> 
> * **Về bảo mật:** Mật khẩu người dùng được băm mã hóa một chiều bằng thư viện **Bcrypt** trước khi lưu vào database. Quá trình xác thực và phân quyền giữa các vai trò (Khách hàng, Nhà xe, Admin) được quản lý an toàn thông qua **JSON Web Token (JWT)**.*
> * **Về dịch vụ:** Chúng em tích hợp dịch vụ **Cloudinary** để lưu trữ và tối ưu hóa hình ảnh xe khách, logo nhà xe; tích hợp dịch vụ **Resend** để tự động gửi Email OTP xác thực tài khoản nhanh chóng; và toàn bộ mã nguồn Frontend được deploy trực tiếp lên nền tảng **Vercel** để chạy thử nghiệm thực tế."*

---

## 6. SLIDE 14: CÔNG CỤ PHÁT TRIỂN & CHUYỂN TIẾP (~30 giây)
*(Kết thúc phần nói và nhường lượt)*

> *"Cuối cùng, trong suốt quá trình phát triển dự án, nhóm chúng em đã sử dụng các công cụ bổ trợ như **Visual Studio Code** để lập trình; ứng dụng **Swagger UI** để thiết kế và kiểm thử các tài liệu API giúp đội ngũ Frontend và Backend kết nối trơn tru; cùng hệ thống kiểm soát phiên bản **Git và GitHub** để quản lý và đồng bộ mã nguồn.*
> 
> *Kính thưa thầy cô, với một nền tảng công nghệ tối ưu và cấu trúc hệ thống rõ ràng như vậy, quy trình nghiệp vụ chi tiết và sơ đồ thiết kế hệ thống được hiện thực hóa ra sao? Sau đây, em xin phép kính mời bạn **[Tên Người 3]** tiếp tục trình bày phần **Phân tích yêu cầu và Thiết kế hệ thống**.*
> 
> *Em xin chân thành cảm ơn thầy cô đã lắng nghe phần trình bày của em!"*

---

### 💡 MẸO NHỎ KHI THUYẾT TRÌNH:
1. **Tốc độ nói:** Nói vừa phải, rõ chữ, tránh nói quá nhanh. Hãy dừng lại khoảng 1 giây sau mỗi lần chuyển tiếp ý quan trọng.
2. **Ngôn ngữ cơ thể:** Khi nhắc đến công nghệ nào (ví dụ *Fastify*, *PostgreSQL*, *ReactJS*...), hãy dùng tay hoặc bút chỉ slide hướng về biểu tượng logo của công nghệ đó trên màn hình chiếu để Hội đồng dễ theo dõi.
