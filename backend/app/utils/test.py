from datetime import datetime, date

# Lấy ngày hiện tại
today = date.today()
# Hoặc nếu bạn có một đối tượng datetime cụ thể:
# specific_date = datetime(2025, 12, 25) # Ví dụ: Thứ Tư

# Sử dụng phương thức .weekday()
day_number = today.weekday()

print(f"Hôm nay là: {today}")
print(f"Thứ tự trong tuần (0=T2, 6=CN): {day_number}")

# Kết quả (Dựa trên ngày hiện tại là Thứ Tư, 3/12/2025):
# Thứ tự trong tuần (0=T2, 6=CN): 2