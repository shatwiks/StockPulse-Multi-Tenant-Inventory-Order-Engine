import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'StockPulse — Multi-Tenant Inventory & Order Engine',
    short_name: 'StockPulse',
    description: 'Enterprise B2B inventory management platform and high-concurrency POS order engine.',
    start_url: '/',
    display: 'standalone',
    background_color: '#171310',
    theme_color: '#f59e0b',
    icons: [
      {
        src: '/icon-light-32x32.png',
        sizes: '32x32',
        type: 'image/png',
      },
      {
        src: '/icon-dark-32x32.png',
        sizes: '32x32',
        type: 'image/png',
      },
      {
        src: '/apple-icon.png',
        sizes: '180x180',
        type: 'image/png',
      },
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
      },
    ],
  }
}
