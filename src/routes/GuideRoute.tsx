import { Link } from 'react-router'
import { FantasyFog, FantasyForest, FantasyMoon, getRoleIcon } from '../components/fantasy'

type RoleCardProps = {
  icon: string
  name: string
  team: 'wolf' | 'village'
  tagline: string
  description: string
  nightAction: string | null
  tip: string
}

const ROLES: RoleCardProps[] = [
  {
    icon: getRoleIcon('ALPHA_WOLF'),
    name: 'Alpha Wolf',
    team: 'wolf',
    tagline: 'The hidden leader',
    description:
      'The most dangerous wolf. Each night the pack chooses a villager to eliminate. The Alpha Wolf appears as a Villager to the Seer — they cannot be detected by inspection.',
    nightAction: 'Vote with the pack to target a villager.',
    tip: 'Blend in during the day. The Seer cannot expose you.',
  },
  {
    icon: getRoleIcon('WEREWOLF'),
    name: 'Werewolf',
    team: 'wolf',
    tagline: 'Creature of the night',
    description:
      'A wolf who hunts alongside the Alpha. Each night the pack votes on a target. The Werewolf can be detected by the Seer.',
    nightAction: 'Vote with the pack to target a villager.',
    tip: 'Coordinate with the Alpha Wolf. Agree on a target before dawn.',
  },
  {
    icon: getRoleIcon('SEER'),
    name: 'Seer',
    team: 'village',
    tagline: 'The truth-seeker',
    description:
      'Once per night, the Seer may inspect one player and learn whether they are a Villager or a Werewolf. The Alpha Wolf appears as a Villager — only regular Werewolves are revealed.',
    nightAction: 'Inspect one player to learn their alignment.',
    tip: 'Share your findings carefully. Wolves will try to eliminate you.',
  },
  {
    icon: getRoleIcon('BACKUP_SEER'),
    name: 'Backup Seer',
    team: 'village',
    tagline: 'The dormant oracle',
    description:
      'Starts the game as a regular Villager. When the main Seer dies, the Backup Seer awakens at the start of the next night and gains the Seer\'s ability to inspect players.',
    nightAction: 'Inspect one player (only after the main Seer has died).',
    tip: 'Stay quiet early. Your power is most valuable when the Seer is gone.',
  },
  {
    icon: getRoleIcon('MASON'),
    name: 'Mason',
    team: 'village',
    tagline: 'The trusted lodge',
    description:
      'Masons know each other\'s identities from the very start. They have no night action, but their shared knowledge is powerful — they can vouch for each other during the day.',
    nightAction: null,
    tip: 'Use your knowledge to build trust and coordinate votes.',
  },
  {
    icon: getRoleIcon('BODYGUARD'),
    name: 'Bodyguard',
    team: 'village',
    tagline: 'The silent protector',
    description:
      'Each night, the Bodyguard chooses one player to protect. If the wolves target that player, the kill is blocked and nobody dies that night. The Bodyguard can protect themselves.',
    nightAction: 'Choose one player to protect from the wolf attack.',
    tip: 'Protect the Seer or Backup Seer — they are the wolves\' prime targets.',
  },
  {
    icon: getRoleIcon('VILLAGER'),
    name: 'Villager',
    team: 'village',
    tagline: 'The common folk',
    description:
      'No special ability. The Villager\'s power lies in observation, persuasion, and the vote. Pay attention to who defends whom, who deflects suspicion, and who acts out of character.',
    nightAction: null,
    tip: 'Listen carefully during the day. Wolves will try to seem ordinary.',
  },
]

const PHASE_STEPS = [
  {
    phase: 'Day Phase',
    icon: '🌅',
    color: 'text-amber-300',
    border: 'border-amber-500/30',
    bg: 'bg-amber-900/10',
    description:
      'The village wakes and discusses. Anyone can speak, accuse, or defend. This is your chance to find the wolves through logic and social deduction.',
  },
  {
    phase: 'Tribunal',
    icon: '⚖️',
    color: 'text-orange-300',
    border: 'border-orange-500/30',
    bg: 'bg-orange-900/10',
    description:
      'The village votes to eliminate a suspect. A player must receive more than 50% of all alive votes to be eliminated. Ties and sub-majority votes result in no elimination.',
  },
  {
    phase: 'Night Phase',
    icon: '🌑',
    color: 'text-violet-300',
    border: 'border-violet-500/30',
    bg: 'bg-violet-900/10',
    description:
      'Everyone closes their eyes. Wolves choose a target. The Seer inspects a player. The Bodyguard protects someone. All actions happen simultaneously and secretly.',
  },
]

