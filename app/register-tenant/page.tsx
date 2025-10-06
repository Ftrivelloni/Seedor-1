import RegisterTenantForm from "../../components/register-tenant-form"
import Header from "../../components/header"

export default function RegisterTenantPage() {
  return (
      <>
          <Header />
          <main className="min-h-screen flex items-center justify-center bg-background p-6 pt-25">
          <RegisterTenantForm />
      </main>
      </>

  )
}
