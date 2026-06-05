import sys, re
from collections import defaultdict
sys.stdout.reconfigure(encoding='utf-8')

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
        })

with open('lib/data/wkOfficialSquads.ts', encoding='utf-8') as f:
    squads_content = f.read()

wk_set = set()
for cb in re.finditer(r"'([^']+)':\s*\[(.*?)\]", squads_content, re.DOTALL):
    country = cb.group(1)
    for dob in re.findall(r"dob:\s*'([^']+)'", cb.group(2)):
        wk_set.add(f'{dob}|{country}')

# --- 1. Duitsland 1996-07-20: alle spelers met die dob+land ---
print('=== Duitsland 1996-07-20 ===')
for p in players:
    if p['country'] == 'Duitsland' and p['dob'] == '1996-07-20':
        matched = f'{p["dob"]}|{p["country"]}' in wk_set
        print(f'  id:{p["id"]:>8}  {p["name"]:<25}  vinkje:{matched}')

# --- 2. Turkije: alle spelers met vinkje ---
print('\n=== Turkije: alle spelers met vinkje ===')
turkije_confirmed = [p for p in players if p['country'] == 'Turkije' and f'{p["dob"]}|Turkije' in wk_set]
by_dob = defaultdict(list)
for p in turkije_confirmed:
    by_dob[p['dob']].append(p)
for dob, group in sorted(by_dob.items()):
    marker = ' ← DUBBEL' if len(group) > 1 else ''
    for p in group:
        print(f'  {dob}  id:{p["id"]:>8}  {p["name"]}{marker}')

# --- 3. Saoedi-Arabië: Abu Al Shamat en Al Owais ---
print('\n=== Saoedi-Arabië: id 74436 en 210923 ===')
for p in players:
    if p['id'] in (74436, 210923):
        key = p['dob'] + '|' + p['country']
        print(f'  id:{p["id"]:>8}  {p["name"]:<25}  dob:{p["dob"]}  vinkje:{key in wk_set}')

print('\nWK-squad Saoedi-Arabië dobs:')
for cb in re.finditer(r"'Saoedi-Arabië':\s*\[(.*?)\]", squads_content, re.DOTALL):
    for entry in re.finditer(r"\{[^}]+\}", cb.group(1)):
        e = entry.group()
        name = re.search(r"fifaName:\s*'([^']+)'", e)
        dob  = re.search(r"dob:\s*'([^']+)'", e)
        if name and dob:
            print(f'  {dob.group(1)}  {name.group(1)}')
