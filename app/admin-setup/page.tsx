import AdminSetupForm from "../../components/admin-setup-form"
import Header from "../../components/header"

export default function AdminSetupPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen flex items-center justify-center bg-background p-6 pt-25">
        <AdminSetupForm />
      </main>
    </>
  )
}