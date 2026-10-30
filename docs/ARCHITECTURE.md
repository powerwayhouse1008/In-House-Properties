# Powerway In-House Properties — Architecture

## 1. Quy tắc bắt buộc

- Không tạo thêm bản sao như `*-v2.html`, `*-v3.html`, `*-new.html` hoặc homepage phụ.
- Sửa đúng file canonical được ghi trong tài liệu này.
- Giữ nguyên luồng liên kết: **Trang chủ → Dự án → Căn hộ**.
- Tên dự án là dữ liệu public; mã căn là dữ liệu nội bộ CMS và không được hiển thị trên public.
- Mọi trang public phải dùng cùng hệ thống dark / gold, header, language switcher và footer.
- Mọi thay đổi phải kiểm tra cả desktop, mobile và 5 ngôn ngữ trước khi push.

## 2. Các file canonical

| Khu vực | File duy nhất | Vai trò |
|---|---|---|
| Trang chủ | `dist/index.html` | Hero, danh sách dự án, project dossiers full-screen, căn hộ, liên hệ |
| Trang dự án | `dist/project.html` | Thông tin chung dự án và các căn hộ thuộc dự án |
| Trang căn hộ public | `dist/residence-public.html` | Nội dung riêng của một căn hộ; không hiển thị mã căn |
| Admin chính | `dist/admin-v3.html` | Route admin chính; hiện đang trỏ tới `admin-main.html` qua Vercel rewrite |
| Admin runtime hiện tại | `dist/admin-main.html` | Quản lý dự án, căn hộ, sửa, thêm, copy, upload media, phân quyền |
| Tài khoản cũ/hỗ trợ | `dist/admin-accounts.html` | Chỉ giữ nếu cần tương thích; không tạo dashboard mới |
| Form cũ/hỗ trợ | `dist/admin-project.html` | Chỉ giữ nếu cần tương thích; chức năng mới phải đưa vào `admin-main.html` |
| Server local | `dist/server.js` | Chỉ dùng chạy local; không chứa dữ liệu CMS thật |
| Hosting | `vercel.json` | Output duy nhất là `dist/`; không thêm rewrite phụ nếu không cần |

## 3. Sơ đồ liên kết public

```text
dist/index.html
  ├── #projects                  danh sách dự án
  ├── #dossiers                  từng dự án dạng full-screen
  │     └── project.html?project=<project-slug>
  ├── #homes                     danh sách căn hộ
  │     └── residence-public.html?unit=<internal-code>&project=<project-slug>
  └── #contact                   form/liên hệ
```

### Quy tắc hiển thị

- `index.html`: hiển thị tên dự án, mô tả, thông tin tổng quan và căn hộ public; không hiển thị mã căn.
- `project.html`: dùng một ảnh/video bìa chung của dự án; hiển thị các căn hộ con với tiêu đề public, diện tích, loại căn và giá.
- `residence-public.html`: hiển thị nội dung, ảnh, video, mặt bằng và thông tin riêng của căn hộ; không hiển thị mã căn.
- Mã căn chỉ dùng trong URL nội bộ/public data lookup và khu vực admin; không render ra giao diện public.

## 4. Sơ đồ dữ liệu

```text
Project
  id / slug                  bắt buộc, duy nhất
  name                      tên hiển thị
  location                  khu vực
  coverImage                ảnh bìa dùng chung
  projectVideo.mp4          video dự án
  projectVideo.webm         video dự án dự phòng
  description               mô tả chung
  scale / floors / homes    thông tin tổng quan
  status                    draft | review | published | hidden
  homes[]                   danh sách căn hộ thuộc dự án

Home / Residence
  code                      bắt buộc, chỉ nội bộ
  projectId                 bắt buộc, liên kết về Project
  publicTitle               tiêu đề hiển thị public
  layout                    loại căn
  size                      diện tích
  floor                     tầng
  direction                 hướng
  price                     giá
  description               nội dung riêng
  images[]                  ảnh riêng căn hộ
  video.mp4 / video.webm    video riêng căn hộ
  status                    draft | review | published | hidden
```

## 5. Sơ đồ admin

```text
admin-v3.html
  └── rewrite tới admin-main.html
        ├── Projects
        │     ├── Tạo dự án
        │     │     ├── thông tin chung
        │     │     ├── ảnh bìa / gallery
        │     │     ├── video MP4 / WebM
        │     │     └── căn hộ đầu tiên
        │     ├── Edit project
        │     └── Open project
        │           ├── Add home
        │           ├── Edit home
        │           └── Copy home → bản Draft mới
        └── Accounts & permissions
              ├── Super Admin     viết · duyệt · đăng
              ├── Editor          viết · gửi duyệt
              ├── Reviewer        duyệt · đăng
              └── Viewer          chỉ xem
```

## 6. Quy trình trạng thái

```text
Draft → Needs review → Published
  └────────────────────────────→ Hidden
```

- Editor được tạo/sửa và gửi duyệt.
- Reviewer kiểm tra nội dung, ảnh, video, giá và liên kết dự án/căn hộ.
- Super Admin có toàn quyền.
- Viewer không được sửa hoặc đăng.
- Copy căn hộ luôn tạo bản mới ở trạng thái `Draft` và phải có mã căn mới.

## 7. Video và hình ảnh

- Video public dùng `muted`, `loop`, `playsinline`, `preload="none"`.
- `IntersectionObserver` tải video khi sắp vào viewport và pause khi ra khỏi viewport.
- Luôn có poster ảnh phía sau video.
- Project dùng media chung; Home dùng media riêng.
- Không hard-code thêm media ở nhiều trang; dữ liệu media phải thuộc Project hoặc Home tương ứng.

## 8. Vercel và kiểm tra sau sửa

`vercel.json` phải giữ:

```json
{
  "version": 2,
  "buildCommand": null,
  "outputDirectory": "dist",
  "rewrites": [
    { "source": "/admin-v3.html", "destination": "/admin-main.html" },
    { "source": "/(.*)", "destination": "/dist/$1" }
  ]
}
```

Sau mỗi lần sửa:

1. Kiểm tra `git status` và chỉ có file đúng phạm vi.
2. Kiểm tra link `/`, `/project.html`, `/residence-public.html`, `/admin-v3.html`.
3. Kiểm tra desktop/mobile.
4. Kiểm tra VI / JA / EN / KO / 中文.
5. Kiểm tra không lộ mã căn trên public.
6. Commit mô tả đúng thay đổi rồi mới push `main`.

