import { BriefcaseMedical, ClipboardList, HeartPulse, Scissors, Sparkles, Stethoscope } from 'lucide-vue-next'

const ICONS = [Stethoscope, ClipboardList, Sparkles, HeartPulse, Scissors, BriefcaseMedical]
const TONES = ['blue', 'purple', 'orange', 'green'] as const

/** Ícone e cor estáveis por serviço: a API não guarda nenhum dos dois. */
export function serviceStyle(id: string) {
  const hash = [...id].reduce((total, char) => (total * 31 + char.charCodeAt(0)) >>> 0, 7)
  return { icon: ICONS[hash % ICONS.length]!, tone: TONES[hash % TONES.length]! }
}

export function formatDuration(minutes: number) {
  if (minutes < 60) return `${minutes} min`
  const rest = minutes % 60
  return rest ? `${Math.floor(minutes / 60)}h ${rest}min` : `${minutes / 60}h`
}
