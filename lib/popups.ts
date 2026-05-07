/**
 * Popup-berichten per pagina.
 * - Gebruik {naam} om een willekeurige andere deelnemer in te voegen.
 * - 'global' verschijnt op alle pagina's.
 * - Overige sleutels zijn de route-paden (bijv. '/fantasy', '/poulefase').
 * Voeg gewoon strings toe of verwijder ze — geen herstart nodig in dev.
 */
export const POPUPS: Record<string, string[]> = {
  global: [
    'Psst… {naam} heeft zijn voorspellingen net bijgewerkt. Ben jij al klaar?',
    'Weet je zeker dat je het beter weet dan {naam}?',
    '{naam} twijfelt ook. Maar kiest toch maar door.',
    'Gerucht: {naam} heeft een inside tip gekregen. Of niet.',
    'Even bijkomen? {naam} gunt je die pauze niet.',
    '{naam} kijkt mee. Of voelt het alleen maar zo.',
  ],

  '/poulefase': [
    'Durf je een verrassing te voorspellen? {naam} durft het wel.',
    'Vergeet niet: elke groepswinnaar telt. Vraag maar aan {naam}.',
    '{naam} heeft al 3 keer zijn poule-voorspelling veranderd. Jij ook?',
  ],

  '/fantasy': [
    'Ben je echt tevreden met je Fantasy XV? {naam} is dat sowieso niet.',
    'De deadline nadert sneller dan je denkt. Net als {naam}.',
    'Geen spijt achteraf — tenzij je {naam} voor laat liggen.',
  ],

  '/knockout': [
    'Wie wint de finale? {naam} durft het al te zeggen.',
    'Grote namen vallen altijd vroeg af. Of toch niet? {naam} rekent er op.',
  ],

  '/oranje': [
    'Oranje kan het. Toch? Vraag het aan {naam}.',
    '{naam} gelooft erin. Jij ook?',
  ],
}
