import type { Metadata } from "next";
import ResetPasswordForm from "../../components/auth/reset-password-form"; 
export const metadata: Metadata = { title: "Restablecer contraseña — Seedor" };

export default function ResetPasswordPage() {
  return (
    <main className="relative min-h-[calc(100vh-64px)] bg-background">
      <section className="relative mx-auto grid max-w-7xl grid-cols-1 place-items-center px-6 py-16">
        <div className="w-full max-w-xl">
          <ResetPasswordForm />
        </div>
      </section>
    </main>
  );
}
