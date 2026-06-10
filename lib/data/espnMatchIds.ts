// Mapping van interne matchId (1–104) naar ESPN event ID
// Ophalen via: https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard?dates=YYYYMMDD
// Groepsfase (1–72) ingevuld op 2026-06-10. Knock-out (73–104) aanvullen zodra ESPN ze publiceert.
export const ESPN_MATCH_IDS: Record<number, number> = {
  // ─── Speelronde 1 ─────────────────────────────────────────────────────────
  1: 760415,  // Mexico vs Zuid-Afrika
  2: 760414,  // Zuid-Korea vs Tsjechië
  3: 760416,  // Canada vs Bosnië en Herzegovina
  4: 760417,  // Verenigde Staten vs Paraguay
  5: 760420,  // Qatar vs Zwitserland
  6: 760419,  // Brazilië vs Marokko
  7: 760418,  // Haïti vs Schotland
  8: 760421,  // Australië vs Turkije
  9: 760422,  // Duitsland vs Curaçao
  10: 760425,  // Nederland vs Japan
  11: 760423,  // Ivoorkust vs Ecuador
  12: 760424,  // Zweden vs Tunesië
  13: 760428,  // Spanje vs Kaapverdië
  14: 760426,  // België vs Egypte
  15: 760429,  // Saoedi-Arabië vs Uruguay
  16: 760427,  // Iran vs Nieuw-Zeeland
  17: 760432,  // Frankrijk vs Senegal
  18: 760430,  // Irak vs Noorwegen
  19: 760433,  // Argentinië vs Algerije
  20: 760431,  // Oostenrijk vs Jordanië
  21: 760435,  // Portugal vs DR Congo
  22: 760437,  // Engeland vs Kroatië
  23: 760434,  // Ghana vs Panama
  24: 760436,  // Oezbekistan vs Colombia

  // ─── Speelronde 2 ─────────────────────────────────────────────────────────
  25: 760438,  // Tsjechië vs Zuid-Afrika
  26: 760439,  // Zwitserland vs Bosnië en Herzegovina
  27: 760440,  // Canada vs Qatar
  28: 760441,  // Mexico vs Zuid-Korea
  29: 760442,  // Verenigde Staten vs Australië
  30: 760445,  // Schotland vs Marokko
  31: 760444,  // Brazilië vs Haïti
  32: 760443,  // Turkije vs Paraguay
  33: 760447,  // Nederland vs Zweden
  34: 760448,  // Duitsland vs Ivoorkust
  35: 760446,  // Ecuador vs Curaçao
  36: 760449,  // Tunesië vs Japan
  37: 760453,  // Spanje vs Saoedi-Arabië
  38: 760451,  // België vs Iran
  39: 760450,  // Uruguay vs Kaapverdië
  40: 760452,  // Nieuw-Zeeland vs Egypte
  41: 760456,  // Argentinië vs Oostenrijk
  42: 760457,  // Frankrijk vs Irak
  43: 760454,  // Noorwegen vs Senegal
  44: 760455,  // Jordanië vs Algerije
  45: 760461,  // Portugal vs Oezbekistan
  46: 760458,  // Engeland vs Ghana
  47: 760460,  // Panama vs Kroatië
  48: 760459,  // Colombia vs DR Congo

  // ─── Speelronde 3 ─────────────────────────────────────────────────────────
  49: 760463,  // Zwitserland vs Canada
  50: 760462,  // Bosnië en Herzegovina vs Qatar
  51: 760465,  // Schotland vs Brazilië
  52: 760464,  // Marokko vs Haïti
  53: 760467,  // Tsjechië vs Mexico
  54: 760466,  // Zuid-Afrika vs Zuid-Korea
  55: 760473,  // Curaçao vs Ivoorkust
  56: 760468,  // Ecuador vs Duitsland
  57: 760471,  // Japan vs Zweden
  58: 760472,  // Tunesië vs Nederland
  59: 760470,  // Turkije vs Verenigde Staten
  60: 760469,  // Paraguay vs Australië
  61: 760475,  // Noorwegen vs Frankrijk
  62: 760474,  // Senegal vs Irak
  63: 760478,  // Kaapverdië vs Saoedi-Arabië
  64: 760479,  // Uruguay vs Spanje
  65: 760476,  // Egypte vs Iran
  66: 760477,  // Nieuw-Zeeland vs België
  67: 760485,  // Panama vs Engeland
  68: 760480,  // Kroatië vs Ghana
  69: 760481,  // Colombia vs Portugal
  70: 760482,  // DR Congo vs Oezbekistan
  71: 760484,  // Algerije vs Oostenrijk
  72: 760483,  // Jordanië vs Argentinië

  // ─── Knock-out fase (73–104) ──────────────────────────────────────────────
  // Aanvullen zodra ESPN de knock-out wedstrijden publiceert (verwacht ~1 jul)
}
