import openpyxl, sys, re
sys.stdout.reconfigure(encoding='utf-8')

# ── STAP 1: Fixes voor de 16 spelers al in players.ts ──────────────────────
# { id: fixes }  — alleen wat verandert
FIXES_16 = {
    279877: {'country': 'Algerije',      'confederation': 'CAF'},      # Ghedjemis: Fra→Alg
    276048: {'country': 'België',        'confederation': 'UEFA'},     # Fernandez-Pardo: Esp→Bel
    237034: {'dob': '1999-04-20'},                                      # Cucho: dob +2 dagen
    245870: {'country': 'Egypte',        'confederation': 'CAF'},      # Hassan: Fra→Egy
    247335: {'country': 'Haïti',         'confederation': 'CONCACAF'}, # Isidor: Fra→Haïti
    262652: {'country': 'Haïti',         'confederation': 'CONCACAF'}, # Joseph: Fra→Haïti
    260407: {'country': 'Ivoorkust',     'confederation': 'CAF'},      # Wahi: Fra→Ivo
    259565: {'country': 'Ivoorkust',     'confederation': 'CAF'},      # Bonny: Fra→Ivo
    278901: {'country': 'Marokko',       'confederation': 'CAF'},      # Bouaddi: Fra→Mar
    266237: {'country': 'Oostenrijk',    'confederation': 'UEFA'},     # Wanner: Dui→Oos
    215911: {'dob': '1990-01-01'},                                      # Hatem: dob fix
    268771: {'dob': '1990-07-09'},                                      # Khoukhi: dob fix (07/09 vs 09/07)
    242223: {'dob': '1999-09-13'},                                      # Al Hamdan: dob +1
    242506: {'dob': '1999-10-02'},                                      # Majrashi: dob +1
    248498: {'dob': '2000-11-08'},                                      # Al Ghannam: dob +1
    211999: {'country': 'Tunesië',       'confederation': 'CAF'},      # Khedira: Dui→Tun
}

# Regex to match a full player block by id
def fix_player(content, pid, fixes):
    pattern = re.compile(
        r'(\{ id: ' + str(pid) + r',[^\n]+\}),?'
    )
    match = pattern.search(content)
    if not match:
        print(f'  NIET GEVONDEN: id {pid}')
        return content
    block = match.group(0)
    original = block
    for field, new_val in fixes.items():
        # Replace field value in block
        block = re.sub(
            r'(' + field + r': ")([^"]+)(")',
            lambda m: m.group(1) + new_val + m.group(3),
            block
        )
    if block == original:
        print(f'  WAARSCHUWING geen wijziging voor id {pid}')
    else:
        print(f'  Gefixd: id {pid}  {fixes}')
    return content.replace(original, block, 1)

print('── Stap 1: Fixing 16 spelers ──')
with open('lib/data/players.ts', encoding='utf-8') as f:
    content = f.read()

for pid, fixes in FIXES_16.items():
    content = fix_player(content, pid, fixes)

with open('lib/data/players.ts', 'w', encoding='utf-8') as f:
    f.write(content)
print('Stap 1 klaar.\n')

# ── STAP 2: Voeg 19 spelers toe uit master Excel ────────────────────────────

COUNTRY_NORMALIZE = {
    'Kaapverdische Eil.': 'Kaapverdië',
    'Saudi-Arabië': 'Saoedi-Arabië',
    'Bosnië-Herzegovina': 'Bosnië en Herzegovina',
}
CONFEDERATION = {
    'Algerije':'CAF','Argentinië':'CONMEBOL','Australië':'AFC','België':'UEFA',
    'Bosnië en Herzegovina':'UEFA','Brazilië':'CONMEBOL','Canada':'CONCACAF',
    'Colombia':'CONMEBOL','Curaçao':'CONCACAF','DR Congo':'CAF','Duitsland':'UEFA',
    'Ecuador':'CONMEBOL','Egypte':'CAF','Engeland':'UEFA','Frankrijk':'UEFA',
    'Ghana':'CAF','Haïti':'CONCACAF','Irak':'AFC','Iran':'AFC','Ivoorkust':'CAF',
    'Japan':'AFC','Jordanië':'AFC','Kaapverdië':'CAF','Kroatië':'UEFA',
    'Marokko':'CAF','Mexico':'CONCACAF','Nederland':'UEFA','Nieuw-Zeeland':'OFC',
    'Noorwegen':'UEFA','Oezbekistan':'AFC','Oostenrijk':'UEFA','Panama':'CONCACAF',
    'Paraguay':'CONMEBOL','Portugal':'UEFA','Qatar':'AFC','Saoedi-Arabië':'AFC',
    'Schotland':'UEFA','Senegal':'CAF','Spanje':'UEFA','Tsjechië':'UEFA',
    'Tunesië':'CAF','Turkije':'UEFA','Uruguay':'CONMEBOL','Verenigde Staten':'CONCACAF',
    'Zuid-Afrika':'CAF','Zuid-Korea':'AFC','Zweden':'UEFA','Zwitserland':'UEFA',
}

# DOB overrides: gebruik FIFA-datum uit wkOfficialSquads voor checkmark
DOB_OVERRIDES = {
    76784: '2006-06-09',  # Curtis: sofifa 2006-10-01 → FIFA 2006-06-09
}

IDS_19 = {
    254143, 53110, 225203, 75260, 73092, 70289, 182091, 219392, 220763,
    76784, 277742, 255360, 268508, 276249, 209361, 246195, 245539, 235860, 80236
}

print('── Stap 2: Lezen 19 spelers uit master Excel ──')
wb = openpyxl.load_workbook('260603_WK 2026_Master.xlsx', read_only=True, data_only=True)
ws = wb['sofifa_260421_output_RH_WK_land']

headers = None
new_players = []
for i, row in enumerate(ws.iter_rows(values_only=True)):
    if i == 0:
        headers = list(row)
        continue
    pid = row[0]
    if pid and int(pid) in IDS_19:
        p = dict(zip(headers, row))
        new_players.append(p)

print(f'Gevonden: {len(new_players)} spelers')

def escape(s):
    return str(s).replace('\\', '\\\\').replace('"', '\\"') if s else ''

def fmt_dob(dob):
    if hasattr(dob, 'strftime'):
        return dob.strftime('%Y-%m-%d')
    return str(dob)[:10]

new_lines = []
for p in new_players:
    pid = int(p['player_id'])
    country_raw = p['nationality_name'] or ''
    country = COUNTRY_NORMALIZE.get(country_raw, country_raw)
    confederation = CONFEDERATION.get(country, 'UNKNOWN')
    positions = [x.strip() for x in str(p['player_positions']).split(',') if x.strip()]
    positions_ts = '[' + ', '.join(f'"{x}"' for x in positions) + ']'
    dob = DOB_OVERRIDES.get(pid, fmt_dob(p['dob']))
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
    print(f'  + {pid}  {country}  {p["short_name"]}  dob:{dob}')

# Append to players.ts before closing ]
with open('lib/data/players.ts', encoding='utf-8') as f:
    lines = f.readlines()

assert lines[-1].strip() == ']', f'Onverwachte laatste regel: {repr(lines[-1])}'
lines.insert(len(lines) - 1, '\n'.join(new_lines) + '\n')

with open('lib/data/players.ts', 'w', encoding='utf-8') as f:
    f.writelines(lines)

print(f'\nStap 2 klaar: {len(new_lines)} spelers toegevoegd.')
