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

              <section className="relative mx-auto flex min-h-[calc(100vh-64px)] items-center justify-center px-4 py-8 md:grid md:max-w-7xl md:grid-cols-2 md:gap-12 md:py-24">
                  <div className="hidden w-full md:block">

                      <h2 className="mt-6 text-4xl font-extrabold tracking-tight sm:text-5xl">
                          Entrá a tu <span style={{color: '#f87163'}}>cuenta</span>
                      </h2>
                      <div className="mt-3 h-1 w-20 rounded" style={{background: '#f87163', opacity: 0.6}} />

                      <p className="mt-4 max-w-lg" style={{color: '#2a2a2a'}}>
                          Ingresá con tu email y contraseña. ¿Primera vez?{" "}
                          <a href="/register-tenant" className="font-medium hover:underline" style={{color: '#f87163'}}>
                              Creá tu cuenta
                          </a>
                          .
                      </p>

                      <div className="mt-8 rounded-2xl border bg-white p-6 shadow-lg">
                          <p className="text-sm font-semibold" style={{color: '#f87163'}}>Beneficios</p>
                          <ul className="mt-4 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2" style={{color: '#2a2a2a'}}>
                              <li className="flex items-center gap-2">
                                  <span className="size-1.5 rounded-full" style={{background: '#2a2a2a'}} /> Una sola cuenta para el equipo
                              </li>
                              <li className="flex items-center gap-2">
                                  <span className="size-1.5 rounded-full" style={{background: '#2a2a2a'}} /> Permisos y auditoría
                              </li>
                              <li className="flex items-center gap-2">
                                  <span className="size-1.5 rounded-full" style={{background: '#2a2a2a'}} /> Exportación de datos
                              </li>
                              <li className="flex items-center gap-2">
                                  <span className="size-1.5 rounded-full" style={{background: '#2a2a2a'}} /> Web + móvil
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
