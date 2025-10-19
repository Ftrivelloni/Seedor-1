import React from 'react'

export default function SentPage({ searchParams }: any) {
  const params = searchParams || {}
  const email = params.email || ''

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <div className="max-w-md w-full bg-white rounded-2xl border p-8 shadow-lg text-center">
        <h1 className="text-2xl font-bold text-slate-800 mb-4">Invitación enviada</h1>
        <p className="text-slate-600 mb-6">Se envió un enlace de invitación a:</p>
        <p className="text-[#81C101] font-semibold mb-6">{email}</p>
        <p className="text-sm text-slate-500">Revisá tu casilla y seguí el enlace para completar la configuración del administrador.</p>
      </div>
    </div>
  )
}
