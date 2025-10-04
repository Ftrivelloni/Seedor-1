import RegisterTenantFormEnhanced from "../../components/register-tenant-form-enhanced"
import Header from "../../components/header"

export default function RegisterTenantPage() {
  return (
      <>
          <Header />
          <main className="min-h-screen flex items-center justify-center bg-background p-6 pt-25">
          <RegisterTenantFormEnhanced />
      </main>
      </>

  )
}
