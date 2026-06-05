import sys, re
sys.stdout.reconfigure(encoding='utf-8')

with open('lib/data/players.ts', encoding='utf-8') as f:
    content = f.read()

# Find all blocks for a given player id
def find_blocks(content, pid):
    return list(re.finditer(r'  \{ id: ' + str(pid) + r',[^\n]+\},?\n', content))

# First, show what we find for each ID
ids_to_fix = [259565, 254685, 215911, 76537, 261031, 248498, 267636, 242223, 265197]
print('── Wat staat er in players.ts per ID ──\n')
for pid in ids_to_fix:
    blocks = find_blocks(content, pid)
    if not blocks:
        print(f'id {pid}: NIET GEVONDEN — overslaan')
        continue
    print(f'id {pid}: {len(blocks)} entr(y/ies)')
    for b in blocks:
        print(f'  → {b.group().strip()[:140]}')
    print()
