import sys, re
sys.stdout.reconfigure(encoding='utf-8')

# ── STAP 1: Verwijder dubbel Al Owais (id 210923, dob 2002-08-11) ──────────
print('── Stap 1: Al Owais duplicaat verwijderen ──')
with open('lib/data/players.ts', encoding='utf-8') as f:
    content = f.read()

# Find all blocks with id 210923
blocks = list(re.finditer(r'  \{ id: 210923,[^\n]+\},?\n', content))
print(f'  Entries gevonden met id 210923: {len(blocks)}')
for b in blocks:
    print(f'  → {b.group().strip()[:100]}')

# Remove the one with dob 2002-08-11
wrong = [b for b in blocks if '2002-08-11' in b.group()]
if wrong:
    content = content.replace(wrong[0].group(), '', 1)
    print(f'  Verwijderd: {wrong[0].group().strip()[:80]}')
else:
    print('  Geen verkeerde entry gevonden')

with open('lib/data/players.ts', 'w', encoding='utf-8') as f:
    f.write(content)
print('  Stap 1 klaar.\n')

# ── STAP 2: sofifaId toevoegen aan wkOfficialSquads.ts ─────────────────────
print('── Stap 2: sofifaId toevoegen aan wkOfficialSquads.ts ──')

# Map: (country, dob) → sofifaId van de correcte WK-speler
SOFIFA_FIXES = {
    ('Argentinië',  '1987-06-24'): 158023,  # Messi    (niet Gamba)
    ('Engeland',    '1993-07-28'): 202126,  # Kane     (niet Odubajo)
    ('Spanje',      '1995-01-30'): 226161,  # Llorente (niet Ahijado)
    ('Duitsland',   '1996-07-20'): 229476,  # Anton    (niet Hübers/Conteh)
    ('Zwitserland', '1996-09-30'): 221491,  # N. Elvedi (niet J. Elvedi)
    ('Colombia',    '1997-01-13'): 241084,  # L. Díaz  (niet Castro)
    ('Zwitserland', '1997-12-06'): 235073,  # Kobel    (niet Kutesa)
    ('Zweden',      '1998-09-08'): 255459,  # Bernhardsson (niet Lidberg)
    ('Argentinië',  '2000-01-31'): 246191,  # J. Alvarez (niet Portillo)
    ('Turkije',     '2005-02-25'): 264309,  # Güler    (niet B. Yilmaz 279115)
    ('Ivoorkust',   '2000-12-25'): 252802,  # Singo    (niet Gbane)
    ('Engeland',    '2001-09-05'): 246669,  # Saka     (niet Griffiths)
    ('Nederland',   '2002-05-16'): 246104,  # Gravenberch (niet Taylor)
    ('Verenigde Staten', '2002-05-28'): 256853,  # Tillman (niet Busio)
    ('Marokko',     '2005-10-06'): 279702,  # El Mourabet (niet Maamma)
}

with open('lib/data/wkOfficialSquads.ts', encoding='utf-8') as f:
    squads = f.read()

updated = 0
for (country, dob), sofifa_id in SOFIFA_FIXES.items():
    # Find the entry: { fifaName: '...', position: '...', dob: '<dob>' }
    # within the country block. Add sofifaId if not already present.
    pattern = re.compile(
        r"(\{ fifaName: '[^']+', position: '[^']+', dob: '" + re.escape(dob) + r"' \})"
    )
    # Find within country section
    country_pattern = re.compile(
        r"('" + re.escape(country) + r"':\s*\[)(.*?)(\])",
        re.DOTALL
    )
    country_match = country_pattern.search(squads)
    if not country_match:
        print(f'  LAND NIET GEVONDEN: {country}')
        continue

    block_start = country_match.start(2)
    block_end = country_match.end(2)
    block = squads[block_start:block_end]

    entry_match = pattern.search(block)
    if not entry_match:
        print(f'  ENTRY NIET GEVONDEN: {country} dob:{dob}')
        continue

    old_entry = entry_match.group(1)
    if 'sofifaId' in old_entry:
        print(f'  Al aanwezig: {country} dob:{dob}')
        continue

    new_entry = old_entry.replace(' }', f', sofifaId: {sofifa_id} }}')
    squads = squads.replace(old_entry, new_entry, 1)
    print(f'  + sofifaId {sofifa_id} → {country} dob:{dob}')
    updated += 1

with open('lib/data/wkOfficialSquads.ts', 'w', encoding='utf-8') as f:
    f.write(squads)
print(f'  {updated} entries bijgewerkt. Stap 2 klaar.\n')
