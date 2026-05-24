// Mapping van interne matchId (1–104) naar ESPN event ID
// Ophalen via: https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard?dates=YYYYMMDD
// Invullen zodra WK 2026 fixtures live staan op ESPN (verwacht vlak voor toernooisstart)
export const ESPN_MATCH_IDS: Record<number, number> = {
  // Voorbeeld (placeholder — echte IDs invullen vóór toernooi):
  // 1: 901001,
  // 2: 901002,
}
