import { Toast as ToastPrimitive } from '@base-ui/react/toast'

const { createToastManager } = ToastPrimitive
const toast = createToastManager()
const { useToastManager } = ToastPrimitive

export { createToastManager, toast, useToastManager }
