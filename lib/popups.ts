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
    'Gerucht: {naam} heeft een inside tip van Ronald K. gekregen.',
    '{naam} kijkt mee. Of voelt het alleen maar zo.',
    'Er is geen participatieprijs hoor, dus neem het even serieus.',
    'Wil je soms laatste worden?',
    'Het schijnt dat Tim toch gewoon in de Excel versie werkt...',
  ],

  '/poulefase': [
    '{naam} heeft al 3 keer zijn poule-voorspelling veranderd',
    'Psst… {naam} heeft hier een X en 2 - 2 ingevuld',
  ],

  '/fantasy': [
    'Kies eens een originele speler, deze zie ik bij iedereen.',
    'Deze groep lijkt me niet divers en inclusief genoeg voor deze tijd…',
    'Barthold schijnt alleen Ajacieden te kiezen',
  ],

  '/knockout': [
    'Haïti wordt door de bookies als dark horse beschouwd',
    'Voetbal is een spel van 11 tegen 11 en uiteindelijk winnen de...',
  ],

  '/oranje': [
    'Kom eens met een originele vraag...',
  ],
}
