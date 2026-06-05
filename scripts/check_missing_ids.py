import openpyxl, sys, re
sys.stdout.reconfigure(encoding='utf-8')

wb = openpyxl.load_workbook('260605_missing_wk_players.xlsx', read_only=True, data_only=True)
ws = wb.active
players_excel = []
for i, row in enumerate(ws.iter_rows(values_only=True)):
    if i == 0: continue
    if row[5]:
        players_excel.append({
            'country': row[0],
            'fifaName': row[1],
            'dob': row[2],
            'player_id': int(row[5])
        })

with open('lib/data/players.ts', encoding='utf-8') as f:
    content = f.read()
existing_ids = set(int(x) for x in re.findall(r'id: (\d+)', content))

already_in = [p for p in players_excel if p['player_id'] in existing_ids]
not_in     = [p for p in players_excel if p['player_id'] not in existing_ids]

print(f'Al aanwezig in players.ts ({len(already_in)}):')
for p in already_in:
    print(f"  {p['player_id']}  {p['country']}  {p['fifaName']}")

print(f'\nNiet aanwezig ({len(not_in)}):')
for p in not_in:
    print(f"  {p['player_id']}  {p['country']}  {p['fifaName']}")
