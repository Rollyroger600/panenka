'use client'
import { useState } from 'react'
import Image from 'next/image'
import { useGameStore } from '@/store/gameStore'
import { FlagImage } from '@/components/ui/FlagImage'

const MUTED = '#7e7667'

// ── Slide 2: statische MatchCard demo ────────────────────────────────────────

function DemoMatchCard() {
  return (
    <div className="rounded-xl border border-[#FF6B00] overflow-hidden" style={{ background: 'rgba(22,22,22,0.82)' }}>
      {/* Header */}
      <div className="relative flex flex-col items-center px-3 py-2.5" style={{ background: 'rgba(10,10,10,0.75)' }}>
        <div className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-9 flex items-center justify-center rounded-lg border border-[#3a3a3a] font-heading text-sm font-bold text-white" style={{ background: 'rgba(37,37,37,0.8)' }}>
          # 10
        </div>
        <div className="flex items-center gap-2">
          <FlagImage country="Nederland" size={24} />
          <span className="font-accent font-light text-sm text-white">NED</span>
          <span className="font-heading font-bold" style={{ color: MUTED }}>-</span>
          <span className="font-accent font-light text-sm text-white">ARG</span>
          <FlagImage country="Argentinië" size={24} />
        </div>
        <p className="font-heading font-light text-xs uppercase tracking-widest mt-0.5" style={{ color: MUTED }}>
          15 jun · Rose Bowl
        </p>
      </div>

      {/* Input row */}
      <div className="flex justify-between items-start px-2 pt-2 pb-2">
        {/* Tokens */}
        <div className="flex flex-col items-center gap-1">
          <span className="font-heading text-sm font-bold uppercase tracking-wider text-center" style={{ color: MUTED }}>Tokens</span>
          <div className="font-heading h-9 w-10 rounded-lg text-sm font-bold flex items-center justify-center border bg-[#FF6B00] border-[#FF6B00] text-white">3</div>
        </div>

        {/* Toto + Quote */}
        <div className="flex items-start gap-1">
          <div className="flex flex-col items-center gap-1">
            <span className="font-heading text-sm font-bold uppercase tracking-wider text-center" style={{ color: MUTED }}>Toto</span>
            <div className="flex gap-1">
              <div className="h-9 w-9 rounded-lg text-sm font-heading font-bold flex items-center justify-center bg-[#FF6B00] border border-[#FF6B00] text-white">1</div>
              <div className="h-9 w-9 rounded-lg text-sm font-heading font-bold flex items-center justify-center border border-[#3a3a3a]" style={{ color: MUTED }}>X</div>
              <div className="h-9 w-9 rounded-lg text-sm font-heading font-bold flex items-center justify-center border border-[#3a3a3a]" style={{ color: MUTED }}>2</div>
            </div>
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className="font-heading text-sm font-bold uppercase tracking-wider text-center" style={{ color: MUTED }}>Quote</span>
            <span className="relative h-9 w-9 flex items-center justify-center font-heading text-sm font-bold rounded-lg border border-[#FF6B00] text-[#FF6B00]">1.72</span>
          </div>
        </div>

        {/* Uitslag + Quote */}
        <div className="flex items-start gap-1">
          <div className="flex flex-col items-center gap-1">
            <span className="font-heading text-sm font-bold uppercase tracking-wider text-center" style={{ color: MUTED }}>Uitslag</span>
            <div className="font-heading h-9 w-14 rounded-lg text-sm font-bold flex items-center justify-center border bg-[#FF6B00] border-[#FF6B00] text-white">2-1</div>
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className="font-heading text-sm font-bold uppercase tracking-wider text-center" style={{ color: MUTED }}>Quote</span>
            <span className="h-9 w-9 flex items-center justify-center font-heading text-sm font-bold rounded-lg border border-[#FF6B00] text-[#FF6B00]">8.50</span>
          </div>
        </div>
      </div>

      {/* Max score */}
      <div className="px-2 pb-2 flex justify-end">
        <span className="font-heading text-sm font-bold uppercase tracking-widest" style={{ color: MUTED }}>
          Max. score <span className="text-[#FF6B00]">30.7 pts</span>
        </span>
      </div>
    </div>
  )
}

// ── Slide 3: statische KO-tegels demo ────────────────────────────────────────

const KO_DEMO = [
  { country: 'Nederland',  abbrev: 'NED', quote: '1.72', tok: 5 },
  { country: 'Argentinië', abbrev: 'ARG', quote: '1.33', tok: 3 },
  { country: 'Brazilië',   abbrev: 'BRA', quote: '1.18', tok: 4 },
  { country: 'Frankrijk',  abbrev: 'FRA', quote: '1.40', tok: 3 },
]

function DemoKOTile({ country, abbrev, quote, tok }: typeof KO_DEMO[0]) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative w-full aspect-square rounded-xl flex flex-col items-center justify-center border border-[#FF6B00] bg-[#1e1e1e]">
        <FlagImage country={country} size={28} />
        <span className="font-accent font-light text-[11px] text-white mt-1 leading-none">{abbrev}</span>
        <span className="font-heading text-sm font-bold text-[#FF6B00] mt-0.5">{quote}</span>
      </div>
      <div className="flex gap-0.5 items-center">
        <div className="h-5 w-5 rounded bg-[#252525] text-[#aaa] text-xs font-bold flex items-center justify-center">−</div>
        <div className="font-heading text-xs font-bold text-[#FF6B00] w-4 text-center">{tok}</div>
        <div className="h-5 w-5 rounded bg-[#252525] text-[#aaa] text-xs font-bold flex items-center justify-center">+</div>
      </div>
    </div>
  )
}

