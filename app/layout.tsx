import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import { Suspense } from "react"
import "./globals.css"
import { AuthProvider } from "../lib/auth"
import { AuthErrorHandler } from "../components/auth/AuthErrorHandler"

export const metadata: Metadata = {
  title: "Seedor - Gestión Agropecuaria",
  description: "Plataforma SaaS para la gestión integral de operaciones agropecuarias",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        <AuthErrorHandler>
          <AuthProvider>
            <Suspense fallback={null}>{children}</Suspense>
          </AuthProvider>
        </AuthErrorHandler>
        <Analytics />
      </body>
    </html>
  )
}
