import sys, re
sys.stdout.reconfigure(encoding='utf-8')

# Parse players from players.ts
with open('lib/data/players.ts', encoding='utf-8') as f:
    content = f.read()

players = []
for m in re.finditer(r'\{[^}]+\}', content):
    block = m.group()
    pid   = re.search(r'id: (\d+)', block)
    name  = re.search(r'middleName: "([^"]+)"', block)
    ctry  = re.search(r'country: "([^"]+)"', block)
    dob   = re.search(r'dob: "([^"]+)"', block)
    if pid and ctry and dob:
        players.append((int(pid.group(1)), name.group(1) if name else '', ctry.group(1), dob.group(1)))

# Parse wkOfficialSquads.ts — mirrors wkSquadCheck.ts logic
with open('lib/data/wkOfficialSquads.ts', encoding='utf-8') as f:
    squads_content = f.read()

wk_set       = set()   # dob|country without sofifaId
wk_exclusive = set()   # dob|country where sofifaId overrides
wk_sofifa    = set()   # explicit sofifaId confirmations

for cb in re.finditer(r"'([^']+)':\s*\[(.*?)\]", squads_content, re.DOTALL):
    country = cb.group(1)
    for entry in re.finditer(r"\{[^}]+\}", cb.group(2)):
        e = entry.group()
        dob_m = re.search(r"dob:\s*'([^']+)'", e)
        sid_m = re.search(r"sofifaId:\s*(\d+)", e)
        if dob_m:
            key = f'{dob_m.group(1)}|{country}'
            if sid_m:
                wk_sofifa.add(int(sid_m.group(1)))
                wk_exclusive.add(key)
            else:
                wk_set.add(key)

def is_wk(pid, dob, country):
    if pid in wk_sofifa:
        return True
    key = f'{dob}|{country}'
    if key in wk_exclusive:
        return False
    return key in wk_set

# Collect confirmed WK players
wk_players = [(pid, name, country, dob)
              for pid, name, country, dob in players
              if is_wk(pid, dob, country)]

print(f'WK-spelers gevonden: {len(wk_players)}')

# Export to Excel
try:
    from openpyxl import Workbook
    wb = Workbook()
    ws = wb.active
    ws.title = 'WK 2026 Player IDs'
    ws.append(['id'])
    for pid, name, country, dob in sorted(wk_players, key=lambda x: (x[2], x[3])):
        ws.append([pid])
    out = 'scripts/wk_player_ids_2026.xlsx'
    wb.save(out)
    print(f'Opgeslagen: {out}')
except ImportError:
    # Fallback: plain text
    out = 'scripts/wk_player_ids_2026.txt'
    with open(out, 'w', encoding='utf-8') as f:
        for pid, name, country, dob in sorted(wk_players, key=lambda x: (x[2], x[3])):
            f.write(f'{pid}\n')
    print(f'openpyxl niet beschikbaar, opgeslagen als TXT: {out}')
