'use client'

interface Props {
  isOpen: boolean
  onClose: () => void
}

const sections = [
  {
    title: 'Mensenrechten & arbeidsomstandigheden',
    body: `[Vul hier jouw tekst in over de arbeidsomstandigheden van migrantenarbeiders in Qatar en de gastlanden van WK 2026, de dodentol, en de aanhoudende zorgen over mensenrechtenschendingen.]`,
  },
  {
    title: 'FIFA: corruptie & governance',
    body: `[Vul hier jouw tekst in over de structurele corruptie binnen FIFA, de Sepp Blatter-era, de strafzaken, en de vraag of er werkelijk iets is veranderd.]`,
  },
  {
    title: 'Locatiekeuze & politiek',
    body: `[Vul hier jouw tekst in over de toewijzing van het WK 2026 aan de VS, Canada en Mexico — en wat dat betekent in de context van grenspolitiek, commerciële belangen en het gebruik van voetbal als soft power.]`,
  },
  {
    title: 'Waarom toch meedoen?',
    body: `[Vul hier jouw persoonlijke overweging in — de spanning tussen genieten van voetbal en het niet willen goedkeuren van de organisatie eromheen.]`,
  },
  {
    title: 'Wat kun je doen?',
    body: `[Vul hier suggesties in: organisaties steunen, petities, bewust consumeren, etc. Eventueel met links.]`,
  },
]

export function FifaInfoDrawer({ isOpen, onClose }: Props) {
  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 z-50 transition-opacity duration-300"
        style={{
          background: 'rgba(0,0,0,0.6)',
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? 'auto' : 'none',
        }}
      />

      {/* Drawer */}
      <div
        className="fixed inset-x-0 bottom-0 z-50 flex flex-col transition-transform duration-300 ease-out"
        style={{
          maxWidth: '430px',
          margin: '0 auto',
          height: '90dvh',
          borderRadius: '1.25rem 1.25rem 0 0',
          background: 'rgba(13,13,13,0.97)',
          backdropFilter: 'blur(16px)',
          transform: isOpen ? 'translateY(0)' : 'translateY(100%)',
        }}
      >
        {/* Header balk */}
        <div className="flex items-center justify-between px-5 py-4 shrink-0" style={{ borderBottom: '1px solid #222' }}>
          <span
            className="font-heading text-sm uppercase tracking-widest"
            style={{ color: '#FF6B00' }}
          >
            WK 2026 — Kanttekeningen
          </span>
          <button
            onClick={onClose}
            className="text-2xl leading-none"
            style={{ color: '#FF6B00' }}
            aria-label="Sluiten"
          >
            ×
          </button>
        </div>

        {/* Scrollbare content */}
        <div className="overflow-y-auto flex-1 px-5 py-6 space-y-8">
          <p className="text-sm leading-relaxed" style={{ color: '#AAA' }}>
            Dit is een poule-app voor vrienden. Tegelijk willen we niet doen alsof dit WK zonder problemen is.
            Hieronder een paar kanttekeningen — niet om het plezier te bederven, maar om het erbij te houden.
          </p>

          {sections.map((s) => (
            <section key={s.title}>
              <h2
                className="font-heading text-base uppercase tracking-wide mb-2"
                style={{ color: '#F0F0F0' }}
              >
                {s.title}
              </h2>
              <p className="text-sm leading-relaxed" style={{ color: '#999' }}>
                {s.body}
              </p>
            </section>
          ))}

          {/* Ademruimte onderaan voor safe area */}
          <div style={{ height: 'env(safe-area-inset-bottom, 1rem)' }} />
        </div>
      </div>
    </>
  )
}
