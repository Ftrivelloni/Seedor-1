
import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import { Suspense } from "react"
import "./globals.css"
import { UserProvider } from "../components/auth/UserContext"
import { AuthErrorHandler } from "../components/auth/AuthErrorHandler"
import { SessionCleanup } from "../components/auth/SessionCleanup"

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
    <html lang="en">
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        <SessionCleanup />
        <AuthErrorHandler>
          <UserProvider>
            <Suspense fallback={null}>{children}</Suspense>
          </UserProvider>
        </AuthErrorHandler>
        <Analytics />
      </body>
    </html>
  )
}
