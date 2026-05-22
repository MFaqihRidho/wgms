import { Link } from 'react-router'
import { FantasyMoon, FantasyFog, FantasyForest } from '../components/fantasy'

/**
 * Landing page navigation cards configuration.
 * This is exported for testing purposes.
 */
export const LANDING_NAV_CARDS = [
  {
    href: "/host",
    title: "The Grimoire",
    subtitle: "Host",
    description: "Invoke the ritual. Assign roles, command the phases, and shepherd the village through night and day.",
    icon: "📜",
  },
  {
    href: "/play",
    title: "The Scroll",
    subtitle: "Player",
    description: "Receive your fate. Join the village with a room code and discover your secret role.",
    icon: "🎴",
  },
  {
    href: "/tv",
    title: "The Omen Board",
    subtitle: "TV",
    description: "Witness the tribunal. Display the village fate for all to see on the great screen.",
    icon: "🔮",
  },
] as const

/**
 * Validates that the landing page has the required structure.
 * Returns true if all required elements are present.
 */
export function validateLandingPageStructure(cards: readonly { readonly subtitle: string }[]): boolean {
  const requiredLabels = ["Host", "Player", "TV"]
  const cardLabels = cards.map(card => card.subtitle)
  return requiredLabels.every(label => cardLabels.includes(label))
}

/**
 * Returns the count of navigation cards.
 * Should always be exactly 3 for the landing page.
 */
export function getNavCardCount(): number {
  return LANDING_NAV_CARDS.length
}

export function HomeRoute() {
  return (
    <main className="landing-page min-h-screen relative overflow-hidden">
      {/* Atmospheric background elements */}
      <FantasyMoon className="right-[10%] top-[5%] opacity-90" />
      <FantasyFog />
      <FantasyForest />

      {/* Main content */}
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-6 py-12">
        {/* Header section */}
        <header className="mb-12 text-center">
          <p className="fantasy-rune text-sm font-semibold text-[#d6a84f] tracking-widest mb-4">
            THE VILLAGE GATEWAY
          </p>
          <h1 className="fantasy-display text-5xl sm:text-7xl font-black text-[#f8e7bd] mb-4">
            WGMS
          </h1>
          <p className="fantasy-display text-2xl sm:text-3xl text-[#d8c7a3] mb-6">
            Werewolf Game Management System
          </p>
          <p className="max-w-xl mx-auto text-lg text-[#a8a29e] leading-relaxed">
            Enter the moonlit village where secrets dwell in shadows. 
            Choose your path—will you guide the ritual, bear a secret role, or bear witness?
          </p>
        </header>

        {/* Navigation tarot cards */}
        <nav className="w-full max-w-4xl">
          <div className="grid gap-6 md:grid-cols-3">
            {LANDING_NAV_CARDS.map((card) => (
              <TarotNavCard
                key={card.href}
                href={card.href}
                title={card.title}
                subtitle={card.subtitle}
                description={card.description}
                icon={card.icon}
              />
            ))}
          </div>
        </nav>

        {/* Footer */}
        <footer className="mt-16 text-center space-y-3">
          <Link
            to="/guide"
            className="inline-flex items-center gap-2 rounded-2xl border border-[#d6a84f]/25 bg-black/30 px-6 py-3 text-sm font-bold text-[#d8c7a3] hover:text-[#f8e7bd] hover:border-[#d6a84f]/50 transition"
          >
            📖 How to Play — Roles &amp; Rules
          </Link>
          <p className="text-sm text-[#78716c]">
            Realtime synchronization powered by ancient magic
          </p>
        </footer>
      </div>
    </main>
  )
}

type TarotNavCardProps = {
  readonly href: string
  readonly title: string
  readonly subtitle: string
  readonly description: string
  readonly icon: string
}

function TarotNavCard({ href, title, subtitle, description, icon }: TarotNavCardProps) {
  return (
    <Link
      to={href}
      className="tarot-nav-card group relative block rounded-3xl p-6 transition-all duration-300 hover:-translate-y-2"
    >
      {/* Card content */}
      <div className="flex flex-col items-center text-center gap-4">
        {/* Icon/sigil */}
        <div className="tarot-nav-icon w-16 h-16 rounded-full flex items-center justify-center text-3xl bg-black/30 border border-[#d6a84f]/30 group-hover:border-[#d6a84f]/60 transition-colors">
          {icon}
        </div>

        {/* Title and subtitle */}
        <div>
          <h2 className="fantasy-display text-2xl font-bold text-[#f8e7bd] mb-1">
            {title}
          </h2>
          <p className="fantasy-rune text-xs text-[#d6a84f] tracking-wider uppercase">
            {subtitle}
          </p>
        </div>

        {/* Description */}
        <p className="text-sm leading-relaxed text-[#a8a29e]">
          {description}
        </p>
      </div>

      {/* Hover glow effect */}
      <div className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
        <div className="absolute inset-0 rounded-3xl bg-linear-to-br from-[#d6a84f]/10 to-transparent" />
      </div>
    </Link>
  )
}
