import type { Metadata } from "next";
import ContactForm from "../../components/contact/contact-form";

export const metadata: Metadata = { title: "Contactanos — Seedor" };

export default function ContactoPage() {
  return (
    <main className="relative min-h-[calc(100vh-64px)] bg-background">
      <section className="relative mx-auto grid max-w-7xl grid-cols-1 place-items-center px-6 py-16 md:grid-cols-2 md:gap-12 md:py-24">
        {/* Izquierda: copy */}
        <div className="hidden w-full md:block">
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
            Hablemos de tu <span className="text-primary">campo</span>
          </h1>
          <div className="mt-3 h-1 w-20 rounded bg-primary/40" />
          <p className="mt-4 max-w-lg text-muted-foreground">
            Completá el formulario y uno de nuestros ejecutivos se pondrá en contacto a la brevedad.
          </p>

          <div className="mt-8 rounded-2xl border bg-card/80 p-6 shadow-sm">
            <p className="text-sm text-muted-foreground">También podés escribirnos</p>
            <ul className="mt-3 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
              <li><strong>Email:</strong> fernanda@chandlerorchards.com</li>
              <li><strong>WhatsApp:</strong> +54 911 5906-1077</li>
            </ul>
          </div>
        </div>

        {/* Derecha: formulario */}
        <div className="w-full">
          <ContactForm />
        </div>
      </section>
    </main>
  );
}
