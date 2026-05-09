import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    '/api/export': ['./*_WK 2026_Master.xlsx'],
  },
}

export default nextConfig
