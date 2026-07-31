import { Toast as ToastPrimitive } from '@base-ui/react/toast'

const createToastManager = ToastPrimitive.createToastManager
const toast = createToastManager()
const useToastManager = ToastPrimitive.useToastManager

export { createToastManager, toast, useToastManager }
