import type { Appointment } from '~/types/api'

export function useAppointmentActions() {
  const { confirm } = useConfirm()
  const toast = useToast()

  /** Retorna true se o agendamento foi cancelado. */
  async function cancelAppointment(appointment: Appointment) {
    const accepted = await confirm({
      title: 'Cancelar agendamento',
      message: 'O horário será liberado. Um agendamento cancelado não pode ser reativado: será preciso criar outro.',
      confirmLabel: 'Cancelar agendamento',
      cancelLabel: 'Voltar',
      danger: true
    })
    if (!accepted) return false
    try {
      await api(`/appointments/${appointment.id}/cancel`, { method: 'POST' })
      toast.success('Agendamento cancelado.')
      return true
    } catch (error) {
      toast.apiError(error)
      return false
    }
  }

  return { cancelAppointment }
}
