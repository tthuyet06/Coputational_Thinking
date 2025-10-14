
# Bài tập 1
with open("output.txt", 'w') as file:
    file.write("I’m a student.\n")

# Bài tập 2
with open("output.txt", 'a') as file:
    file.write(f"{1.7:.5f}\n")

# Bài tập 3
num1 = int(input("Nhập số nguyên thứ nhất: "))
num2 = int(input("Nhập số nguyên thứ hai: "))
tổng = num1 + num2
with open("output.txt", 'a') as file:
    file.write(f"Tổng của hai số là: {tổng}\n")

# Bài tập 4
file_name = input("Nhập tên file: ")
try:
    with open(file_name, 'r') as file:
        content = file.read()
    with open("output.txt", 'a') as output_file:
        output_file.write(content)
except FileNotFoundError:
    with open("output.txt", 'a') as output_file:
        output_file.write(f"Lỗi: File '{file_name}' không tồn tại.\n")
