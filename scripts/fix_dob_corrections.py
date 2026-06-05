import sys, re
sys.stdout.reconfigure(encoding='utf-8')

with open('lib/data/players.ts', encoding='utf-8') as f:
    content = f.read()

# Fix 1: 242223 Al Hamdan — dob terug naar 1999-09-12
content = re.sub(
    r'(id: 242223,[^\n]*dob: ")1999-09-13(")',
    r'\g<1>1999-09-12\2',
    content
)
print('Fix 1: Al Hamdan (242223) dob → 1999-09-12')

# Fix 2: 265197 Benarous — dob van 2002-07-03 naar 2003-07-27
content = re.sub(
    r'(id: 265197,[^\n]*dob: ")2002-07-03(")',
    r'\g<1>2003-07-27\2',
    content
)
print('Fix 2: Benarous (265197) dob → 2003-07-27')

with open('lib/data/players.ts', 'w', encoding='utf-8') as f:
    f.write(content)
print('players.ts opgeslagen.\n')

# Fix 3: voeg sofifaId 242223 toe aan wkOfficialSquads voor Al Hamdan (1999-09-13)
# zodat het vinkje via ID werkt, ongeacht de dob in players.ts
with open('lib/data/wkOfficialSquads.ts', encoding='utf-8') as f:
    squads = f.read()

old = "{ fifaName: 'ABDULLAH ALHAMDDAN', position: 'FW', dob: '1999-09-13' }"
new = "{ fifaName: 'ABDULLAH ALHAMDDAN', position: 'FW', dob: '1999-09-13', sofifaId: 242223 }"
if old in squads:
    squads = squads.replace(old, new, 1)
    print('Fix 3: sofifaId 242223 toegevoegd aan ABDULLAH ALHAMDDAN in wkOfficialSquads.ts')
else:
    print('Fix 3: ALHAMDDAN entry niet gevonden — check handmatig')

with open('lib/data/wkOfficialSquads.ts', 'w', encoding='utf-8') as f:
    f.write(squads)
