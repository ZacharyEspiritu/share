from faker import Faker
import random, string
from numpy.random import choice
import sys
import csv


num_parties = int(sys.argv[1])
num_rows = int(sys.argv[2])
num_common = int(sys.argv[3])

fake = Faker()

all_data = []
schema = {}

def write_file(file_path, data):
    with open(file_path, "w") as csvfile:
        wrtr = csv.writer(csvfile)

        for row in data:
            wrtr.writerow(row)
    
 

def create_row():
    first = fake.first_name()
    last = fake.last_name()
    addr = fake.street_address()
    bday = str(fake.date_between('-70y', '-21y'))
    weight = random.randrange(100,300)
    height = random.randrange(150,200) # in cm

    return [first, last, addr, bday, weight, height]


for i in range(num_parties):
    all_data.append([])

for i in range(num_common):
    row = create_row()
    for j in range(num_parties):
        all_data[j].append(row)

for i in range(num_parties):

    for j in range(num_rows - num_common):
        all_data[i].append(create_row())
    write_file("test_data/" + str(i) + ".csv", all_data[i])



