import csv, json

deck1, deck2, deck3 = [], [], []

with open('cards.csv', 'r') as f:
    reader = csv.reader(f)
    header = next(reader)
    for i, row in enumerate(reader):
        level = int(row[0])
        gem = row[1].lower()
        points = int(row[2])
        cost = {
            'black': int(row[3]),
            'blue': int(row[4]),
            'green': int(row[5]),
            'red': int(row[6]),
            'white': int(row[7])
        }
        cost = {k: v for k, v in cost.items() if v > 0}
        
        card = {
            'id': f'c_{i}',
            'level': level,
            'gem': gem,
            'points': points,
            'cost': cost,
            'bg': f'/bg/{gem}_bg.jpg'
        }
        
        if level == 1: deck1.append(card)
        elif level == 2: deck2.append(card)
        elif level == 3: deck3.append(card)

with open('src/data/cards.js', 'w', encoding='utf-8') as f:
    f.write('export const deck1 = ' + json.dumps(deck1, indent=2) + ';\n')
    f.write('export const deck2 = ' + json.dumps(deck2, indent=2) + ';\n')
    f.write('export const deck3 = ' + json.dumps(deck3, indent=2) + ';\n')
    f.write("export const colorsList = ['white', 'blue', 'green', 'red', 'black', 'gold'];\n")
