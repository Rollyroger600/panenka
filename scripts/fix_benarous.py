import sys, re
sys.stdout.reconfigure(encoding='utf-8')

with open('lib/data/players.ts', encoding='utf-8') as f:
    content = f.read()

# Find and replace the full entry for id 265197
pattern = re.compile(r'  \{ id: 265197,[^\n]+\},?\n')
match = pattern.search(content)
if not match:
    print('NIET GEVONDEN: id 265197')
    sys.exit(1)

old = match.group()
print(f'Oud: {old.strip()[:120]}')

new_line = (
    '  { id: 265197, leagueId: 60, '
    'name: "A. Benarous", middleName: "Ayman Benarous", '
    'fullName: "Ayman Omar Benarous", country: "Engeland", '
    'overall: 62, positions: ["CM", "LM"], age: 22, '
    'dob: "2003-07-27", club: "Plymouth Argyle", league: "League One", '
    'confederation: "UEFA" },\n'
)

content = content.replace(old, new_line, 1)
print(f'Nieuw: {new_line.strip()[:120]}')

with open('lib/data/players.ts', 'w', encoding='utf-8') as f:
    f.write(content)
print('Opgeslagen.')
