import sys, re
from collections import defaultdict
sys.stdout.reconfigure(encoding='utf-8')

with open('lib/data/players.ts', encoding='utf-8') as f:
    content = f.read()

# Collect all player entries
players = []
for block in re.finditer(r'\{[^}]+\}', content):
    b = block.group()
    pid     = re.search(r'id: (\d+)', b)
    name    = re.search(r'name: "([^"]+)"', b)
    country = re.search(r'country: "([^"]+)"', b)
    dob     = re.search(r'dob: "([^"]+)"', b)
    if pid and name and country and dob:
        players.append({
            'id':      int(pid.group(1)),
            'name':    name.group(1),
            'country': country.group(1),
            'dob':     dob.group(1),
        })

# --- Duplicate player IDs ---
by_id = defaultdict(list)
for p in players:
    by_id[p['id']].append(p)

dupes = {pid: entries for pid, entries in by_id.items() if len(entries) > 1}
print(f'Duplicate player IDs: {len(dupes)}')
for pid, entries in sorted(dupes.items()):
    print(f'  id {pid}:')
    for e in entries:
        print(f'    {e["name"]}  country:{e["country"]}  dob:{e["dob"]}')

# --- Countries still over 26 vinkjes ---
with open('lib/data/wkOfficialSquads.ts', encoding='utf-8') as f:
    squads_content = f.read()

wk_set = set()
wk_sofifa_ids = set()
wk_exclusive = set()
for cb in re.finditer(r"'([^']+)':\s*\[(.*?)\]", squads_content, re.DOTALL):
    country = cb.group(1)
    for entry in re.finditer(r"\{[^}]+\}", cb.group(2)):
        e = entry.group()
        dob_m = re.search(r"dob:\s*'([^']+)'", e)
        sid_m = re.search(r"sofifaId:\s*(\d+)", e)
        if dob_m:
            key = f'{dob_m.group(1)}|{country}'
            if sid_m:
                wk_sofifa_ids.add(int(sid_m.group(1)))
                wk_exclusive.add(key)
            else:
                wk_set.add(key)

def get_status(p):
    if p['id'] in wk_sofifa_ids:
        return 'confirmed'
    key = f'{p["dob"]}|{p["country"]}'
    if key in wk_exclusive:
        return 'not_in_squad'
    return 'confirmed' if key in wk_set else 'not_in_squad'

print('\nLanden met meer dan 26 vinkjes:')
from collections import Counter
by_country = defaultdict(list)
for p in players:
    if get_status(p) == 'confirmed':
        by_country[p['country']].append(p)

for country, confirmed in sorted(by_country.items()):
    if len(confirmed) > 26:
        print(f'\n  {country}: {len(confirmed)} vinkjes')
        # Find the dob|country pairs causing extras
        dob_counts = Counter(p['dob'] for p in confirmed)
        for dob, cnt in dob_counts.items():
            if cnt > 1:
                print(f'    dob {dob} → {cnt} spelers:')
                for p in confirmed:
                    if p['dob'] == dob:
                        print(f'      id:{p["id"]:>8}  {p["name"]}')
