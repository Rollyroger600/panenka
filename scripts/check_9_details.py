import sys, re
sys.stdout.reconfigure(encoding='utf-8')

with open('lib/data/players.ts', encoding='utf-8') as f:
    content = f.read()

# Parse wkOfficialSquads for Irak
with open('lib/data/wkOfficialSquads.ts', encoding='utf-8') as f:
    squads = f.read()

irak_dobs = set()
for cb in re.finditer(r"'Irak':\s*\[(.*?)\]", squads, re.DOTALL):
    for dob in re.findall(r"dob:\s*'([^']+)'", cb.group(1)):
        irak_dobs.add(dob)

ids_check = {259565, 254685, 215911, 76537, 261031, 248498, 267636, 242223, 265197}
print(f'{"ID":<12} {"Naam":<35} {"Country":<20} {"DOB":<12} {"Opmerking"}')
print('-' * 100)

for block in re.finditer(r'\{[^}]+\}', content):
    b = block.group()
    pid = re.search(r'id: (\d+)', b)
    if not pid or int(pid.group(1)) not in ids_check:
        continue
    name    = re.search(r'middleName: "([^"]+)"', b)
    country = re.search(r'country: "([^"]+)"', b)
    dob     = re.search(r'dob: "([^"]+)"', b)
    p_id    = int(pid.group(1))
    p_dob   = dob.group(1) if dob else '?'
    p_country = country.group(1) if country else '?'
    p_name  = name.group(1) if name else '?'

    notes = []
    if p_id == 261031:
        if p_dob in irak_dobs:
            notes.append('✓ IRAK VINKJE — dit is de ontbrekende Irak-speler!')
        else:
            notes.append(f'dob {p_dob} niet in Irak wkSquads')
    if p_id == 242223 and p_dob != '1999-09-12':
        notes.append(f'dob is {p_dob}, user wil 1999-09-12')
    if p_id == 267636:
        notes.append(f'user wil dob 2000-08-24, nu: {p_dob}')
    if p_id == 265197:
        notes.append(f'user wil dob 2003-07-27, nu: {p_dob}, country: {p_country}')

    print(f'{p_id:<12} {p_name:<35} {p_country:<20} {p_dob:<12} {" | ".join(notes) if notes else "OK"}')
