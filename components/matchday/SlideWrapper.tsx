'use client'
import React, { forwardRef } from 'react'

interface Props {
  title?: string
  children: React.ReactNode
  className?: string
  titleFont?: 'heading' | 'accent'
  minHeight?: number
  exporting?: boolean
}

// Fixed-size portrait slide that matches the Panenka visual style.
// Width: 390px — matches iPhone viewport and WhatsApp share format.
// Logo is NOT rendered here — it lives as a fixed overlay in MatchdayDrawer
// so it always appears at the same screen position across all slides.
// During PNG export, the logo is temporarily injected into the slide div.
export const SlideWrapper = forwardRef<HTMLDivElement, Props>(
  ({ title, children, className = '', titleFont = 'heading', minHeight, exporting = false }, ref) => {
    return (
      <div
        ref={ref}
        className={`relative flex flex-col ${className}`}
        style={{
          width: 390,
          background: 'transparent',
          paddingBottom: 80,
          ...(exporting
            ? { height: 844, overflow: 'hidden', paddingTop: 16 }
            : { minHeight }),
        }}
      >
        {/* Title */}
        {title && (
          <div className="relative z-10 pt-6 pb-2 text-center">
            <h1
              className={`${titleFont === 'accent' ? 'font-accent font-bold' : 'font-heading'} text-3xl text-white tracking-widest`}
            >
              {title}
            </h1>
          </div>
        )}

        {/* Content */}
        <div className="relative z-10 px-5 pb-0" style={{ flex: 1 }}>
          {children}
        </div>
      </div>
    )
  }
)

SlideWrapper.displayName = 'SlideWrapper'
