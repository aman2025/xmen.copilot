import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md text-sm ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed',
  {
    variants: {
      variant: {
        default: 'bg-[#7375c3] text-white hover:enabled:bg-[#6567af]',
        destructive: 'bg-destructive text-destructive-foreground hover:enabled:bg-destructive/90',
        outline:
          'border border-input bg-background hover:enabled:bg-accent hover:enabled:text-accent-foreground',
        secondary: 'bg-secondary text-secondary-foreground hover:enabled:bg-secondary/80',
        ghost: 'hover:enabled:bg-accent hover:enabled:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:enabled:underline'
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-7 rounded-md px-2',
        lg: 'h-11 rounded-md px-8',
        icon: 'h-10 w-10'
      }
    },
    defaultVariants: {
      variant: 'default',
      size: 'default'
    }
  }
)

const Button = React.forwardRef(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : 'button'
  return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
})
Button.displayName = 'Button'

export { Button, buttonVariants }
