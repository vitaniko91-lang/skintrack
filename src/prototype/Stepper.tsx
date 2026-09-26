import { SCREENS, type ScreenId } from './machine'

export function Stepper({ current, onGo }: { current: ScreenId; onGo: (id: ScreenId) => void }) {
  return (
    <ol className="space-y-2">
      {SCREENS.map((s, i) => (
        <li key={s.id}>
          <button
            type="button"
            aria-current={current === s.id ? 'step' : undefined}
            onClick={() => onGo(s.id)}
            className="flex min-h-14 w-full items-start gap-4 rounded-[20px] p-4 text-left transition-colors duration-200 hover:bg-ground-1 aria-[current=step]:bg-ground-1 aria-[current=step]:ring-1 aria-[current=step]:ring-accent/40"
          >
            <span className="font-mono text-sm tabular-nums text-accent">0{i + 1}</span>
            <span>
              <span className="block text-lg font-semibold">{s.step}</span>
              <span className="mt-1 block text-sm text-muted">{s.hint}</span>
            </span>
          </button>
        </li>
      ))}
    </ol>
  )
}
