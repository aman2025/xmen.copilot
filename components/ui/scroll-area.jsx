'use client'

import * as React from 'react'
import * as ScrollAreaPrimitive from '@radix-ui/react-scroll-area'
import { cn } from '@/lib/utils'

/**
 * ScrollArea Component
 * A custom scrollable container built on Radix UI's ScrollArea primitive
 * @param {string} className - Additional CSS classes to apply
 * @param {React.ReactNode} children - Child elements to render inside the scroll area
 * @param {...props} props - Additional props to pass to the scroll area
 */
const ScrollArea = React.forwardRef(({ className, children, ...props }, ref) => (
  <ScrollAreaPrimitive.Root
    ref={ref}
    className={cn('relative overflow-hidden', className)}
    {...props}
  >
    <ScrollAreaPrimitive.Viewport className="h-full w-full rounded-[inherit]">
      {children}
    </ScrollAreaPrimitive.Viewport>
    <ScrollBar />
    <ScrollAreaPrimitive.Corner />
  </ScrollAreaPrimitive.Root>
))
ScrollArea.displayName = 'ScrollArea'

/**
 * ScrollBar Component
 * Custom scrollbar styling for the ScrollArea
 * @param {string} className - Additional CSS classes to apply
 * @param {Object} props - Additional props to pass to the scrollbar
 */
const ScrollBar = React.forwardRef(({ className, orientation = 'vertical', ...props }, ref) => (
  <ScrollAreaPrimitive.ScrollAreaScrollbar
    ref={ref}
    orientation={orientation}
    className={cn(
      'flex touch-none select-none transition-colors',
      orientation === 'vertical' && [
        'h-full w-[9px] border-l border-l-transparent p-[1px]',
        'absolute right-0 top-0',
      ],
      orientation === 'horizontal' && [
        'h-2.5 border-t border-t-transparent p-[1px]',
        'absolute bottom-0 left-0',
      ],
      className
    )}
    {...props}
  >
    <ScrollAreaPrimitive.ScrollAreaThumb
      className="relative flex-1 rounded-full dark:bg-zinc-800"
      style={{ backgroundColor: '#d1d5db' }}
    />
  </ScrollAreaPrimitive.ScrollAreaScrollbar>
))
ScrollBar.displayName = 'ScrollBar'

export { ScrollArea }
