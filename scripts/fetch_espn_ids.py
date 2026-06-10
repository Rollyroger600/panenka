import urllib.request, json

DUT_TO_ESPN = {
    'Mexico': 'Mexico',
    'Zuid-Afrika': 'South Africa',
    'Zuid-Korea': 'South Korea',
    'Tsjechie': 'Czechia',
    'Tsjechië': 'Czechia',
    'Canada': 'Canada',
    'Bosnie en Herzegovina': 'Bosnia-Herzegovina',
    'Bosnië en Herzegovina': 'Bosnia-Herzegovina',
    'Verenigde Staten': 'United States',
    'Paraguay': 'Paraguay',
    'Qatar': 'Qatar',
    'Zwitserland': 'Switzerland',
    'Brazilie': 'Brazil',
    'Brazilië': 'Brazil',
    'Marokko': 'Morocco',
    'Haiti': 'Haiti',
    'Haïti': 'Haiti',
    'Schotland': 'Scotland',
    'Australie': 'Australia',
    'Australië': 'Australia',
    'Turkije': 'Turkiye',
    'Duitsland': 'Germany',
    'Curacao': 'Curacao',
    'Curaçao': 'Curacao',
    'Nederland': 'Netherlands',
    'Japan': 'Japan',
    'Ivoorkust': 'Ivory Coast',
    'Ecuador': 'Ecuador',
    'Zweden': 'Sweden',
    'Tunisie': 'Tunisia',
    'Tunesie': 'Tunisia',
    'Tunesië': 'Tunisia',
    'Spanje': 'Spain',
    'Kaapverdie': 'Cape Verde',
    'Kaapverdië': 'Cape Verde',
    'Belgie': 'Belgium',
    'België': 'Belgium',
    'Egypte': 'Egypt',
    'Saoedi-Arabie': 'Saudi Arabia',
    'Saoedi-Arabië': 'Saudi Arabia',
    'Uruguay': 'Uruguay',
    'Iran': 'Iran',
    'Nieuw-Zeeland': 'New Zealand',
    'Frankrijk': 'France',
    'Senegal': 'Senegal',
    'Irak': 'Iraq',
    'Noorwegen': 'Norway',
    'Argentinie': 'Argentina',
    'Argentinië': 'Argentina',
    'Algerije': 'Algeria',
    'Oostenrijk': 'Austria',
    'Jordanie': 'Jordan',
    'Jordanië': 'Jordan',
    'Portugal': 'Portugal',
    'DR Congo': 'DR Congo',
    'Engeland': 'England',
    'Kroatie': 'Croatia',
    'Kroatië': 'Croatia',
    'Ghana': 'Ghana',
    'Panama': 'Panama',
    'Oezbekistan': 'Uzbekistan',
    'Colombia': 'Colombia',
}

