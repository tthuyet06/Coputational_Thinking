from time_utils import get_current_time, get_current_hours
from datetime import datetime, time
from time_utils import to_decimal_hours, from_decimal_hours

# Lấy ngày hiện tại
a = []

now = datetime.now()

print(now.weekday())

# Kết quả (Dựa trên ngày hiện tại là Thứ Tư, 3/12/2025):
# Thứ tự trong tuần (0=T2, 6=CN): 2