export function GuideRoute() {
  return (
    <main className="fantasy-shell min-h-screen text-slate-100">
      <FantasyFog />
      <FantasyForest />
      <FantasyMoon className="right-[8%] top-[3%] opacity-70" />

      <div className="relative z-10 mx-auto max-w-3xl px-5 py-10">
        {/* Back link */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-[#d6a84f] hover:text-[#f8e7bd] transition mb-8"
        >
          ← Back to Village Gateway
        </Link>

        {/* Header */}
        <header className="mb-12 text-center">
          <p className="fantasy-rune text-xs text-[#d6a84f] tracking-widest mb-3">THE VILLAGE CODEX</p>
          <h1 className="fantasy-display text-4xl font-black text-[#f8e7bd] sm:text-5xl mb-4">
            How to Play
          </h1>
          <p className="text-[#d8c7a3] text-lg leading-relaxed max-w-xl mx-auto">
            A guide to the ritual of Werewolf — roles, phases, and the path to victory.
          </p>
        </header>

        {/* What is Werewolf */}
        <section className="mb-12">
          <h2 className="fantasy-display text-2xl font-bold text-[#f8e7bd] mb-4">What is Werewolf?</h2>
          <div className="fantasy-parchment rounded-2xl p-6 space-y-3 text-[#d8c7a3] leading-relaxed">
            <p>
              Werewolf is a social deduction game where a hidden group of <span className="text-red-300 font-bold">wolves</span> tries
              to eliminate the <span className="text-emerald-300 font-bold">village</span> one by one — while the village tries to
              identify and vote out the wolves before it's too late.
            </p>
            <p>
              The game alternates between <span className="text-amber-300 font-bold">Day</span> (discussion and voting) and{' '}
              <span className="text-violet-300 font-bold">Night</span> (secret actions). Information is scarce and trust is everything.
            </p>
            <p>
              The <span className="text-red-300 font-bold">wolves win</span> when they equal or outnumber the remaining villagers.
              The <span className="text-emerald-300 font-bold">village wins</span> when all wolves are eliminated.
            </p>
          </div>
        </section>

        {/* Game flow */}
        <section className="mb-12">
          <h2 className="fantasy-display text-2xl font-bold text-[#f8e7bd] mb-4">Game Flow</h2>
          <div className="space-y-3">
            {PHASE_STEPS.map((step) => (
              <div key={step.phase} className={`rounded-2xl border ${step.border} ${step.bg} p-5 flex gap-4`}>
                <span className="text-3xl shrink-0">{step.icon}</span>
                <div>
                  <p className={`font-bold text-lg ${step.color} mb-1`}>{step.phase}</p>
                  <p className="text-[#d8c7a3] text-sm leading-relaxed">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-4 text-sm text-[#78716c] text-center">
            The game starts on Day 1. Phases repeat until one side wins.
          </p>
        </section>

        {/* Roles */}
        <section className="mb-12">
          <h2 className="fantasy-display text-2xl font-bold text-[#f8e7bd] mb-2">Roles</h2>
          <p className="text-[#d8c7a3] text-sm mb-6">
            Roles are assigned randomly at the start of each game. Your role is secret — only you can see it.
          </p>

          {/* Wolf team */}
          <div className="mb-6">
            <p className="fantasy-rune text-xs text-red-400 tracking-widest mb-3 uppercase">Wolf Team — wins by outnumbering the village</p>
            <div className="space-y-3">
              {ROLES.filter((r) => r.team === 'wolf').map((role) => (
                <RoleCard key={role.name} {...role} />
              ))}
            </div>
          </div>

          {/* Village team */}
          <div>
            <p className="fantasy-rune text-xs text-emerald-400 tracking-widest mb-3 uppercase">Village Team — wins by eliminating all wolves</p>
            <div className="space-y-3">
              {ROLES.filter((r) => r.team === 'village').map((role) => (
                <RoleCard key={role.name} {...role} />
              ))}
            </div>
          </div>
        </section>

        {/* Quick tips */}
        <section className="mb-12">
          <h2 className="fantasy-display text-2xl font-bold text-[#f8e7bd] mb-4">Quick Tips</h2>
          <div className="fantasy-parchment rounded-2xl p-6">
            <ul className="space-y-3 text-sm text-[#d8c7a3]">
              <li className="flex gap-3"><span className="text-[#d6a84f] shrink-0">→</span><span>The Seer's information is the most valuable in the game. Protect them.</span></li>
              <li className="flex gap-3"><span className="text-[#d6a84f] shrink-0">→</span><span>Wolves know each other. If two players are defending each other suspiciously, they might be a pack.</span></li>
              <li className="flex gap-3"><span className="text-[#d6a84f] shrink-0">→</span><span>A vote requires more than 50% of alive players. Abstaining helps the wolves.</span></li>
              <li className="flex gap-3"><span className="text-[#d6a84f] shrink-0">→</span><span>Masons can publicly confirm each other — use this to build a trusted coalition.</span></li>
              <li className="flex gap-3"><span className="text-[#d6a84f] shrink-0">→</span><span>The Bodyguard should protect whoever the wolves are most likely to target that night.</span></li>
              <li className="flex gap-3"><span className="text-[#d6a84f] shrink-0">→</span><span>The Alpha Wolf cannot be detected by the Seer — don't assume someone is safe just because the Seer cleared them.</span></li>
            </ul>
          </div>
        </section>

        {/* Role availability by player count */}
        <section className="mb-12">
          <h2 className="fantasy-display text-2xl font-bold text-[#f8e7bd] mb-4">Role Distribution</h2>
          <p className="text-[#d8c7a3] text-sm mb-4">Roles are automatically assigned based on player count.</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-[#d8c7a3] border-collapse">
              <thead>
                <tr className="border-b border-[#d6a84f]/20">
                  <th className="text-left py-2 pr-4 text-[#d6a84f] font-bold">Players</th>
                  <th className="text-center py-2 px-2 text-red-400">🐺 Wolves</th>
                  <th className="text-center py-2 px-2 text-violet-300">◉ Seer</th>
                  <th className="text-center py-2 px-2 text-violet-300/60">◎ Backup</th>
                  <th className="text-center py-2 px-2 text-amber-300">△ Mason</th>
                  <th className="text-center py-2 px-2 text-emerald-300">🛡 Guard</th>
                  <th className="text-center py-2 px-2 text-slate-400">✦ Villager</th>
                </tr>
              </thead>
              <tbody>
                {[
                  [4, 1, 1, 0, 0, 0, 2],
                  [5, 1, 1, 0, 0, 0, 3],
                  [6, 2, 1, 0, 0, 0, 3],
                  [7, 2, 1, 1, 0, 0, 3],
                  [8, 2, 1, 1, 2, 0, 2],
                  [9, 3, 1, 1, 2, 1, 1],
                  [10, 3, 1, 1, 3, 1, 1],
                  [11, 3, 1, 1, 3, 1, 2],
                  [12, 4, 1, 1, 3, 1, 2],
                  [13, 4, 1, 1, 3, 1, 3],
                  [14, 4, 1, 1, 3, 1, 4],
                  [15, 5, 1, 1, 3, 1, 4],
                ].map(([players, wolves, seer, backup, mason, guard, villager]) => (
                  <tr key={players} className="border-b border-white/5 hover:bg-white/4">
                    <td className="py-2 pr-4 font-bold text-[#f8e7bd]">{players}</td>
                    <td className="text-center py-2 px-2 text-red-400">{wolves}</td>
                    <td className="text-center py-2 px-2">{seer}</td>
                    <td className="text-center py-2 px-2 text-[#78716c]">{backup || '—'}</td>
                    <td className="text-center py-2 px-2 text-[#78716c]">{mason || '—'}</td>
                    <td className="text-center py-2 px-2 text-[#78716c]">{guard || '—'}</td>
                    <td className="text-center py-2 px-2 text-[#78716c]">{villager}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* CTA */}
        <div className="text-center">
          <Link
            to="/"
            className="inline-block fantasy-button rounded-2xl px-8 py-4 text-lg font-bold min-h-11"
          >
            Back to Village Gateway
          </Link>
        </div>
      </div>
    </main>
  )
}

function RoleCard({ icon, name, team, tagline, description, nightAction, tip }: RoleCardProps) {
  const teamColor = team === 'wolf'
    ? 'border-red-800/40 bg-red-950/10'
    : 'border-emerald-800/30 bg-emerald-950/10'
  const teamBadge = team === 'wolf'
    ? 'bg-red-900/40 text-red-300'
    : 'bg-emerald-900/30 text-emerald-300'

  return (
    <div className={`rounded-2xl border ${teamColor} p-5`}>
      <div className="flex items-start gap-4">
        <span className="text-3xl shrink-0 mt-0.5">{icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h3 className="fantasy-display text-lg font-bold text-[#f8e7bd]">{name}</h3>
            <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${teamBadge}`}>{tagline}</span>
          </div>
          <p className="text-sm text-[#d8c7a3] leading-relaxed mb-3">{description}</p>
          {nightAction && (
            <div className="rounded-xl bg-black/30 px-3 py-2 mb-2">
              <p className="text-xs text-violet-300 font-bold uppercase tracking-widest mb-0.5">Night Action</p>
              <p className="text-sm text-[#d8c7a3]">{nightAction}</p>
            </div>
          )}
          <div className="rounded-xl bg-black/20 px-3 py-2">
            <p className="text-xs text-[#d6a84f] font-bold uppercase tracking-widest mb-0.5">Tip</p>
            <p className="text-sm text-[#d8c7a3]">{tip}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
