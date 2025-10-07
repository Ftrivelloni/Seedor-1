import type { Metadata } from "next";
import LoginForm from "../../components/login-form";
import Image from "next/image";
import Header from "../../components/header";

export const metadata: Metadata = {
  title: "Ingresar — Seedor",
};

export default function LoginPage() {
  return (
      <>
          <Header />

          <main className="relative min-h-[calc(100vh-64px)] overflow-hidden bg-background">
              <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]"
              >
                  <div className="absolute -top-40 left-1/2 h-[42rem] w-[42rem] -translate-x-1/2 rounded-full bg-primary/15 blur-3xl" />
                  <div className="absolute -bottom-40 left-[15%] h-[24rem] w-[24rem] rounded-full bg-secondary/20 blur-3xl" />
                  <div className="absolute -bottom-20 right-[10%] h-[28rem] w-[28rem] rounded-full bg-primary/10 blur-3xl" />
              </div>

              <section className="relative mx-auto grid max-w-7xl grid-cols-1 place-items-center px-6 py-16 md:grid-cols-2 md:gap-12 md:py-24">
                  <div className="hidden w-full md:block">

                      <h2 className="mt-6 text-4xl font-extrabold tracking-tight sm:text-5xl">
                          Entrá a tu <span className="text-primary">cuenta</span>
                      </h2>
                      <div className="mt-3 h-1 w-20 rounded bg-primary/40" />

                      <p className="mt-4 max-w-lg text-muted-foreground">
                          Ingresá con tu email y contraseña. ¿Primera vez?{" "}
                          <a href="/register-tenant" className="font-medium text-primary hover:underline">
                              Creá tu cuenta
                          </a>
                          .
                      </p>

                      <div className="mt-8 rounded-2xl border bg-card/70 p-6 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-card/60">
                          <p className="text-sm text-muted-foreground">Beneficios</p>
                          <ul className="mt-4 grid grid-cols-1 gap-3 text-sm text-muted-foreground sm:grid-cols-2">
                              <li className="flex items-center gap-2">
                                  <span className="size-1.5 rounded-full bg-primary" /> Una sola cuenta para el equipo
                              </li>
                              <li className="flex items-center gap-2">
                                  <span className="size-1.5 rounded-full bg-primary" /> Permisos y auditoría
                              </li>
                              <li className="flex items-center gap-2">
                                  <span className="size-1.5 rounded-full bg-primary" /> Exportación de datos
                              </li>
                              <li className="flex items-center gap-2">
                                  <span className="size-1.5 rounded-full bg-primary" /> Web + móvil
                              </li>
                          </ul>
                      </div>
                  </div>

                  <div className="w-full">
                      <LoginForm />
                  </div>
              </section>
          </main>
      </>

  );
}
