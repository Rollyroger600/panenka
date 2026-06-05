import sys, re, json
sys.stdout.reconfigure(encoding='utf-8')

# Parse players from players.ts
with open('lib/data/players.ts', encoding='utf-8') as f:
    content = f.read()

player_pattern = re.compile(
    r'id: (\d+).*?country: "([^"]+)".*?dob: "([^"]+)"',
    re.DOTALL
)
players = []
for m in re.finditer(r'\{[^}]+\}', content):
    block = m.group()
    pid = re.search(r'id: (\d+)', block)
    country = re.search(r'country: "([^"]+)"', block)
    dob = re.search(r'dob: "([^"]+)"', block)
    if pid and country and dob:
        players.append((int(pid.group(1)), country.group(1), dob.group(1)))

print(f'Totaal spelers in players.ts: {len(players)}')

# Parse wkOfficialSquads.ts
with open('lib/data/wkOfficialSquads.ts', encoding='utf-8') as f:
    squads_content = f.read()

# Build lookup sets from wkOfficialSquads (mirrors wkSquadCheck.ts logic)
wk_set = set()           # dob|country without sofifaId
wk_exclusive = set()     # dob|country where sofifaId is required
wk_sofifa_ids = set()    # explicit sofifaId confirmations
country_squad_size = {}

country_blocks = re.finditer(r"'([^']+)':\s*\[(.*?)\]", squads_content, re.DOTALL)
for cb in country_blocks:
    country = cb.group(1)
    block = cb.group(2)
    entries = re.finditer(r"\{[^}]+\}", block)
    count = 0
    for entry in entries:
        e = entry.group()
        dob_m = re.search(r"dob:\s*'([^']+)'", e)
        sid_m = re.search(r"sofifaId:\s*(\d+)", e)
        if dob_m:
            count += 1
            key = f'{dob_m.group(1)}|{country}'
            if sid_m:
                wk_sofifa_ids.add(int(sid_m.group(1)))
                wk_exclusive.add(key)
            else:
                wk_set.add(key)
    country_squad_size[country] = count

def is_confirmed(player_id, dob, country):
    if player_id in wk_sofifa_ids:
        return True
    key = f'{dob}|{country}'
    if key in wk_exclusive:
        return False
    return key in wk_set

print(f'Officiële WK-spelers (squad entries): {len(wk_set)}')
print()

# Count confirmed per country
from collections import defaultdict
confirmed = defaultdict(int)
total_in_app = defaultdict(int)

for pid, country, dob in players:
    total_in_app[country] += 1
    if is_confirmed(pid, dob, country):
        confirmed[country] += 1

# Print per WK country
wk_countries = sorted(country_squad_size.keys())
print(f'{"Land":<30} {"App":>5} {"Vinkje":>7} {"Selectie":>9} {"Dekkingsgraad":>14}')
print('-' * 70)
total_confirmed = 0
total_squad = 0
for country in wk_countries:
    squad = country_squad_size[country]
    conf = confirmed.get(country, 0)
    app = total_in_app.get(country, 0)
    pct = f'{conf}/{squad}'
    total_confirmed += conf
    total_squad += squad
    print(f'{country:<30} {app:>5} {conf:>7} {squad:>9} {pct:>14}')

print('-' * 70)
print(f'{"TOTAAL":<30} {sum(total_in_app[c] for c in wk_countries):>5} {total_confirmed:>7} {total_squad:>9} {f"{total_confirmed}/{total_squad}":>14}')
