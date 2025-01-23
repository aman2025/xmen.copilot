import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export function generateVerificationCode() {
  return Math.floor(100000 + Math.random() * 900000).toString()
}
