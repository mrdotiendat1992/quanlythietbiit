# 💻 Phần Mềm Quản Lý Thiết Bị IT (IT Equipment Management)

Ứng dụng web nội bộ hỗ trợ phòng IT quản lý danh sách thiết bị công nghệ, phòng ban, và lưu trữ lịch sử nhật ký bảo trì/sửa chữa. Hệ thống được thiết kế chạy dưới dạng một Server Web cục bộ nhưng có thể đóng gói thành một file ứng dụng `.exe` sử dụng dễ dàng trên mọi máy tính Windows mà không cần cài đặt rườm rà.

## 🚀 Tính năng nổi bật
- **Quản lý Phòng Ban:** Quản lý các đơn vị phòng ban dễ dàng để quy trách nhiệm khi phân bổ thiết bị.
- **Quản lý Thiết Bị IT:** Theo dõi vòng đời, nguồn gốc và danh mục thiết bị của toàn công ty trên giao diện web trực quan.
- **Lịch Sử Sửa Chữa (IT Logs):** Ghi nhớ lại nhật ký xử lý, bảo trì và log công việc xử lý sự cố hàng ngày của nhân viên.
- **Lightweight & Portable:** Đóng gói tất cả trong một file chạy `.exe` với Database nhỏ gọn (SQLite). Người dùng cuối có thể click chạy ngay không cần cài đặt Python hay máy chủ.

## 🛠️ Công Nghệ Sử Dụng
- **Backend Server:** Python 3, FastAPI, Uvicorn 
- **Database:** CSDL SQLite kết hợp SQLAlchemy ORM.
- **Frontend Giao Diện:** HTML5, CSS3, JavaScript tương tác thông qua REST APIs.
- **Công Cụ Build Automation:** PyInstaller & Batch Scripts.

## 📂 Cơ Cấu Nguồn (Project Structure)
```text
quanlythietbiit/
│
├── main.py                     # Entry point chính của Web Server FastAPI
├── database.py                 # Thiết lập kết nối SQLite CSDL
├── models.py & schemas.py      # Định nghĩa Bảng dữ liệu và Cấu trúc Data Validation
├── static/                     # Chứa tài nguyên Frontend (Trang giao diện, CSS, JS)
├── app.db                      # Cơ sở dữ liệu vật lý (Sẽ tự tạo khi chạy lần đầu)
├── requirements.txt            # Danh sách thư viện Python cần thiết
└── build_and_push.bat          # ⚡ Script Tự động Build file .exe và đẩy code lên Github
```

## ⚙️ Hướng dẫn Quản Lý Source Code (Dành cho Lập trình viên)

### 1. Phát triển và chạy Code cục bộ (Development Tool)
Bước 1: Kích hoạt môi trường ảo (nếu có) và tải các thư viện.
```bat
venv\Scripts\activate.bat
pip install -r requirements.txt
```
Bước 2: Khởi chạy Web Server bằng lệnh:
```bat
uvicorn main:app --reload
```
-> Mở trình duyệt web truy cập: `http://127.0.0.1:8000`

### 2. Xuất bản phiên bản App mới & Cập nhật Github (Automated)
Dự án có đi kèm 1 chu trình tự động (CI/CD cục bộ) qua file Script Batch giúp giảm bớt thao tác dài dòng:
- Click chạy file `build_and_push.bat` nằm chung thư mục dự án.
- Bạn sẽ được hỏi: `"Nhap noi dung thay doi (Commit message)..."`
    - Hãy gõ nội dung bạn vừa cập nhật cho phần mềm và gõ _Enter_ (Hoặc nhấn _Enter_ băng qua luôn để lấy mặc định).
- Ngay sau đó Script sẽ tự động: 
    1. Kiểm kê thư viện. 
    2. Gọi `PyInstaller` để đóng gói toàn bộ server + hệ thống trang web (static) thành file `.exe`. 
    3. Đẩy (*push*) bản sao lưu mã nguồn mới nhất lên kho `GitHub`.

✅ File `.exe` sẵn sàng cho sản xuất (Production Release) sẽ nằm ngụ tại thư mục **`dist/QuanLyThietBiIT.exe`**.

## 📖 Hướng Dẫn Sử Dụng (Dành Cho Người Dùng Mới / User)
Người sử dụng hệ thống chỉ cần nhận được tập tin chạy có tên là `QuanLyThietBiIT.exe`:
1. Click **đúp chuột** mở ứng dụng lên (Một bảng đen Terminal Console của hệ thống server sẽ chạy ngầm).
2. Lên trình duyệt web yêu thích (Chrome / Edge / Safari), duyệt đến địa chỉ tĩnh: **`http://127.0.0.1:8000`**
3. Bắt đầu trải nghiệm ngay lập tức. Trang web và dữ liệu trên máy tính sẽ thông với tập tin `app.db` lưu cạnh chỗ bạn để file chạy exe.