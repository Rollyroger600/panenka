import openpyxl, sys, re
sys.stdout.reconfigure(encoding='utf-8')

COUNTRY_NORMALIZE = {
    'Saudi-Arabië': 'Saoedi-Arabië',
    'Bosnië-Herzegovina': 'Bosnië en Herzegovina',
    'Kaapverdische Eil.': 'Kaapverdië',
}

CONFEDERATION = {
    'Algerije': 'CAF',
    'Argentinië': 'CONMEBOL',
    'Australië': 'AFC',
    'België': 'UEFA',
    'Bosnië en Herzegovina': 'UEFA',
    'Brazilië': 'CONMEBOL',
    'Canada': 'CONCACAF',
    'Colombia': 'CONMEBOL',
    'Curaçao': 'CONCACAF',
    'DR Congo': 'CAF',
    'Duitsland': 'UEFA',
    'Ecuador': 'CONMEBOL',
    'Egypte': 'CAF',
    'Engeland': 'UEFA',
    'Frankrijk': 'UEFA',
    'Ghana': 'CAF',
    'Haïti': 'CONCACAF',
    'Irak': 'AFC',
    'Iran': 'AFC',
    'Ivoorkust': 'CAF',
    'Japan': 'AFC',
    'Jordanië': 'AFC',
    'Kaapverdië': 'CAF',
    'Kroatië': 'UEFA',
    'Marokko': 'CAF',
    'Mexico': 'CONCACAF',
    'Nederland': 'UEFA',
    'Nieuw-Zeeland': 'OFC',
    'Noorwegen': 'UEFA',
    'Oezbekistan': 'AFC',
    'Oostenrijk': 'UEFA',
    'Panama': 'CONCACAF',
    'Paraguay': 'CONMEBOL',
    'Portugal': 'UEFA',
    'Qatar': 'AFC',
    'Saoedi-Arabië': 'AFC',
    'Schotland': 'UEFA',
    'Senegal': 'CAF',
    'Spanje': 'UEFA',
    'Tsjechië': 'UEFA',
    'Tunesië': 'CAF',
    'Turkije': 'UEFA',
    'Uruguay': 'CONMEBOL',
    'Venezuela': 'CONMEBOL',
    'Verenigde Staten': 'CONCACAF',
    'Zuid-Afrika': 'CAF',
    'Zuid-Korea': 'AFC',
    'Zweden': 'UEFA',
    'Zwitserland': 'UEFA',
}

def escape(s):
    return str(s).replace('\\', '\\\\').replace('"', '\\"') if s else ''

def fmt_dob(dob):
    if hasattr(dob, 'strftime'):
        return dob.strftime('%Y-%m-%d')
    return str(dob)

# Read existing player IDs
with open('lib/data/players.ts', encoding='utf-8') as f:
    content = f.read()
existing_ids = set(int(x) for x in re.findall(r'id: (\d+)', content))
print(f'Bestaande spelers: {len(existing_ids)}')

# Read new players from Excel
wb = openpyxl.load_workbook('260605_players_250.xlsx', read_only=True, data_only=True)
ws = wb['Players_250']

new_lines = []
skipped = []
unknown_country = []

for i, row in enumerate(ws.iter_rows(values_only=True)):
    if i == 0:
        continue  # skip header

    player_id, short_name, middle_name, long_name, overall, positions_raw, age, dob, \
        league_id, league_name, league_level, club_team_id, club_name, nationality_id, nationality_name = row

    if player_id is None:
        continue

    player_id = int(player_id)

    if player_id in existing_ids:
        skipped.append(player_id)
        continue

    # Normalize country name
    country = COUNTRY_NORMALIZE.get(nationality_name, nationality_name)

    # Get confederation
    confederation = CONFEDERATION.get(country)
    if not confederation:
        unknown_country.append((player_id, country))
        confederation = 'UNKNOWN'

    # Parse positions
    positions = [p.strip() for p in str(positions_raw).split(',') if p.strip()]
    positions_ts = '[' + ', '.join(f'"{p}"' for p in positions) + ']'

    # Format dob
    dob_str = fmt_dob(dob)

    # Clean club name (strip trailing whitespace)
    club = club_name.strip() if club_name else ''
    league = league_name.strip() if league_name else ''

    line = (
        f'  {{ id: {player_id}, leagueId: {int(league_id)}, '
        f'name: "{escape(short_name)}", middleName: "{escape(middle_name)}", '
        f'fullName: "{escape(long_name)}", country: "{escape(country)}", '
        f'overall: {int(overall)}, positions: {positions_ts}, age: {int(age)}, '
        f'dob: "{dob_str}", club: "{escape(club)}", league: "{escape(league)}", '
        f'confederation: "{confederation}" }},'
    )
    new_lines.append(line)

print(f'Toe te voegen: {len(new_lines)} spelers')
if skipped:
    print(f'Overgeslagen (al aanwezig): {len(skipped)} spelers: {skipped}')
if unknown_country:
    print(f'ONBEKENDE LANDEN: {unknown_country}')

if not new_lines:
    print('Niets toe te voegen.')
    sys.exit(0)

if unknown_country:
    print('Stoppen vanwege onbekende landen — controleer de mapping.')
    sys.exit(1)

# Insert before closing ]
with open('lib/data/players.ts', encoding='utf-8') as f:
    lines = f.readlines()

# Find the closing ]
last_line_idx = len(lines) - 1
assert lines[last_line_idx].strip() == ']', f'Onverwachte laatste regel: {repr(lines[last_line_idx])}'

# Insert new lines before closing ]
insert_block = '\n'.join(new_lines) + '\n'
lines.insert(last_line_idx, insert_block)

with open('lib/data/players.ts', 'w', encoding='utf-8') as f:
    f.writelines(lines)

print(f'Klaar! {len(new_lines)} spelers toegevoegd aan players.ts')
