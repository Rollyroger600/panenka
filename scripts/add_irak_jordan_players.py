import sys, re, openpyxl
sys.stdout.reconfigure(encoding='utf-8')

COUNTRY_NORMALIZE = {
    'Kaapverdische Eil.': 'Kaapverdië',
    'Saudi-Arabië': 'Saoedi-Arabië',
    'Bosnië-Herzegovina': 'Bosnië en Herzegovina',
}
CONFEDERATION = {
    'Irak': 'AFC', 'Jordanië': 'AFC',
    'Algerije':'CAF','Argentinië':'CONMEBOL','Australië':'AFC','België':'UEFA',
    'Bosnië en Herzegovina':'UEFA','Brazilië':'CONMEBOL','Canada':'CONCACAF',
    'Colombia':'CONMEBOL','Curaçao':'CONCACAF','DR Congo':'CAF','Duitsland':'UEFA',
    'Ecuador':'CONMEBOL','Egypte':'CAF','Engeland':'UEFA','Frankrijk':'UEFA',
    'Ghana':'CAF','Haïti':'CONCACAF','Iran':'AFC','Ivoorkust':'CAF',
    'Japan':'AFC','Kaapverdië':'CAF','Kroatië':'UEFA',
    'Marokko':'CAF','Mexico':'CONCACAF','Nederland':'UEFA','Nieuw-Zeeland':'OFC',
    'Noorwegen':'UEFA','Oezbekistan':'AFC','Oostenrijk':'UEFA','Panama':'CONCACAF',
    'Paraguay':'CONMEBOL','Portugal':'UEFA','Qatar':'AFC','Saoedi-Arabië':'AFC',
    'Schotland':'UEFA','Senegal':'CAF','Spanje':'UEFA','Tsjechië':'UEFA',
    'Tunesië':'CAF','Turkije':'UEFA','Uruguay':'CONMEBOL','Verenigde Staten':'CONCACAF',
    'Zuid-Afrika':'CAF','Zuid-Korea':'AFC','Zweden':'UEFA','Zwitserland':'UEFA',
}

def escape(s):
    return str(s).replace('\\', '\\\\').replace('"', '\\"') if s else ''

def fmt_dob(dob):
    if hasattr(dob, 'strftime'):
        return dob.strftime('%Y-%m-%d')
    return str(dob)[:10]

# ── Stap 1: sofifaId toevoegen aan wkOfficialSquads.ts ─────────────────────
print('── Stap 1: sofifaId toevoegen in wkOfficialSquads.ts ──')
with open('lib/data/wkOfficialSquads.ts', encoding='utf-8') as f:
    squads = f.read()

fixes = [
    ("{ fifaName: 'HUSSEIN ALI', position: 'DF', dob: '2002-03-01' }",
     "{ fifaName: 'HUSSEIN ALI', position: 'DF', dob: '2002-03-01', sofifaId: 252736 }"),
    ("{ fifaName: 'ALI ALHAMADI', position: 'FW', dob: '2002-03-01' }",
     "{ fifaName: 'ALI ALHAMADI', position: 'FW', dob: '2002-03-01', sofifaId: 263376 }"),
]
for old, new in fixes:
    if old in squads:
        squads = squads.replace(old, new, 1)
        print(f'  ✓ {old[:60]}')
    elif new in squads:
        print(f'  Al aanwezig: {new[:60]}')
    else:
        print(f'  NIET GEVONDEN: {old[:60]}')

with open('lib/data/wkOfficialSquads.ts', 'w', encoding='utf-8') as f:
    f.write(squads)
print()

# ── Stap 2: Spelers toevoegen aan players.ts ───────────────────────────────
print('── Stap 2: 2 spelers toevoegen aan players.ts ──')
wb = openpyxl.load_workbook('260603_WK 2026_Master.xlsx', read_only=True, data_only=True)
ws = wb['sofifa_260421_output_RH_WK_land']
headers = None
to_add = {}
for i, row in enumerate(ws.iter_rows(values_only=True)):
    if i == 0:
        headers = list(row)
        continue
    pid = row[0]
    if pid and int(pid) in {252736, 15694223}:
        to_add[int(pid)] = dict(zip(headers, row))

new_lines = []
for pid in [252736, 15694223]:
    if pid not in to_add:
        print(f'  {pid}: NIET GEVONDEN — overslaan')
        continue
    p = to_add[pid]
    country = COUNTRY_NORMALIZE.get(p['nationality_name'], p['nationality_name'])
    confederation = CONFEDERATION.get(country, 'UNKNOWN')
    positions = [x.strip() for x in str(p['player_positions']).split(',') if x.strip()]
    positions_ts = '[' + ', '.join(f'"{x}"' for x in positions) + ']'
    dob = fmt_dob(p['dob'])
    club = (p['club_name'] or '').strip()
    league = (p['league_name'] or '').strip()
    line = (
        f'  {{ id: {pid}, leagueId: {int(p["league_id"])}, '
        f'name: "{escape(p["short_name"])}", middleName: "{escape(p["middle_name"])}", '
        f'fullName: "{escape(p["long_name"])}", country: "{escape(country)}", '
        f'overall: {int(p["overall"])}, positions: {positions_ts}, age: {int(p["age"])}, '
        f'dob: "{dob}", club: "{escape(club)}", league: "{escape(league)}", '
        f'confederation: "{confederation}" }},'
    )
    new_lines.append(line)
    print(f'  + {pid}  {country}  {p["short_name"]}  dob:{dob}  club:{club}')

with open('lib/data/players.ts', encoding='utf-8') as f:
    lines = f.readlines()
assert lines[-1].strip() == ']'
lines.insert(len(lines) - 1, '\n'.join(new_lines) + '\n')
with open('lib/data/players.ts', 'w', encoding='utf-8') as f:
    f.writelines(lines)
print(f'\n{len(new_lines)} spelers toegevoegd.')
