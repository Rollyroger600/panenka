'use client'

interface Props {
  isOpen: boolean
  onClose: () => void
}

const sections: { title: string; body: string | string[]; source?: string; links?: { text: string; url: string }[] }[] = [
  {
    title: 'Amnesty International | Enkele feiten',
    source: 'Amnesty International',
    body: [
      '“The US Government has deported more than 500,000 people from the USA in 2025 – more than six times as many people than will watch the World Cup final in the MetLife Stadium”',
      '“With many immigrant communities in the USA likely to want to come together to watch the World Cup, and millions of fans travelling from all over the world, ICE and other agencies pose a chilling threat to people living in the US, those traveling to see a game, and players themselves”',
      '“Due to travel bans under the Trump administration, fans from Côte d’Ivoire, Haiti, Iran and Senegal will be unable to travel and enter the US to support their team unless they had valid visas before 1 January 2026. Other fans face intrusive surveillance, with proposals to force visitors to make their social media accounts available for vetting, and screening for ‘anti-Americanism’”',
      '“Despite the astounding numbers of arrests and deportations, neither FIFA nor the US authorities have provided any guarantees that fans and local communities will be safe from ethnic and racial profiling, indiscriminate raids, or unlawful detention and deportation”',
      '“Only four of the 16 host cities have so far published their human rights plans, and none of those that have done so to date say anything about protection from abusive immigration enforcement. This World Cup is no longer the ‘medium risk’ tournament that FIFA once judged it to be – whether it is to protect people from ICE, guarantee the right to protest or prevent homelessness, urgent action is needed to make sure the reality of this World Cup matches its original promise.”',
      '“Mexico experienced a series of World Cup-related protests by residents angry about the disruptions to water supplies, access to land, rising costs and gentrification linked to infrastructure development in host cities. The militarized nature of Mexico’s security mobilization for the tournament brings risks that further protests could be repressed”',
      '“With just over 10 weeks until the World Cup kicks off, FIFA’s commitment to a tournament where everyone ‘feels safe, included, and free to exercise their rights’ requires urgent action to ensure the beautiful game is not at risk of an ugly outcome. Members from LGBTQI+ groups in the UK and across Europe have said it is not safe for them to have a visible presence at the tournament”',
      '“While FIFA generates record revenues from the 2026 World Cup, fans, communities, players, journalists and workers cannot be made to pay the price. It is these people – not governments, sponsors or FIFA – to whom football belongs, and their rights must be at the centre of the tournament”',
    ],
  },
  {
    title: 'Links',
    body: [],
    links: [
      { text: 'Amnesty International', url: 'https://www.amnesty.org/en/latest/news/2026/03/global-fifa-and-world-cup-hosts-must-prevent-tournament-becoming-a-threat-to-fans-and-communities/' },
      { text: 'Sports & Rights Alliance', url: 'https://sportandrightsalliance.org/worldcup2026/' },
    ],
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
        <div className="relative flex items-center justify-center px-5 py-4 shrink-0" style={{ borderBottom: '1px solid #222' }}>
          <span
            className="font-heading text-sm uppercase tracking-widest"
            style={{ color: '#FF6B00' }}
          >
            FIFA & de USA, a match made in hell
          </span>
          <button
            onClick={onClose}
            className="absolute right-5 text-2xl leading-none"
            style={{ color: '#FF6B00' }}
            aria-label="Sluiten"
          >
            ×
          </button>
        </div>

        {/* Scrollbare content */}
        <div className="overflow-y-auto flex-1 px-5 py-6 space-y-8 text-center">
          <p className="text-sm leading-relaxed" style={{ color: '#AAA' }}>
            We gaan weer ruim 5 weken genieten van voetbal en dit Panenka spel. Tegelijkertijd stapelen de zwarte bladzijdes zich op in dit dramatische verhaal.
            Hieronder een paar kanttekeningen - niet om het plezier te bederven, maar enige nuance lijkt op zijn plaats.
          </p>

          {sections.map((s) => (
            <section key={s.title}>
              <h2
                className="font-heading text-base uppercase tracking-wide mb-2"
                style={{ color: '#F0F0F0' }}
              >
                {s.title}
              </h2>
              {Array.isArray(s.body)
                ? s.body.map((para, i) => (
                    <p key={i} className="text-sm leading-relaxed mb-3 last:mb-0" style={{ color: '#999' }}>
                      {para}
                    </p>
                  ))
                : <p className="text-sm leading-relaxed" style={{ color: '#999' }}>{s.body}</p>
              }
              {s.source && (
                <p className="text-xs mt-3 italic" style={{ color: '#666' }}>
                  Bron: {s.source}
                </p>
              )}
              {s.links && s.links.length > 0 && (
                <div className="mt-3 space-y-2">
                  {s.links.map((link) => (
                    <a
                      key={link.url}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-sm underline underline-offset-2"
                      style={{ color: '#FF6B00' }}
                    >
                      {link.text}
                    </a>
                  ))}
                </div>
              )}
            </section>
          ))}

          {/* Ademruimte onderaan voor safe area */}
          <div style={{ height: 'env(safe-area-inset-bottom, 1rem)' }} />
        </div>
      </div>
    </>
  )
}