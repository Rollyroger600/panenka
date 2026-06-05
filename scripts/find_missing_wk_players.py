import sys, re
sys.stdout.reconfigure(encoding='utf-8')

# Parse all dob|country from players.ts
with open('lib/data/players.ts', encoding='utf-8') as f:
    content = f.read()

app_dob_country = set()
for block in re.finditer(r'\{[^}]+\}', content):
    b = block.group()
    country = re.search(r'country: "([^"]+)"', b)
    dob = re.search(r'dob: "([^"]+)"', b)
    if country and dob:
        app_dob_country.add(f'{dob.group(1)}|{country.group(1)}')

# Parse wkOfficialSquads.ts
with open('lib/data/wkOfficialSquads.ts', encoding='utf-8') as f:
    squads_content = f.read()

missing = []
country_blocks = re.finditer(r"'([^']+)':\s*\[(.*?)\]", squads_content, re.DOTALL)
for cb in country_blocks:
    country = cb.group(1)
    block = cb.group(2)
    entries = re.finditer(r"\{[^}]+\}", block)
    for entry in entries:
        e = entry.group()
        fifa_name = re.search(r"fifaName:\s*'([^']+)'", e)
        dob = re.search(r"dob:\s*'([^']+)'", e)
        position = re.search(r"position:\s*'([^']+)'", e)
        if fifa_name and dob:
            key = f'{dob.group(1)}|{country}'
            if key not in app_dob_country:
                missing.append({
                    'country': country,
                    'fifaName': fifa_name.group(1),
                    'dob': dob.group(1),
                    'position': position.group(1) if position else '?',
                })

missing.sort(key=lambda x: (x['country'], x['dob']))

print(f'Totaal ontbrekend: {len(missing)}\n')
current_country = None
for p in missing:
    if p['country'] != current_country:
        current_country = p['country']
        print(f"\n{current_country}:")
    print(f"  {p['position']}  {p['dob']}  {p['fifaName']}")
