import sys, re
from collections import defaultdict
sys.stdout.reconfigure(encoding='utf-8')

# Parse players.ts — collect all players with id, name, dob, country
with open('lib/data/players.ts', encoding='utf-8') as f:
    content = f.read()

players = []
for block in re.finditer(r'\{[^}]+\}', content):
    b = block.group()
    pid     = re.search(r'id: (\d+)', b)
    name    = re.search(r'name: "([^"]+)"', b)
    country = re.search(r'country: "([^"]+)"', b)
    dob     = re.search(r'dob: "([^"]+)"', b)
    if pid and country and dob:
        players.append({
            'id':      int(pid.group(1)),
            'name':    name.group(1) if name else '?',
            'country': country.group(1),
            'dob':     dob.group(1),
            'key':     f'{dob.group(1)}|{country.group(1)}',
        })

# Parse wkOfficialSquads.ts — build set of valid dob|country keys
with open('lib/data/wkOfficialSquads.ts', encoding='utf-8') as f:
    squads_content = f.read()

wk_set = set()
for cb in re.finditer(r"'([^']+)':\s*\[(.*?)\]", squads_content, re.DOTALL):
    country = cb.group(1)
    for dob in re.findall(r"dob:\s*'([^']+)'", cb.group(2)):
        wk_set.add(f'{dob}|{country}')

# Find keys that appear in wk_set AND have multiple players in app
by_key = defaultdict(list)
for p in players:
    if p['key'] in wk_set:
        by_key[p['key']].append(p)

duplicates = {k: v for k, v in by_key.items() if len(v) > 1}

print(f'Dubbelingen gevonden: {len(duplicates)} dob|country combinaties\n')
for key, group in sorted(duplicates.items()):
    country, dob = key.split('|')[1], key.split('|')[0]
    print(f'{country}  dob: {dob}')
    for p in group:
        print(f'   id: {p["id"]:>10}  naam: {p["name"]}')
    print()
