"use client";

import { useState } from "react";
import { Mail, User, Phone, Globe, Loader2, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Button } from "../ui/button";

export default function ContactForm() {
  const [firstName, setFirstName] = useState("");
  const [lastName,  setLastName]  = useState("");
  const [country,   setCountry]   = useState("");
  const [email,     setEmail]     = useState("");
  const [phone,     setPhone]     = useState("");
  const [message,   setMessage]   = useState("");

  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);
  const [sent,    setSent]    = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!firstName || !lastName) return setError("Completá tu nombre y apellido");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setError("Ingresá un email válido");

    setLoading(true);
    try {
      await new Promise((r) => setTimeout(r, 700));
      setSent(true);
    } catch (err: any) {
      setError(err?.message || "No se pudo enviar tu mensaje");
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <Card className="mx-auto w-full max-w-2xl rounded-2xl border bg-card/90 shadow-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-3 grid size-12 place-items-center rounded-full bg-primary/10">
            <CheckCircle2 className="size-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">¡Gracias por escribirnos!</CardTitle>
          <CardDescription>Tu consulta fue enviada. Te contactaremos a la brevedad.</CardDescription>
        </CardHeader>
        <CardFooter className="justify-center">
          <Button onClick={() => setSent(false)} variant="outline">Enviar otra consulta</Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="mx-auto w-full max-w-3xl rounded-2xl border bg-card/90 shadow-lg">
      <CardHeader className="pb-4">
        <CardTitle className="text-2xl">Contactanos</CardTitle>
        <CardDescription>Completá el formulario y te escribimos a la brevedad.</CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4" aria-describedby={error ? "contact-error" : undefined}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="firstName">Nombre</Label>
              <div className="relative">
                <Input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} required className="h-11 pl-10" />
                <User className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="lastName">Apellido</Label>
              <div className="relative">
                <Input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} required className="h-11 pl-10" />
                <User className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="country">País</Label>
              <div className="relative">
                <Input id="country" value={country} onChange={(e) => setCountry(e.target.value)} placeholder="Argentina" className="h-11 pl-10" />
                <Globe className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phone">Teléfono</Label>
              <div className="relative">
                <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+54 11 1234-5678" className="h-11 pl-10" />
                <Phone className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              </div>
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="nombre@seedor.com" className="h-11 pl-10" />
              <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="message">Mensaje</Label>
            <textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
              className="min-h-[120px] w-full resize-y rounded-md border bg-background px-3 py-2 text-sm shadow-sm outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-primary/30"
              placeholder="Contanos brevemente sobre tu consulta"
            />
          </div>

          {error && (
            <div id="contact-error" className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}

          <Button type="submit" className="h-11 w-full sm:w-auto" disabled={loading}>
            {loading && <Loader2 className="mr-2 size-4 animate-spin" />} Enviar
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
