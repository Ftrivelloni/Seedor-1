import UserSetupForm from "../../components/user-setup-form"
import Header from "../../components/header"

export default function UserSetupPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen flex items-center justify-center bg-background p-6 pt-25">
        <UserSetupForm userType="module-user" />
      </main>
    </>
  )
}
