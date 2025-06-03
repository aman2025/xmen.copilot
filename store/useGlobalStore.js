import { create } from 'zustand'

const useGlobalStore = create(() => ({
  // User Information
  user: {
    username: 'ZR',
    email: '42589963@qq.com'
  },
  // System Information
  system: {
    mode: 'ESIM',
    version: '1.0.40'
  }
}))

export default useGlobalStore
