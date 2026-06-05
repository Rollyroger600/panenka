import openpyxl, sys
sys.stdout.reconfigure(encoding='utf-8')

# The 68 player IDs not yet in players.ts
ids_68 = [
    15777172, 261176, 80236, 191043, 199304, 210822, 222895, 264698, 273106,
    212067, 210287, 225964, 216485, 240351, 268508, 246058, 247181, 277742,
    224242, 73669, 10599525, 10196317, 241782, 241784, 259094, 16239362,
    13837954, 260847, 242395, 221706, 85971, 269419, 276923, 70289, 82240,
    243015, 222382, 235183, 182091, 186352, 209361, 220763, 219392, 235860,
    232669, 254143, 246195, 245539, 255360, 276249, 73092, 234726, 220337,
    218191, 75260, 270844, 53110, 225203, 76784, 82899, 217620, 219914,
    224201, 240699, 259259, 255340, 252326, 253061
]
ids_set = set(ids_68)

print(f'Zoek {len(ids_68)} IDs in master Excel...')
wb = openpyxl.load_workbook('260603_WK 2026_Master.xlsx', read_only=True, data_only=True)

sheet_name = 'sofifa_260421_output_RH_WK_land'
ws = wb[sheet_name]

headers = None
found = []
for i, row in enumerate(ws.iter_rows(values_only=True)):
    if i == 0:
        headers = list(row)
        id_col = headers.index('player_id') if 'player_id' in headers else None
        print(f'Kolommen: {headers}')
        print(f'player_id kolom index: {id_col}')
        continue
    if id_col is None:
        break
    pid = row[id_col]
    if pid and int(pid) in ids_set:
        found.append(dict(zip(headers, row)))

print(f'\nGevonden in master Excel: {len(found)}')
for p in found:
    print(f"  {p.get('player_id')}  {p.get('nationality_name')}  {p.get('short_name')}  dob:{p.get('dob')}  club:{p.get('club_name')}")
