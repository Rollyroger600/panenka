import sys, re
sys.stdout.reconfigure(encoding='utf-8')

# The 16 players already in players.ts (by ID) but without a checkmark
ids_16 = [279877, 276048, 237034, 245870, 247335, 262652, 260407, 259565,
          278901, 266237, 215911, 268771, 242223, 242506, 248498, 211999]

# Parse players.ts
with open('lib/data/players.ts', encoding='utf-8') as f:
    content = f.read()

players_in_app = {}
for block in re.finditer(r'\{[^}]+\}', content):
    b = block.group()
    pid = re.search(r'id: (\d+)', b)
    country = re.search(r'country: "([^"]+)"', b)
    dob = re.search(r'dob: "([^"]+)"', b)
    name = re.search(r'name: "([^"]+)"', b)
    if pid and int(pid.group(1)) in ids_16:
        players_in_app[int(pid.group(1))] = {
            'name': name.group(1) if name else '?',
            'country': country.group(1) if country else '?',
            'dob': dob.group(1) if dob else '?',
        }

# Parse wkOfficialSquads.ts
with open('lib/data/wkOfficialSquads.ts', encoding='utf-8') as f:
    squads_content = f.read()

wk_by_dob_country = {}
for cb in re.finditer(r"'([^']+)':\s*\[(.*?)\]", squads_content, re.DOTALL):
    country = cb.group(1)
    for entry in re.finditer(r"\{[^}]+\}", cb.group(2)):
        e = entry.group()
        fifa_name = re.search(r"fifaName:\s*'([^']+)'", e)
        dob = re.search(r"dob:\s*'([^']+)'", e)
        sofifa_id = re.search(r"sofifaId:\s*(\d+)", e)
        if dob:
            key = f"{dob.group(1)}|{country}"
            wk_by_dob_country[key] = {
                'country': country,
                'dob': dob.group(1),
                'fifaName': fifa_name.group(1) if fifa_name else '?',
                'sofifaId': int(sofifa_id.group(1)) if sofifa_id else None,
            }

# Also build lookup by sofifaId
wk_by_sofifa = {v['sofifaId']: v for v in wk_by_dob_country.values() if v['sofifaId']}

print(f'{"ID":<12} {"Naam (app)":<25} {"DOB app":<12} {"Land app":<25} {"DOB wk":<12} {"Land wk":<25} {"Probleem"}')
print('-' * 130)

for pid in ids_16:
    p = players_in_app.get(pid, {})
    app_dob = p.get('dob', '?')
    app_country = p.get('country', '?')
    app_name = p.get('name', '?')

    # Check if current key already matches
    key = f"{app_dob}|{app_country}"
    if key in wk_by_dob_country:
        print(f"{pid:<12} {app_name:<25} {app_dob:<12} {app_country:<25} {'=':<12} {'=':<25} OK (matcht al?)")
        continue

    # Try to find this player in wk squads by sofifaId
    wk = wk_by_sofifa.get(pid)
    if wk:
        dob_diff = app_dob != wk['dob']
        country_diff = app_country != wk['country']
        problems = []
        if dob_diff: problems.append(f'dob: {app_dob} → {wk["dob"]}')
        if country_diff: problems.append(f'land: {app_country} → {wk["country"]}')
        print(f"{pid:<12} {app_name:<25} {app_dob:<12} {app_country:<25} {wk['dob']:<12} {wk['country']:<25} {', '.join(problems) or 'geen verschil?'}")
    else:
        # No sofifaId match — search by approximate dob/country
        print(f"{pid:<12} {app_name:<25} {app_dob:<12} {app_country:<25} {'?':<12} {'?':<25} geen sofifaId in wkSquads")
