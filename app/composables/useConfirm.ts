export interface ConfirmOptions {
  title: string
  message: string
  confirmLabel: string
  cancelLabel?: string
  danger?: boolean
}

const current = shallowRef<(ConfirmOptions & { resolve: (accepted: boolean) => void }) | null>(null)

export function useConfirm() {
  return {
    current,
    confirm: (options: ConfirmOptions) =>
      new Promise<boolean>((resolve) => {
        current.value = { ...options, resolve }
      }),
    settle(accepted: boolean) {
      current.value?.resolve(accepted)
      current.value = null
    }
  }
}
