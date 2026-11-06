export const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)

export function normalize(value: string) {
  return value.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()
}

export function matches(query: string, ...fields: (string | null | undefined)[]) {
  const term = normalize(query.trim())
  return !term || fields.some(field => field && normalize(field).includes(term))
}

export function initials(name: string) {
  const words = name.trim().split(/[\s@.]+/).filter(Boolean)
  return ((words[0]?.[0] ?? '') + (words[1]?.[0] ?? '')).toUpperCase()
}

export function plural(count: number, singular: string, pluralForm: string) {
  return `${count.toLocaleString('pt-BR')} ${count === 1 ? singular : pluralForm}`
}

/** Baixa um CSV separado por ";", que o Excel em pt-BR abre em colunas. */
export function downloadCsv(filename: string, rows: (string | number | null)[][]) {
  const escapeCell = (cell: string | number | null) => {
    const text = String(cell ?? '')
    // Impede que planilhas executem como fórmula um valor digitado por usuários.
    const safe = /^[=+\-@]/.test(text) ? `'${text}` : text
    return `"${safe.replace(/"/g, '""')}"`
  }
  const content = rows.map(row => row.map(escapeCell).join(';')).join('\r\n')
  const url = URL.createObjectURL(new Blob([`﻿${content}`], { type: 'text/csv;charset=utf-8' }))
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}
