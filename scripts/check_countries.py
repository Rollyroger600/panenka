import sys, re
sys.stdout.reconfigure(encoding='utf-8')
with open('lib/data/players.ts', encoding='utf-8') as f:
    content = f.read()
countries = set(re.findall(r'country: "([^"]+)"', content))
for c in sorted(countries):
    print(c)
