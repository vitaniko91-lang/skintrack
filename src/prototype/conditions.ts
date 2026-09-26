export interface Conditions {
  signal: boolean
  battery: number
  groupOk: boolean
}

export const DEFAULT_CONDITIONS: Conditions = { signal: true, battery: 72, groupOk: true }

export const LOW_BATTERY = 20

/** Одна строка под статус-баром. Отсутствие сигнала важнее батареи: без него нет свежего прогноза. */
export function statusNotice(c: Conditions): string | null {
  if (!c.signal) return 'No signal · forecast from 06:40, maps offline'
  if (c.battery < LOW_BATTERY) return `Battery ${c.battery}% · GPS every 5 min to last the tour`
  return null
}

export interface CheckItem { id: 'transceivers' | 'signal' | 'plan'; label: string; detail: string; ok: boolean; reason?: string }

export function checkItems(c: Conditions): CheckItem[] {
  return [
    {
      id: 'transceivers',
      label: 'Transceivers',
      ok: c.groupOk,
      detail: c.groupOk ? '3 of 3 sending' : '2 of 3 · Lena: off',
      reason: c.groupOk ? undefined : "Lena's transceiver is off",
    },
    { id: 'signal', label: 'Signal', ok: true, detail: c.signal ? 'Cell 2 bars · SOS ready' : 'No cell · satellite SOS only' },
    { id: 'plan', label: 'Plan shared', ok: true, detail: 'Hörnli hut · back by 15:00' },
  ]
}

export function checkPasses(c: Conditions): boolean {
  return checkItems(c).every((i) => i.ok)
}
