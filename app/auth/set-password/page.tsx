import SetPasswordForm from "../../../components/auth/set-password-form"
import Header from "../../../components/header"

export default function SetPasswordPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen flex items-center justify-center bg-background p-6 pt-25">
        <SetPasswordForm />
      </main>
    </>
  )
}