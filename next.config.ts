import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    '/api/export': [
      './*_WK 2026_Master.xlsx',
      './260428_WK 2026_Master.xlsx',
      './260509_WK 2026_Master.xlsx',
    ],
  },
}

export default nextConfig
