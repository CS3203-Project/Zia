import toast from 'react-hot-toast'

/**
 * Toast helpers.
 *
 * Styling deliberately lives in AppToaster (mounted once at the app root) rather
 * than here. These used to paint solid green / red / blue banners with white
 * text, which clashed with the light orange UI and meant a toast looked
 * different depending on which helper raised it. Now they inherit the shared
 * theme, and only the status icon carries colour.
 */

// Success toast
export const showSuccessToast = (message: string): void => {
  toast.success(message)
}

// Error toast
export const showErrorToast = (message: string): void => {
  toast.error(message)
}

// Info toast
export const showInfoToast = (message: string): void => {
  toast(message, { icon: 'ℹ️' })
}

// Warning toast
export const showWarningToast = (message: string): void => {
  toast(message, {
    icon: '⚠️',
    // Amber hairline is the one deviation, so a warning reads as distinct from
    // a neutral message without becoming a solid colour block.
    style: { borderColor: '#fcd34d' },
  })
}

// Loading toast
export const showLoadingToast = (message: string): string => {
  return toast.loading(message) as string
}

// Dismiss toast
export const dismissToast = (toastId: string): void => {
  toast.dismiss(toastId)
}

// Dismiss all toasts
export const dismissAllToasts = (): void => {
  toast.dismiss()
}
