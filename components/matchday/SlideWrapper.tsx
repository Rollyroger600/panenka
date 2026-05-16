'use client'
import React, { forwardRef } from 'react'

interface Props {
  title: string
  children: React.ReactNode
  className?: string
  titleFont?: 'heading' | 'accent'
}

// Fixed-size portrait slide that matches the Panenka visual style.
// Width: 390px — matches iPhone viewport and WhatsApp share format.
// The background image is applied globally via globals.css ::before,
// but slides need their own isolated background for PNG export.
export const SlideWrapper = forwardRef<HTMLDivElement, Props>(
  ({ title, children, className = '', titleFont = 'heading' }, ref) => {
    return (
      <div
        ref={ref}
        className={`relative flex flex-col overflow-hidden ${className}`}
        style={{
          width: 390,
          minHeight: 844,
          background: '#0D0D0D',
          backgroundImage: 'url(/Background/1a@4x.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center top',
        }}
      >
        {/* Dark overlay for text readability */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'rgba(0,0,0,0.35)' }}
        />

        {/* Title */}
        <div className="relative z-10 pt-6 pb-2 text-center">
          <h1
            className={`${titleFont === 'accent' ? 'font-accent font-bold' : 'font-heading'} text-white tracking-widest`}
            style={{ fontSize: 32, WebkitTextStroke: '1px rgba(255,107,0,0.6)', textShadow: '2px 2px 0 rgba(255,107,0,0.4)' }}
          >
            {title}
          </h1>
        </div>

        {/* Content */}
        <div className="relative z-10 flex-1 px-3 pb-2">
          {children}
        </div>

        {/* Panenka logo at bottom */}
        <div className="relative z-10 flex justify-center pb-4 pt-2">
          <img
            src="/Logo/Artboard 1@4x.png"
            alt="Panenka"
            style={{ height: 28, opacity: 0.9 }}
          />
        </div>
      </div>
    )
  }
)

SlideWrapper.displayName = 'SlideWrapper'
