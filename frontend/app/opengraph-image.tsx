import { ImageResponse } from 'next/og'

export const runtime = 'nodejs'
export const alt = 'StockPulse — Multi-Tenant Inventory & Order Engine'
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = 'image/png'

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #171310 0%, #1f1a17 50%, #2b2118 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '80px',
          fontFamily: 'sans-serif',
          color: '#F3E8E2',
          position: 'relative',
        }}
      >
        {/* Subtle radial ambient lighting */}
        <div
          style={{
            position: 'absolute',
            top: '-10%',
            right: '-10%',
            width: '600px',
            height: '600px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(245,158,11,0.2) 0%, rgba(245,158,11,0) 70%)',
          }}
        />

        {/* Top Header Tag */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '56px',
              height: '56px',
              borderRadius: '14px',
              background: '#F59E0B',
              color: '#171310',
              fontSize: '28px',
              fontWeight: 800,
            }}
          >
            ⚡
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '36px', fontWeight: 800, letterSpacing: '-0.03em' }}>
              Stock<span style={{ color: '#F59E0B' }}>Pulse</span>
            </span>
            <span style={{ fontSize: '14px', color: '#D6D3D1', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              Multi-Tenant Inventory &amp; Order Engine
            </span>
          </div>
        </div>

        {/* Main Headline */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '900px' }}>
          <h1
            style={{
              fontSize: '56px',
              fontWeight: 900,
              lineHeight: 1.15,
              letterSpacing: '-0.03em',
              margin: 0,
              color: '#F3E8E2',
            }}
          >
            Zero-Oversell Inventory &amp;{' '}
            <span style={{ color: '#F59E0B' }}>Pessimistic Concurrency Locks.</span>
          </h1>
          <p style={{ fontSize: '24px', color: '#A8A29E', margin: 0, lineHeight: 1.4 }}>
            Row-level multi-tenant isolation, real-time POS order checkout, and sub-millisecond inventory synchronization.
          </p>
        </div>

        {/* Bottom Feature Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderTop: '1px solid rgba(255,255,255,0.15)',
            paddingTop: '32px',
            fontSize: '18px',
            color: '#D6D3D1',
          }}
        >
          <div style={{ display: 'flex', gap: '32px' }}>
            <span>🔒 SELECT ... FOR UPDATE</span>
            <span>🏢 Multi-Tenant Partitioning</span>
            <span>⚡ Next.js 16 + PostgreSQL 16</span>
          </div>
          <span style={{ color: '#FBBF24', fontWeight: 700 }}>v2.4 Live Production</span>
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}
