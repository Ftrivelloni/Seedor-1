import type { Metadata } from "next";
import ForgotPasswordForm from "../../components/auth/forgot-password-form";
import { MailCheck, Clock } from "lucide-react";

export const metadata: Metadata = { title: "Olvidé mi contraseña — Seedor" };

export default function ForgotPasswordPage() {
  return (
    <main className="relative min-h-[calc(100vh-64px)] bg-background">
      <section className="relative mx-auto grid max-w-7xl grid-cols-1 place-items-center px-6 py-16 md:grid-cols-2 md:gap-12 md:py-24">
        <div className="hidden w-full md:block">
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
            Recuperá tu <span className="text-primary">acceso</span>
          </h1>
          <div className="mt-3 h-1 w-20 rounded bg-primary/40" />
          <p className="mt-4 max-w-lg text-muted-foreground">
            Ingresá tu email y te enviaremos un enlace para restablecer tu contraseña.
          </p>

          <div className="mt-8 rounded-2xl border bg-card/80 p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                Tips
              </span>
              <div className="h-px flex-1 bg-border/60" />
            </div>

            <ul className="mt-4 grid gap-4 sm:grid-cols-2">
              <li className="flex items-start gap-3">
                <span
                  className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full
                             ring-1 ring-emerald-200 bg-emerald-50 text-emerald-600
                             dark:bg-emerald-950/30 dark:text-emerald-300 dark:ring-emerald-800"
                >
                  <MailCheck className="size-3.5" />
                </span>
                <div className="leading-tight">
                  <p className="font-medium">Revisá spam y promociones</p>
                  <p className="text-sm text-muted-foreground">
                    A veces el correo puede filtrarse en esas bandejas.
                  </p>
                </div>
              </li>

              <li className="flex items-start gap-3">
                <span
                  className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full
                             ring-1 ring-amber-200 bg-amber-50 text-amber-600
                             dark:bg-amber-950/30 dark:text-amber-300 dark:ring-amber-800"
                >
                  <Clock className="size-3.5" />
                </span>
                <div className="leading-tight">
                  <p className="font-medium">El enlace tiene vencimiento</p>
                  <p className="text-sm text-muted-foreground">
                    Usalo ni bien lo recibas por seguridad.
                  </p>
                </div>
              </li>
            </ul>
          </div>
        </div>

        <div className="w-full">
          <ForgotPasswordForm />
        </div>
      </section>
    </main>
  );
}
