import sys, re, openpyxl
sys.stdout.reconfigure(encoding='utf-8')

with open('lib/data/players.ts', encoding='utf-8') as f:
    content = f.read()
existing_ids = set(int(x) for x in re.findall(r'id: (\d+)', content))

ids_needed = [263376, 252736, 15694223]
print('── Status in players.ts ──')
for pid in ids_needed:
    print(f'  {pid}: {"AANWEZIG" if pid in existing_ids else "ONTBREEKT"}')

print('\n── Zoek in master Excel ──')
wb = openpyxl.load_workbook('260603_WK 2026_Master.xlsx', read_only=True, data_only=True)
ws = wb['sofifa_260421_output_RH_WK_land']
headers = None
found = {}
for i, row in enumerate(ws.iter_rows(values_only=True)):
    if i == 0:
        headers = list(row)
        continue
    pid = row[0]
    if pid and int(pid) in {252736, 15694223}:
        found[int(pid)] = dict(zip(headers, row))

for pid in [252736, 15694223]:
    if pid in found:
        p = found[pid]
        print(f'  {pid} GEVONDEN: {p["short_name"]} | {p["nationality_name"]} | dob:{p["dob"]} | club:{p["club_name"]}')
    else:
        print(f'  {pid} NIET GEVONDEN in master Excel')
