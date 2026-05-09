# Cẩm Nang Sử Dụng DBeaver & Quản Lý Dữ Liệu Backend 🐘

Tài liệu này tổng hợp lại toàn bộ các câu hỏi và cách xử lý thao tác với Cơ sở dữ liệu (Database) từ máy tính cá nhân bằng phần mềm DBeaver.

---

### ❓ Câu 1: Backend cho thông tin kết nối Database, làm sao để xem dữ liệu có giao diện?
**Trả lời:** 
1. Tải phần mềm **DBeaver** (hoặc TablePlus).
2. Tạo kết nối mới (Biểu tượng phích cắm `+`), chọn **PostgreSQL**.
3. Điền đúng các thông số được cấp vào Tab Main:
   - **Host:** VD: `my-server.serveminecraft.net`
   - **Port:** `5433`
   - **Database / Username / Password:** (Nhập đúng thông tin được cấp).
4. Bấm **Test Connection**. Báo `Connected` là thành công. 

---

### ❓ Câu 2: Khi Test Connection gặp lỗi bảng đỏ: `FATAL: invalid value for parameter "TimeZone": "Asia/Saigon"`?
**Trả lời:** 
Lỗi này do PostgreSQL bản mới không còn dùng tên múi giờ cũ là `Asia/Saigon` nữa, máy tính bạn gửi lên bị lỗi. Có 2 cách sửa:

* **Cách 1: Sửa file `dbeaver.ini` (Khuyên dùng, sạch lỗi vĩnh viễn):**
  - Mở thư mục cài đặt DBeaver (VD: `C:\Program Files\DBeaver`).
  - Copy file `dbeaver` có Type là `Configuration settings` ra màn hình Desktop.
  - Chuột phải -> Open with Notepad.
  - Kéo xuống dưới cùng và thêm dòng ` -Duser.timezone=Asia/Ho_Chi_Minh`
  - Lưu Notepad, copy Ghi đè vào lại thư mục DBeaver.
* **Cách 2: Cài ngay trong DBeaver:**
  - Ở bảng Connection Settings -> Chọn tab **Driver properties**.
  - Bấm nút `+` (dấu cộng xanh góc dưới trái danh sách) để Add new property.
  - Name nhập: `options` | Value nhập: `-c timezone=Asia/Ho_Chi_Minh`
  - Lưu và Test Connection lại.

---

### ❓ Câu 3: Chữ `[NULL]` trong các ô dữ liệu trên DBeaver là sao? Có lỗi không?
**Trả lời:** 
Không phải lỗi. **`[NULL]`** trong cơ sở dữ liệu có nghĩa là **"Trống rỗng"**. 
Nó xuất hiện ở các cột không bắt buộc phải điền dữ liệu (Ví dụ: số CCCD, Phòng ban, ngày bắt đầu làm việc...). Đây là hiển thị bình thường.

---

### ❓ Câu 4: Làm sao biết có những nhà xe nào trong hệ thống?
**Trả lời:** 
- Bạn tìm đến thư mục Schemas có tên **`organization`**.
- Mở thư mục **`Tables`** -> Nháy đúp vào bảng **`bus_company`**.
- Chuyển sang Tab **Data** bên phải. Cột `id` và `name` chính là danh sách ID và tên của toàn bộ nhà xe đang có trong hệ thống.

---

### ❓ Câu 5: Hệ thống tài khoản Nhân viên Support (Hỗ trợ) và Nhà xe thiết kế thế nào?
**Trả lời:** 
- Đây là hệ thống nhiều nhà xe dùng chung (Multi-tenant). Nhân viên Support bắt buộc phải trực thuộc 1 Nhà Xe (có `company_id`).
- Lộ trình: Nhân viên Đăng ký trên Web -> Tài khoản tạo ra với trạng thái `inactive` (Treo chờ duyệt) -> Admin Công ty duyệt thành `active` -> Nhân viên mới đăng nhập và làm việc được.
- Thông tin lưu ở 2 bảng:
  1. `auth.user`: Chứa ID tài khoản, Username, Password, và `role="admin"`.
  2. `auth.staff_profile`: Chi tiết nhân viên, chứa `company_id`, `role="support"`, `status="..."`.

---

### ❓ Câu 6: Tính năng "Duyệt" trên Web chưa có, làm sao tôi duyệt nhanh tài khoản mới bằng DBeaver?
**Trả lời:** 
1. Mở Schemas **`auth`** -> Bảng **`staff_profile`** -> Sang tab **Data**.
2. Tìm dòng của nhân viên mới tinh. Cột `status` của họ đang bị gán chữ `inactive`.
3. Nháy đúp vào chữ `inactive` đó, gõ thành **`active`**, ấn Enter.
4. Bấm nút **Save (đĩa mềm)** ở góc dưới để lưu vào Database. Tài khoản lập tức sử dụng được ngay!

---

### ❓ Câu 7: Làm sao xem riêng Vé / Khuyến mãi của riêng 1 nhà xe bất kỳ?
**Trả lời:** 
Ví dụ muốn xem Khuyến mãi của nhà xe số 1:
1. Mở bảng `booking.coupon`. Chuyển sang tab **Data**.
2. Dùng thanh trống ở ngay phía trên cùng (Bar ghi chữ: *"Enter a SQL expression to filter results"*).
3. Gõ câu lệnh: **`company_id = 1`**
4. Bấm **Enter**. Bảng sẽ lọc lại chỉ hiện danh sách của nhà xe đó. (Làm tương tự với bảng Vé `booking.ticket` nếu có trường `company_id`).

---

### ❓ Câu 8: Tôi muốn đổi tài khoản Support của tôi (để nhìn thấy dữ liệu của nhà xe khác) thì làm sao?
**Trả lời:** 
1. Vào `organization.bus_company` chọn lấy một số `id` nhà xe bạn thích (Ví dụ 26).
2. Vào `auth.staff_profile` -> Tab **Data** -> Tìm đến dòng tài khoản của bạn.
3. Chỉnh sửa số ở cột **`company_id`** thành ID mới (26) -> Bấm **Save**.
4. ⚠️ **Quan trọng:** Bạn bắt buộc phải **Đăng xuất (Logout) trên Website** rồi **Đăng nhập lại**. Web sẽ tạo token mới, giúp bạn xem được dữ liệu của nhà xe số 26. Mọi thao tác tạo/sửa vé lập tức dính vào nhà xe mới này.
