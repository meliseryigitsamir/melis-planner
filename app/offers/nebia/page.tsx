'use client'
import { useState, useEffect } from 'react'

const CORRECT_CLIENT = 'nebia'
const CORRECT_PASS = '4889'

export default function NebiaOffer() {
  const [client, setClient] = useState('')
  const [pass, setPass] = useState('')
  const [authed, setAuthed] = useState(false)
  const [error, setError] = useState(false)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem('nebia_auth')
      if (saved === 'ok') setAuthed(true)
    }
    setChecking(false)
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (client.toLowerCase().trim() === CORRECT_CLIENT && pass.trim() === CORRECT_PASS) {
      sessionStorage.setItem('nebia_auth', 'ok')
      setAuthed(true)
      setError(false)
    } else {
      setError(true)
    }
  }

  if (checking) return null

  if (authed) {
    return (
      <iframe
        src="/offers/nebia-content.html"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          border: 'none',
          margin: 0,
          padding: 0,
        }}
        title="LÂL Project × Nebia"
      />
    )
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#faf9f6',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'Inter', system-ui, sans-serif",
    }}>
      <div style={{
        width: '100%',
        maxWidth: 380,
        padding: '48px 36px',
        background: '#fff',
        borderRadius: 14,
        boxShadow: '0 4px 24px rgba(0,0,0,.06)',
        textAlign: 'center',
      }}>
        <div style={{
          fontWeight: 700,
          fontSize: 9,
          letterSpacing: '.55em',
          textTransform: 'uppercase' as const,
          color: '#3b1578',
          marginBottom: 8,
        }}>
          LÂL Project
        </div>
        <h1 style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontWeight: 500,
          fontSize: 26,
          color: '#111118',
          letterSpacing: '-.02em',
          lineHeight: 1.2,
          marginBottom: 4,
        }}>
          Stratejik İletişim Teklifi
        </h1>
        <p style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontStyle: 'italic',
          fontSize: 14,
          color: '#78650d',
          marginBottom: 32,
        }}>
          Gizli Belge
        </p>

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Müşteri adı"
            value={client}
            onChange={e => { setClient(e.target.value); setError(false) }}
            autoComplete="off"
            style={{
              width: '100%',
              padding: '12px 16px',
              border: `1px solid ${error ? '#e8a0b0' : '#e8e5df'}`,
              borderRadius: 8,
              fontSize: 14,
              fontFamily: 'inherit',
              outline: 'none',
              marginBottom: 10,
              background: error ? '#fff1f2' : '#fff',
              transition: 'border-color .2s, background .2s',
            }}
          />
          <input
            type="password"
            placeholder="Şifre"
            value={pass}
            onChange={e => { setPass(e.target.value); setError(false) }}
            autoComplete="off"
            style={{
              width: '100%',
              padding: '12px 16px',
              border: `1px solid ${error ? '#e8a0b0' : '#e8e5df'}`,
              borderRadius: 8,
              fontSize: 14,
              fontFamily: 'inherit',
              outline: 'none',
              marginBottom: error ? 10 : 20,
              background: error ? '#fff1f2' : '#fff',
              transition: 'border-color .2s, background .2s',
            }}
          />
          {error && (
            <p style={{ fontSize: 12, color: '#9f1239', marginBottom: 14 }}>
              Bilgiler eşleşmedi. Lütfen tekrar deneyin.
            </p>
          )}
          <button
            type="submit"
            style={{
              width: '100%',
              padding: '13px 0',
              background: 'linear-gradient(135deg, #3b1578, #6d28d9)',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              letterSpacing: '.03em',
              cursor: 'pointer',
              fontFamily: 'inherit',
              transition: 'opacity .2s',
            }}
          >
            Belgeyi Görüntüle
          </button>
        </form>

        <p style={{
          marginTop: 28,
          fontSize: 10,
          color: '#a1a1aa',
          lineHeight: 1.6,
        }}>
          Bu belge gizlidir ve yalnızca yetkili kişilerin<br />
          erişimine açıktır. © LÂL Project 2026
        </p>
      </div>

      <link
        href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Cormorant+Garamond:ital,wght@0,400;0,500;1,400&display=swap"
        rel="stylesheet"
      />
    </div>
  )
}
