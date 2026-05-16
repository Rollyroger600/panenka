import type { GroupId } from './groups'

export const POPUPS: Record<GroupId, Record<string, string[]>> = {
  og: {
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
  },

  asc: {
    global: [
      'Psst… {naam} heeft zijn voorspellingen net bijgewerkt. Ben jij al klaar?',
      'Weet je zeker dat je het beter weet dan {naam}?',
      'Gerucht: {naam} heeft een inside tip van Ronald K. gekregen.',
      '{naam} kijkt mee. Of voelt het alleen maar zo.',
      'Er is geen participatieprijs hoor, dus neem het even serieus.',
      'Wil je soms laatste worden?',
      'Het schijnt dat Lex de beoogde 4e keeper is...'
    ],
    '/poulefase': [
      '{naam} heeft al 3 keer zijn poule-voorspelling veranderd',
      'Psst… {naam} heeft hier een X en 2 - 2 ingevuld',
    ],
    '/fantasy': [
      'Kies eens een originele speler, deze zie ik bij iedereen.',
      'Deze groep lijkt me niet divers en inclusief genoeg voor deze tijd…',
    ],
    '/knockout': [
      'Haïti wordt door de bookies als dark horse beschouwd',
      'Voetbal is een spel van 11 tegen 11 en uiteindelijk winnen de...',
    ],
    '/oranje': [
      'Kom eens met een originele vraag...',
    ],
  },
}
