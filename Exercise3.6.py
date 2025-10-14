# Chuỗi văn bản cần ghi
text = "Hôm nay trời đẹp."

with open("output.txt", "wb") as f:
    utf8_bytes = text.encode('utf-8')
    
    f.write(utf8_bytes)

print("Đã ghi thành công file 'output.txt' với nội dung được mã hóa UTF-8.")