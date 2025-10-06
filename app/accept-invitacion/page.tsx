import AcceptInvitationForm from "../../components/accept-invitation-form"
import Header from "../../components/header"

export default function AcceptInvitationPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen flex items-center justify-center bg-background p-6 pt-25">
        <AcceptInvitationForm />
      </main>
    </>
  )
}