// ── Slide definitie ───────────────────────────────────────────────────────────

const SLIDES = [
  // 0 — Welkom
  {
    content: () => (
      <div className="flex flex-col items-center gap-6 py-4">
        <Image
          src="/Logo/Artboard 1@4x.png"
          alt="Panenka"
          width={200}
          height={80}
          style={{ objectFit: 'contain' }}
        />
        <div className="text-center space-y-3">
          <h2 className="font-heading text-xl uppercase tracking-widest text-white">
            Welkom bij Panenka<br />
            <span style={{ color: '#FF6B00' }}>WK 2026</span>
          </h2>
          <p className="text-sm leading-relaxed" style={{ color: '#aaa' }}>
            Voorspel wedstrijden, zet tokens in en strijd met je fantasy team om de beste score.
            Deze korte uitleg laat zien hoe het werkt.
          </p>
        </div>
      </div>
    ),
  },

  // 1 — Tokens
  {
    content: () => (
      <div className="flex flex-col gap-4">
        <div>
          <h2 className="font-heading text-base uppercase tracking-widest text-white mb-1">Tokens</h2>
          <p className="text-xs leading-relaxed" style={{ color: '#aaa' }}>
            Iedere deelnemer heeft een budget aan tokens en kan zelf beslissen waar hij of zij de tokens wil inzetten.
            Dit kan bij het voorspellen van de wedstrijden, of bij het voorspellen van doorgaande landen in de knockoutfase.
          </p>
        </div>

        {/* Header demo */}
        <div className="rounded-xl overflow-hidden border border-[#2a2a2a]" style={{ background: 'rgba(13,13,13,0.97)' }}>
          <div className="flex flex-col items-center px-4 py-3">
            <img
              src="/Logo/Artboard 1@4x.png"
              alt="Panenka"
              style={{ height: '2rem', objectFit: 'contain' }}
            />
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm font-bold text-white">Jan</span>
              <span style={{ color: '#555' }}>|</span>
              <span className="font-heading font-bold text-sm text-[#FF6B00]">214 tokens over</span>
              <button
                className="w-6 h-6 rounded-full border border-[#333] flex items-center justify-center font-heading text-xs font-bold ml-1"
                style={{ color: '#555' }}
              >?</button>
            </div>
          </div>

        </div>

        <div className="rounded-xl border border-[#2a2a2a] px-3 py-2.5" style={{ background: 'rgba(10,10,10,0.6)' }}>
          <p className="text-xs leading-relaxed" style={{ color: '#aaa' }}>
            Je ziet je resterende tokens altijd bovenaan in de header, naast je naam.
          </p>
        </div>
      </div>
    ),
  },

  // 3 — Wedstrijden (was 1)
  {
    content: () => (
      <div className="flex flex-col gap-4">
        <div>
          <h2 className="font-heading text-base uppercase tracking-widest text-white mb-1">Wedstrijden</h2>
          <p className="text-xs leading-relaxed" style={{ color: '#aaa' }}>
            Per wedstrijd vul je <span className="text-white font-bold">3 dingen</span> in:
          </p>
          <ul className="mt-2 space-y-1 text-xs" style={{ color: '#aaa' }}>
            <li><span className="text-[#FF6B00] font-bold">Tokens</span> — jouw inzet op deze wedstrijd (min 1–max 6)</li>
            <li><span className="text-[#FF6B00] font-bold">Toto</span> — wie wint? 1 / X / 2</li>
            <li><span className="text-[#FF6B00] font-bold">Uitslag</span> — de exacte eindstand na 90 minuten</li>
          </ul>
        </div>
        <DemoMatchCard />
        <div className="rounded-xl border border-[#2a2a2a] px-3 py-2.5" style={{ background: 'rgba(10,10,10,0.6)' }}>
          <p className="text-xs leading-relaxed" style={{ color: '#aaa' }}>
            De quoteringen komen van Unibet en corresponderen met de gekozen toto en uitslag. Je kunt meer punten verdienen met een gewaagdere voorspelling, of juist op safe spelen. De quoteringen worden iedere dag geüpdatet tot de deadline op <span className="text-white font-bold">9 juni</span> — daarna staan ze vast voor iedereen.
          </p>
        </div>
        <div className="rounded-xl border border-[#2a2a2a] px-3 py-2.5 space-y-1.5" style={{ background: 'rgba(10,10,10,0.6)' }}>
          <p className="text-xs font-bold text-white">Puntentelling per wedstrijd:</p>
          <p className="text-xs" style={{ color: '#aaa' }}>
            Toto correct → <span className="text-[#FF6B00] font-bold">tokens × quote toto</span>
          </p>
          <p className="text-xs" style={{ color: '#aaa' }}>
            Uitslag correct → <span className="text-[#FF6B00] font-bold">tokens × quote uitslag</span>
          </p>
          <p className="text-xs leading-relaxed mt-1" style={{ color: '#aaa' }}>
            Totaal = <span className="text-white font-bold">(tokens × quote toto) + (tokens × quote uitslag)</span>.{' '}
            Spreid je kansen tussen toto en uitslag, of ga je all-in?
          </p>
        </div>
      </div>
    ),
  },

  // 2 — Knockout
  {
    content: () => (
      <div className="flex flex-col gap-4">
        <div>
          <h2 className="font-heading text-base uppercase tracking-widest text-white mb-1">Knockout</h2>
          <p className="text-xs leading-relaxed" style={{ color: '#aaa' }}>
            Voorspel welke landen doorstoten naar de verschillende knockout rondes. Vul eerst 12 poulewinnaars, 12 nummers 2 en de 8 beste nummers 3 in. Daarna vul je de ronde van 16 in tot en met de voorspelde winnaar van het toernooi.
          </p>
        </div>

        {/* Demo KO tiles */}
        <div className="rounded-xl border border-[#2a2a2a] overflow-hidden" style={{ background: 'rgba(22,22,22,0.82)' }}>
          <div className="px-4 py-2.5 flex items-center justify-between" style={{ background: 'rgba(10,10,10,0.75)' }}>
            <span className="text-sm font-bold text-white">Poulewinnaars</span>
            <span className="text-xs font-bold text-[#FF6B00]">4 / 12</span>
          </div>
          <div className="p-3 grid grid-cols-4 gap-2">
            {KO_DEMO.map((d) => <DemoKOTile key={d.country} {...d} />)}
          </div>
        </div>

        <div className="rounded-xl border border-[#2a2a2a] px-3 py-2.5" style={{ background: 'rgba(10,10,10,0.6)' }}>
          <p className="text-xs leading-relaxed" style={{ color: '#aaa' }}>
            Je voorspelt per ronde alle landen die jij denkt dat doorgaan. Per land zet je tokens in en zie je de corresponderende quotering. Je kunt meer punten verdienen met het voorspellen van een underdog, of juist gaan voor de gevestigde namen. De quoteringen worden iedere dag geüpdatet tot de deadline op <span className="text-white font-bold">9 juni</span> — daarna staan ze vast voor iedereen.
          </p>
        </div>
        <div className="rounded-xl border border-[#2a2a2a] px-3 py-2.5 space-y-1.5" style={{ background: 'rgba(10,10,10,0.6)' }}>
          <p className="text-xs font-bold text-white">Puntentelling voorspelde landen:</p>
          <p className="text-xs leading-relaxed" style={{ color: '#aaa' }}>
            Correct op de juiste plek → <span className="text-[#FF6B00] font-bold">tokens × corresponderende quotering</span>.
          </p>
          <p className="text-xs leading-relaxed" style={{ color: '#aaa' }}>
            Correct, maar niet op de juiste plek (bijv. een poulewinnaar die als nummer 2 doorgaat) → <span className="text-[#FF6B00] font-bold">tokens × quotering 'kwalificeert zich voor knockoutfase'</span>.
          </p>
        </div>
      </div>
    ),
  },

  // 3 — Fantasy
  {
    content: () => (
      <div className="flex flex-col gap-4">
        <div>
          <h2 className="font-heading text-base uppercase tracking-widest text-white mb-1">Fantasy</h2>
          <p className="text-xs leading-relaxed" style={{ color: '#aaa' }}>
            Stel een WK-elftal samen op basis van selectiecriteria.
          </p>
        </div>

        <div className="space-y-2">
          <div className="rounded-xl border border-[#2a2a2a] px-3 py-3" style={{ background: 'rgba(22,22,22,0.82)' }}>
            <p className="text-xs font-bold text-white mb-1.5">Selectiecriteria</p>
            <ul className="space-y-0.5 text-xs" style={{ color: '#aaa' }}>
              <li>· Max 1 speler per land</li>
              <li>· Max 3 spelers per confederatie</li>
              <li>· Max 1 speler per club</li>
              <li>· Max 3 spelers per competitie</li>
              <li>· Min 4 spelers U22</li>
            </ul>
          </div>

          <div className="rounded-xl border border-[#2a2a2a] px-3 py-3" style={{ background: 'rgba(22,22,22,0.82)' }}>
            <p className="text-xs font-bold text-white mb-1">Hoe verdien je punten?</p>
            <p className="text-xs leading-relaxed" style={{ color: '#aaa' }}>
              Elk doelpunt of assist van een speler levert op:{' '}
              <span className="text-[#FF6B00] font-bold">(goals + assists) × speler-quote</span>
            </p>
          </div>

          <div className="rounded-xl border border-[#2a2a2a] overflow-hidden" style={{ background: 'rgba(22,22,22,0.82)' }}>
            {/* Player row */}
            <div className="flex items-center gap-3 px-3 py-2.5">
              <span className="text-sm font-bold w-6 text-right shrink-0" style={{ color: '#888' }}>#7</span>
              <FlagImage country="Nederland" size={28} />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold text-white truncate">X. Simons</div>
                <div className="text-xs" style={{ color: '#888' }}>Nederland · RB Leipzig</div>
              </div>
              <span className="text-sm font-bold text-white mr-1">83</span>
              <span className="text-sm font-bold px-2 py-0.5 rounded-lg border border-[#FF6B00] text-[#FF6B00]">2.15</span>
            </div>
            {/* Expanded info */}
            <div className="mx-2 mb-2 rounded-xl border border-[#2a2a2a] p-3" style={{ background: '#111' }}>
              <div className="flex items-center gap-2 mb-2">
                <FlagImage country="Nederland" size={18} />
                <span className="text-sm font-bold text-white">Xavi Simons</span>
                <span className="ml-auto text-sm font-bold text-white">Quote 2.15</span>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { label: 'Overall', value: '83' },
                  { label: 'Positie', value: 'MF' },
                  { label: 'Leeftijd WK', value: '23' },
                  { label: 'Club', value: 'RB Leipzig' },
                  { label: 'Competitie', value: 'Bundesliga' },
                  { label: 'Conf.', value: 'UEFA' },
                ].map(({ label, value }) => (
                  <div key={label} className="rounded-lg px-2 py-1.5" style={{ background: '#1a1a1a' }}>
                    <div className="text-[9px] uppercase" style={{ color: '#888' }}>{label}</div>
                    <div className="text-xs font-bold truncate" style={{ color: '#ccc' }}>{value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-[#2a2a2a] px-3 py-3" style={{ background: 'rgba(22,22,22,0.82)' }}>
            <p className="text-xs font-bold text-white mb-1.5">Hoe wordt de speler-quote bepaald?</p>
            <div className="space-y-1 text-xs" style={{ color: '#aaa' }}>
              <div className="flex items-center justify-between">
                <span>· Spelerkwaliteit (overall)</span>
                <span className="text-white font-bold">Overall 83</span>
              </div>
              <div className="flex items-center justify-between">
                <span>· FIFA-ranking van het land (teamQuote)</span>
                <span className="text-white font-bold">NED #7</span>
              </div>
              <div className="flex items-center justify-between">
                <span>· R16-quotering (Unibet)</span>
                <span className="text-[#FF6B00] font-bold">1.72</span>
              </div>
              <div className="mt-1.5 pt-1.5 border-t border-[#2a2a2a] space-y-1">
                <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#555' }}>Formule</div>
                <div className="font-heading text-xs text-white leading-relaxed">
                  (100 / overall)² × teamQuote × (1 + r16 / 6.5)
                </div>
                <div className="flex items-center justify-between pt-0.5">
                  <span className="text-white">→ Spelerquote</span>
                  <span className="text-[#FF6B00] font-bold">2.15</span>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-[#2a2a2a] px-3 py-2.5" style={{ background: 'rgba(10,10,10,0.6)' }}>
            <p className="text-xs leading-relaxed" style={{ color: '#aaa' }}>
              De totaalscore van je fantasy team is een opsomming van de punten van alle 15 spelers.
            </p>
          </div>
        </div>
      </div>
    ),
  },

  // 4 — Oranje
  {
    content: () => (
      <div className="flex flex-col gap-4">
        <div>
          <h2 className="font-heading text-base uppercase tracking-widest text-white mb-1">
            <FlagImage country="Nederland" size={20} className="inline mr-1.5 align-middle" />
            Oranje
          </h2>
          <p className="text-xs leading-relaxed" style={{ color: '#aaa' }}>
            Rond de drie Oranje-wedstrijden draait een eigen voorspelspel.
          </p>
        </div>

        <div className="space-y-2">
          <div className="rounded-xl border border-[#2a2a2a] px-3 py-3" style={{ background: 'rgba(22,22,22,0.82)' }}>
            <p className="text-xs font-bold text-white mb-1">Stap 1 — Vóór de deadline (eind mei)</p>
            <p className="text-xs leading-relaxed" style={{ color: '#aaa' }}>
              Elke deelnemer stelt <span className="text-[#FF6B00] font-bold">3 eigen vragen</span> op over een Oranje-wedstrijd.
            </p>
          </div>

          <div className="rounded-xl border border-[#2a2a2a] px-3 py-3" style={{ background: 'rgba(22,22,22,0.82)' }}>
            <p className="text-xs font-bold text-white mb-1">Stap 2 — Daarna: 45 voorspellingen</p>
            <p className="text-xs leading-relaxed" style={{ color: '#aaa' }}>
              15 deelnemers × 3 wedstrijden = <span className="text-[#FF6B00] font-bold">45 vragen</span> om in te vullen.
              Per correct antwoord: <span className="text-white font-bold">0,5 token</span>.
            </p>
          </div>

          <div className="rounded-xl border border-[#2a2a2a] px-3 py-3" style={{ background: 'rgba(22,22,22,0.82)' }}>
            <p className="text-xs font-bold text-[#FF6B00] mb-1">Tokens → Knockout</p>
            <p className="text-xs leading-relaxed" style={{ color: '#aaa' }}>
              Verdiende tokens kun je inzetten in de knockoutfase.
            </p>
          </div>
        </div>
      </div>
    ),
  },

  // 5 — Puntentelling
  {
    content: () => (
      <div className="flex flex-col gap-4">
        <div>
          <h2 className="font-heading text-base uppercase tracking-widest text-white mb-1">Puntentelling</h2>
          <p className="text-xs leading-relaxed" style={{ color: '#aaa' }}>
            Jouw totaalscore bestaat uit drie onderdelen:
          </p>
        </div>

        <div className="space-y-2">
          {[
            { label: 'Wedstrijden', desc: 'Toto & uitslag voorspellingen in de poulefase' },
            { label: 'Knockout', desc: 'Landen in de KO-boom, met tokens ingezet per ronde' },
            { label: 'Fantasy', desc: 'Goals & assists van jouw gekozen elftal' },
          ].map(({ label, desc }) => (
            <div key={label} className="rounded-xl border border-[#2a2a2a] px-3 py-2.5 flex items-start gap-2.5" style={{ background: 'rgba(22,22,22,0.82)' }}>
              <span className="font-heading text-xs font-bold text-[#FF6B00] uppercase tracking-wider mt-0.5 shrink-0">{label}</span>
              <span className="text-xs leading-relaxed" style={{ color: '#aaa' }}>{desc}</span>
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-[#2a2a2a] px-3 py-2.5" style={{ background: 'rgba(10,10,10,0.6)' }}>
          <p className="text-xs leading-relaxed" style={{ color: '#aaa' }}>
            Oranje levert <span className="text-white font-bold">tokens</span> op die je inzet in de knockout — geen aparte scorecategorie.
          </p>
          <p className="text-xs leading-relaxed mt-1" style={{ color: '#aaa' }}>
            De rangschikking wordt later bekendgemaakt.
          </p>
        </div>
      </div>
    ),
  },
]

// ── Hoofdcomponent ────────────────────────────────────────────────────────────

export function OnboardingSlides() {
  const { onboardingOpen, setOnboardingOpen } = useGameStore()
  const [step, setStep] = useState(0)

  function close() {
    localStorage.setItem('onboarding_seen', 'true')
    setOnboardingOpen(false)
    setStep(0)
  }

  const isLast = step === SLIDES.length - 1
  const Slide = SLIDES[step].content

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={close}
        className="fixed inset-0 z-[60] transition-opacity duration-300"
        style={{
          background: 'rgba(0,0,0,0.7)',
          opacity: onboardingOpen ? 1 : 0,
          pointerEvents: onboardingOpen ? 'auto' : 'none',
        }}
      />

      {/* Drawer */}
      <div
        className="fixed inset-x-0 bottom-0 z-[60] flex flex-col transition-transform duration-300 ease-out"
        style={{
          maxWidth: '430px',
          margin: '0 auto',
          height: '92dvh',
          borderRadius: '1.25rem 1.25rem 0 0',
          background: 'rgba(13,13,13,0.97)',
          backdropFilter: 'blur(16px)',
          transform: onboardingOpen ? 'translateY(0)' : 'translateY(100%)',
        }}
      >
        {/* Header */}
        <div className="relative flex items-center justify-center px-5 py-4 shrink-0" style={{ borderBottom: '1px solid #222' }}>
          <span className="font-heading text-sm uppercase tracking-widest" style={{ color: '#FF6B00' }}>
            Hoe werkt het?
          </span>
          <button
            onClick={close}
            className="absolute right-5 text-2xl leading-none"
            style={{ color: '#FF6B00' }}
            aria-label="Sluiten"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 px-5 py-5">
          <Slide />
        </div>

        {/* Navigatie */}
        <div className="shrink-0 px-5 pb-6 pt-3 flex flex-col gap-3" style={{ borderTop: '1px solid #1a1a1a' }}>
          {/* Stap-indicator */}
          <div className="flex justify-center gap-1.5">
            {SLIDES.map((_, i) => (
              <button
                key={i}
                onClick={() => setStep(i)}
                className="rounded-full transition-all duration-200"
                style={{
                  width: i === step ? '1.5rem' : '0.5rem',
                  height: '0.5rem',
                  background: i === step ? '#FF6B00' : '#333',
                }}
                aria-label={`Slide ${i + 1}`}
              />
            ))}
          </div>

          {/* Knoppen */}
          <div className="flex gap-2">
            {step > 0 && (
              <button
                onClick={() => setStep((s) => s - 1)}
                className="flex-1 h-11 rounded-xl border border-[#333] font-heading text-sm uppercase tracking-widest transition-colors hover:border-[#555]"
                style={{ color: '#888' }}
              >
                Terug
              </button>
            )}
            {isLast ? (
              <button
                onClick={close}
                className="flex-1 h-11 rounded-xl font-heading text-sm uppercase tracking-widest transition-colors text-white"
                style={{ background: '#FF6B00' }}
              >
                Let's go!
              </button>
            ) : (
              <button
                onClick={() => setStep((s) => s + 1)}
                className="flex-1 h-11 rounded-xl font-heading text-sm uppercase tracking-widest transition-colors text-white"
                style={{ background: '#FF6B00' }}
              >
                Volgende
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
