import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    '/api/export': [
      './*_WK 2026_Master.xlsx',
      './*_WK 2026_Master_ASC.xlsx',
    ],
  },
}

export default nextConfig