INTERNAL = [
    (1, '20260611', 'Mexico', 'Zuid-Afrika'),
    (2, '20260611', 'Zuid-Korea', 'Tsjechië'),
    (3, '20260612', 'Canada', 'Bosnië en Herzegovina'),
    (4, '20260612', 'Verenigde Staten', 'Paraguay'),
    (5, '20260613', 'Qatar', 'Zwitserland'),
    (6, '20260613', 'Brazilië', 'Marokko'),
    (7, '20260613', 'Haïti', 'Schotland'),
    (8, '20260614', 'Australië', 'Turkije'),
    (9, '20260614', 'Duitsland', 'Curaçao'),
    (10, '20260614', 'Nederland', 'Japan'),
    (11, '20260614', 'Ivoorkust', 'Ecuador'),
    (12, '20260614', 'Zweden', 'Tunesië'),
    (13, '20260615', 'Spanje', 'Kaapverdië'),
    (14, '20260615', 'België', 'Egypte'),
    (15, '20260615', 'Saoedi-Arabië', 'Uruguay'),
    (16, '20260615', 'Iran', 'Nieuw-Zeeland'),
    (17, '20260616', 'Frankrijk', 'Senegal'),
    (18, '20260616', 'Irak', 'Noorwegen'),
    (19, '20260617', 'Argentinië', 'Algerije'),
    (20, '20260617', 'Oostenrijk', 'Jordanië'),
    (21, '20260617', 'Portugal', 'DR Congo'),
    (22, '20260617', 'Engeland', 'Kroatië'),
    (23, '20260617', 'Ghana', 'Panama'),
    (24, '20260617', 'Oezbekistan', 'Colombia'),
    (25, '20260618', 'Tsjechië', 'Zuid-Afrika'),
    (26, '20260618', 'Zwitserland', 'Bosnië en Herzegovina'),
    (27, '20260618', 'Canada', 'Qatar'),
    (28, '20260618', 'Mexico', 'Zuid-Korea'),
    (29, '20260619', 'Verenigde Staten', 'Australië'),
    (30, '20260619', 'Schotland', 'Marokko'),
    (31, '20260619', 'Brazilië', 'Haïti'),
    (32, '20260619', 'Turkije', 'Paraguay'),
    (33, '20260620', 'Nederland', 'Zweden'),
    (34, '20260620', 'Duitsland', 'Ivoorkust'),
    (35, '20260620', 'Ecuador', 'Curaçao'),
    (36, '20260620', 'Tunesië', 'Japan'),
    (37, '20260621', 'Spanje', 'Saoedi-Arabië'),
    (38, '20260621', 'België', 'Iran'),
    (39, '20260621', 'Uruguay', 'Kaapverdië'),
    (40, '20260621', 'Nieuw-Zeeland', 'Egypte'),
    (41, '20260622', 'Argentinië', 'Oostenrijk'),
    (42, '20260622', 'Frankrijk', 'Irak'),
    (43, '20260622', 'Noorwegen', 'Senegal'),
    (44, '20260622', 'Jordanië', 'Algerije'),
    (45, '20260623', 'Portugal', 'Oezbekistan'),
    (46, '20260623', 'Engeland', 'Ghana'),
    (47, '20260623', 'Panama', 'Kroatië'),
    (48, '20260623', 'Colombia', 'DR Congo'),
    (49, '20260624', 'Zwitserland', 'Canada'),
    (50, '20260624', 'Bosnië en Herzegovina', 'Qatar'),
    (51, '20260624', 'Schotland', 'Brazilië'),
    (52, '20260624', 'Marokko', 'Haïti'),
    (53, '20260625', 'Tsjechië', 'Mexico'),
    (54, '20260625', 'Zuid-Afrika', 'Zuid-Korea'),
    (55, '20260625', 'Curaçao', 'Ivoorkust'),
    (56, '20260625', 'Ecuador', 'Duitsland'),
    (57, '20260625', 'Japan', 'Zweden'),
    (58, '20260625', 'Tunesië', 'Nederland'),
    (59, '20260626', 'Turkije', 'Verenigde Staten'),
    (60, '20260626', 'Paraguay', 'Australië'),
    (61, '20260626', 'Noorwegen', 'Frankrijk'),
    (62, '20260626', 'Senegal', 'Irak'),
    (63, '20260627', 'Kaapverdië', 'Saoedi-Arabië'),
    (64, '20260627', 'Uruguay', 'Spanje'),
    (65, '20260627', 'Egypte', 'Iran'),
    (66, '20260627', 'Nieuw-Zeeland', 'België'),
    (67, '20260627', 'Panama', 'Engeland'),
    (68, '20260627', 'Kroatië', 'Ghana'),
    (69, '20260628', 'Colombia', 'Portugal'),
    (70, '20260628', 'DR Congo', 'Oezbekistan'),
    (71, '20260628', 'Algerije', 'Oostenrijk'),
    (72, '20260628', 'Jordanië', 'Argentinië'),
]

dates_needed = sorted(set(m[1] for m in INTERNAL))
espn_by_date = {}

print("Fetching ESPN scoreboards...")
for date in dates_needed:
    url = f'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard?dates={date}'
    with urllib.request.urlopen(url, timeout=15) as r:
        data = json.loads(r.read())
    events = data.get('events', [])
    espn_by_date[date] = []
    for e in events:
        comps = e.get('competitions', [])
        if comps:
            c = comps[0]
            teams = c.get('competitors', [])
            home_name = next((x['team']['displayName'] for x in teams if x.get('homeAway') == 'home'), None)
            away_name = next((x['team']['displayName'] for x in teams if x.get('homeAway') == 'away'), None)
            espn_by_date[date].append({'id': e['id'], 'home': home_name, 'away': away_name})
    print(f"  {date}: {len(events)} events")

def norm(name):
    return name.lower().strip().replace('ü', 'u').replace('\xe9', 'e') if name else ''

result = {}
unmatched = []

for (internal_id, date, home_dut, away_dut) in INTERNAL:
    home_espn = DUT_TO_ESPN.get(home_dut, home_dut)
    away_espn = DUT_TO_ESPN.get(away_dut, away_dut)

    found = None
    for cdate in dates_needed:
        for ev in espn_by_date.get(cdate, []):
            eh = norm(ev['home'] or '')
            ea = norm(ev['away'] or '')
            if eh == norm(home_espn) and ea == norm(away_espn):
                found = (int(ev['id']), cdate)
                break
            # Also try swapped (ESPN might have home/away differently)
        if found:
            break

    if found:
        result[internal_id] = found[0]
    else:
        unmatched.append((internal_id, home_dut, away_dut, home_espn, away_espn))

print(f"\n=== Gevonden: {len(result)}/72 ===\n")
print("TypeScript output:")
print("export const ESPN_MATCH_IDS: Record<number, number> = {")
for k in sorted(result.keys()):
    # Get team names for comment
    match = next(m for m in INTERNAL if m[0] == k)
    print(f"  {k}: {result[k]},  // {match[2]} vs {match[3]}")
print("}")

if unmatched:
    print(f"\n=== NIET GEVONDEN ({len(unmatched)}): ===")
    for (iid, hd, ad, he, ae) in unmatched:
        print(f"  Match {iid}: {hd} vs {ad} (ESPN: {he} vs {ae})")

    print("\nAlle ESPN events per datum:")
    for date in sorted(espn_by_date.keys()):
        print(f"  {date}:")
        for ev in espn_by_date[date]:
            print(f"    {ev['id']}: {ev['home']} vs {ev['away']}")
