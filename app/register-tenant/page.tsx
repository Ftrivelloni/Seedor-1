import RegisterTenantForm from "../../components/register-tenant-form"

export default function RegisterTenantPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      <h1 className="text-3xl font-bold mb-6 text-primary">Registro de empresa</h1>
      <RegisterTenantForm />
    </main>
  )
}
