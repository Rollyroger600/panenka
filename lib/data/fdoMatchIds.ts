// Mapping van interne matchId (1–104) naar football-data.org matchId
// In te vullen zodra fdo de WK 2026 fixtures publiceert (verwacht voorjaar 2026)
// Wedstrijden zonder mapping worden overgeslagen bij live-ophaling
export const FDO_MATCH_IDS: Record<number, number> = {
  // Voorbeeld (placeholder — echte IDs invullen vóór toernooi):
  // 1: 415081,
  // 2: 415082,
}

// Omgekeerde mapping: fdo matchId → interne matchId (auto-gegenereerd)
export const FDO_TO_INTERNAL: Record<number, number> = Object.fromEntries(
  Object.entries(FDO_MATCH_IDS).map(([internal, fdo]) => [fdo, Number(internal)])
)
