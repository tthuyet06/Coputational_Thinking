x = input("Nhap nam: ")
year = int(x)
def is_leap_year(x):
    return (x % 400 == 0) or (x % 4 == 0 and x % 100 != 0)
def machine(x):
    if x == 0:
        print("No 0!")
    elif(is_leap_year(x)):
        print("It's leap year")
    else:
        print("No it's not!")
print(machine(year))