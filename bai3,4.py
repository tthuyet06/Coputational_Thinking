filename = input("Nhập tên file cần đọc: ")

try:
    with open(filename, 'r', encoding='utf-8') as f:
        content = f.read()
        print("\n--- Nội dung file ---")
        print(content)
except FileNotFoundError:
    print(f"Lỗi: File '{filename}' không tồn tại.")
except Exception as e:
    print(f"Đã xảy ra lỗi: {e}")