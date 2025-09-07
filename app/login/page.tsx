"use client"

import { useRouter } from "next/navigation"
import { LoginForm } from "../../components/login-form"

export default function LoginPage() {
  const router = useRouter()

  return (
    <main className="min-h-screen flex items-center justify-center bg-background p-4">
    <LoginForm onLoginSuccess={() => router.push("/home")} />
    </main>
  )
}