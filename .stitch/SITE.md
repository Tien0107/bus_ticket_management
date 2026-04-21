# Project Vision & Constitution

> **AGENT INSTRUCTION:** Read this file before every iteration. It serves as the project's "Long-Term Memory."

## 1. Core Identity
* **Project Name:** BusGo - Bus Ticket Booking
* **Stitch Project ID:** 9559426340760532271
* **Mission:** Nền tảng đặt vé xe khách trực tuyến giúp khách hàng dễ dàng tìm kiếm, so sánh và đặt vé xe bus
* **Target Audience:** Khách hàng đặt vé, nhà xe (admin), tài xế, super admin
* **Voice:** Chuyên nghiệp, thân thiện, đáng tin cậy

## 2. Visual Language
*Reference these descriptors when prompting Stitch.*

* **The "Vibe" (Adjectives):**
    * *Primary:* Clean & Minimal
    * *Secondary:* Trustworthy & Professional
    * *Tertiary:* Modern & Friendly

## 3. Architecture & File Structure
* **Root:** `site/public/`
* **Asset Flow:** Stitch generates to `.stitch/designs/` → Validate → Move to `site/public/`
* **Navigation Strategy:** Horizontal top nav with logo, menu items, and CTA button

## 4. Live Sitemap (Current State)
*Update this when a new page is successfully merged.*

* [ ] `index.html` - Trang chủ: Hero banner + form tìm chuyến + nhà xe nổi bật
* [ ] `search-results.html` - Kết quả tìm kiếm chuyến xe (card layout)
* [ ] `trip-detail.html` - Chi tiết chuyến xe + chọn ghế
* [ ] `booking.html` - Xác nhận đặt vé + thanh toán
* [ ] `login.html` - Đăng nhập
* [ ] `register.html` - Đăng ký khách hàng
* [ ] `my-tickets.html` - Danh sách vé của tôi
* [ ] `ticket-detail.html` - Chi tiết vé
* [ ] `admin-dashboard.html` - Dashboard admin nhà xe
* [ ] `admin-vehicles.html` - Quản lý xe
* [ ] `admin-routes.html` - Quản lý tuyến đường
* [ ] `admin-schedules.html` - Quản lý lịch chuyến
* [ ] `admin-staff.html` - Quản lý nhân viên
* [ ] `super-admin-dashboard.html` - Dashboard super admin
* [ ] `super-admin-companies.html` - Quản lý nhà xe
* [ ] `driver-trips.html` - Trang tài xế: danh sách chuyến

## 5. The Roadmap (Backlog)
*Pick the next task from here if available.*

### High Priority
- [ ] Trang chủ (index) - Hero + search form + featured companies
- [ ] Trang kết quả tìm kiếm (search-results) - Card list chuyến xe
- [ ] Trang đăng nhập (login) - Form login
- [ ] Trang đăng ký (register) - Form register

### Medium Priority
- [ ] Trang chi tiết chuyến (trip-detail) - Thông tin + sơ đồ ghế
- [ ] Trang đặt vé (booking) - Xác nhận + thanh toán
- [ ] Trang vé của tôi (my-tickets) - Danh sách vé
- [ ] Trang chi tiết vé (ticket-detail)

### Low Priority
- [ ] Dashboard admin nhà xe (admin-dashboard)
- [ ] Quản lý xe (admin-vehicles)
- [ ] Quản lý tuyến (admin-routes)
- [ ] Quản lý lịch chuyến (admin-schedules)
- [ ] Quản lý nhân viên (admin-staff)
- [ ] Dashboard super admin (super-admin-dashboard)
- [ ] Quản lý nhà xe (super-admin-companies)
- [ ] Trang tài xế (driver-trips)

## 6. Creative Freedom Guidelines
*When the backlog is empty, follow these guidelines to innovate.*

1. **Stay On-Brand:** New pages must fit the clean, minimal, trustworthy vibe
2. **Enhance the Core:** Support the booking flow
3. **Naming Convention:** Use lowercase, hyphenated filenames

### Ideas to Explore
- [ ] `about.html` - Giới thiệu về BusGo
- [ ] `contact.html` - Liên hệ hỗ trợ
- [ ] `faq.html` - Câu hỏi thường gặp
- [ ] `promotions.html` - Khuyến mãi, coupon

## 7. Rules of Engagement
1. Do not recreate pages in Section 4 that are marked [x]
2. Always update `next-prompt.md` before completing
3. Consume ideas from Section 6 when you use them
4. Use Vietnamese for UI text content
