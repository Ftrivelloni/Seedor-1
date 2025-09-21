// components/register-tenant-form.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Loader2, Sparkles, Eye, EyeOff, Plus, Minus } from "lucide-react";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Button } from "./ui/button";
import { MODULES, FEATURES, REQUIRED_IDS } from "../lib/features";
import { authService } from "../lib/supabaseAuth";
import { useRouter } from "next/navigation";

// ====== Precios (editables) ======
const BASE_PRICE = 99;
const BASE_USERS_INCLUDED = 5;
const USER_PRICE = 100;
const FEATURE_PRICE = 50;

const OPTIONAL_KEY = "seedor.features.optional";
const FORM_DATA_KEY = "seedor.registration.formData";

// Helper de dinero: "1,234usd"
const fmtNum = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });
const money = (n: number) => `${fmtNum.format(n)}usd`;

export default function RegisterTenantForm() {
    const router = useRouter();

    // Empresa
    const [companyName, setCompanyName] = useState("");
    const [contactName, setContactName] = useState("");
    const [mainCrop, setMainCrop] = useState("");
    const [slug, setSlug] = useState("");

    // Admin user details
    const [adminFullName, setAdminFullName] = useState("");
    const [adminEmail, setAdminEmail] = useState("");
    const [adminPassword, setAdminPassword] = useState("");
    const [adminPhone, setAdminPhone] = useState("");
    const [adminDocumentId, setAdminDocumentId] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    // Usuarios
    const [users, setUsers] = useState<number>(BASE_USERS_INCLUDED);

    // Helpers usuarios (+/-)
    const MIN_USERS = BASE_USERS_INCLUDED;
    const clamp = (n: number, min: number) => Math.max(min, Math.floor(n || 0));
    const incUsers = () => setUsers((u) => u + 1);
    const decUsers = () => setUsers((u) => clamp(u - 1, MIN_USERS));

    // Load form data from localStorage on component mount
    useEffect(() => {
        if (typeof window !== "undefined") {
            const savedFormData = localStorage.getItem(FORM_DATA_KEY);
            if (savedFormData) {
                try {
                    const formData = JSON.parse(savedFormData);
                    setCompanyName(formData.companyName || "");
                    setContactName(formData.contactName || "");
                    setMainCrop(formData.mainCrop || "");
                    setSlug(formData.slug || "");
                    setAdminFullName(formData.adminFullName || "");
                    setAdminEmail(formData.adminEmail || "");
                    setAdminPassword(formData.adminPassword || "");
                    setAdminPhone(formData.adminPhone || "");
                    setAdminDocumentId(formData.adminDocumentId || "");
                    setUsers(formData.users || BASE_USERS_INCLUDED);
                } catch (error) {
                    console.error("Error loading saved form data:", error);
                }
            }
        }
    }, []);

    // Save form data to localStorage whenever form fields change
    const saveFormData = () => {
        if (typeof window !== "undefined") {
            const formData = {
                companyName,
                contactName,
                mainCrop,
                slug,
                adminFullName,
                adminEmail,
                adminPassword,
                adminPhone,
                adminDocumentId,
                users,
            };
            localStorage.setItem(FORM_DATA_KEY, JSON.stringify(formData));
        }
    };

    // Auto-save form data when any field changes
    useEffect(() => {
        saveFormData();
    }, [
        companyName,
        contactName,
        mainCrop,
        slug,
        adminFullName,
        adminEmail,
        adminPassword,
        adminPhone,
        adminDocumentId,
        users,
    ]);

    // Auto-generate slug from company name
    useEffect(() => {
        if (companyName) {
            const generatedSlug = companyName
                .toLowerCase()
                .replace(/[^a-z0-9\s]/g, "")
                .replace(/\s+/g, "-")
                .substring(0, 50);
            setSlug(generatedSlug);
        }
    }, [companyName]);

    // Funcionalidades: obligatorias + opcionales
    const [optional, setOptional] = useState<string[]>([]);
    useEffect(() => {
        const raw =
            typeof window !== "undefined"
                ? localStorage.getItem(OPTIONAL_KEY)
                : null;
        if (raw) {
            try {
                setOptional(JSON.parse(raw));
            } catch {}
        }
    }, []);

    const allSelected = useMemo(() => {
        const set = new Set([...REQUIRED_IDS, ...optional]);
        return FEATURES.filter((f) => set.has(f.id));
    }, [optional]);

    // Precio
    const { extraUsers, subtotalUsers, subtotalFeatures, total } = useMemo(() => {
        const extraUsers = Math.max(0, users - BASE_USERS_INCLUDED);
        const subtotalUsers = extraUsers * USER_PRICE;
        const subtotalFeatures = allSelected.length * FEATURE_PRICE;
        const total = BASE_PRICE + subtotalUsers + subtotalFeatures;
        return { extraUsers, subtotalUsers, subtotalFeatures, total };
    }, [users, allSelected]);

    // Submit
    const [loading, setLoading] = useState(false);
    const [done, setDone] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Function to clear all form data
    const clearFormData = () => {
        if (typeof window !== "undefined") {
            localStorage.removeItem(FORM_DATA_KEY);
            localStorage.removeItem(OPTIONAL_KEY);
        }

        // Reset all form fields
        setCompanyName("");
        setContactName("");
        setMainCrop("");
        setSlug("");
        setAdminFullName("");
        setAdminEmail("");
        setAdminPassword("");
        setAdminPhone("");
        setAdminDocumentId("");
        setUsers(BASE_USERS_INCLUDED);
        setOptional([]);
        setError(null);
    };

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);

        // Validation
        if (!companyName || !contactName || !adminFullName || !adminEmail || !adminPassword) {
            setError("Completá todos los campos obligatorios.");
            return;
        }

        if (adminPassword.length < 8) {
            setError("La contraseña debe tener al menos 8 caracteres.");
            return;
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(adminEmail)) {
            setError("Ingresá un email válido para el administrador.");
            return;
        }

        setLoading(true);

        try {
            // First check if user already exists
            const userCheck = await authService.checkUserExists(adminEmail);

            if (userCheck.exists) {
                setError(
                    `Ya existe un usuario registrado con el email ${adminEmail}. Si creaste esta cuenta anteriormente y hubo un error, contacta con soporte.`
                );
                return;
            }

            const { success, error: createError } = await authService.createTenantWithAdmin({
                tenantName: companyName,
                slug: slug,
                plan: "basico",
                primaryCrop: mainCrop || "general",
                contactEmail: adminEmail,
                adminFullName: adminFullName,
                adminEmail: adminEmail,
                adminPassword: adminPassword,
                adminPhone: adminPhone,
                adminDocumentId: adminDocumentId,
            });

            if (!success || createError) {
                setError(createError || "Error al crear la cuenta");
                return;
            }

            // Clear form data from localStorage after successful registration
            if (typeof window !== "undefined") {
                localStorage.removeItem(FORM_DATA_KEY);
                localStorage.removeItem(OPTIONAL_KEY);
            }

            setDone(true);
        } catch (err: any) {
            setError(err.message || "Error inesperado");
        } finally {
            setLoading(false);
        }
    }

    if (done) {
        return (
            <Card className="mx-auto w-full max-w-xl rounded-2xl border bg-card/90 shadow-lg">
                <CardHeader className="text-center">
                    <div className="mx-auto mb-3 grid size-12 place-items-center rounded-full bg-primary/10">
                        <Check className="size-6 text-primary" />
                    </div>
                    <CardTitle className="text-2xl">¡Empresa creada!</CardTitle>
                    <CardDescription>
                        Tu cuenta ha sido creada exitosamente. Ahora puedes acceder con tu email y contraseña.
                    </CardDescription>
                </CardHeader>
                <CardFooter className="justify-center gap-3">
                    <Button onClick={() => router.push("/login")}>Ir al inicio de sesión</Button>
                    <Button variant="outline" onClick={() => window.location.reload()}>
                        Crear otra empresa
                    </Button>
                </CardFooter>
            </Card>
        );
    }

    const inputStrong =
        "h-11 bg-white border-muted shadow-sm placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-primary/30";

    return (
        <Card className="mx-auto w-full max-w-4xl rounded-2xl border bg-card/90 shadow-lg">
            <CardHeader className="pb-4">
                <CardTitle className="text-2xl">Registro de empresa</CardTitle>
                <CardDescription>
                    Creá tu empresa y cuenta de administrador. El precio base es{" "}
                    <strong>{money(BASE_PRICE)}/mes</strong> e incluye{" "}
                    <strong>{BASE_USERS_INCLUDED}</strong> usuarios.
                </CardDescription>
                <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                    <div className="h-2 w-2 rounded-full bg-green-500"></div>
                    Los datos del formulario se guardan automáticamente
                </div>
            </CardHeader>

            <CardContent>
                <form onSubmit={onSubmit} className="space-y-8">
                    {/* Datos empresa */}
                    <section className="space-y-4">
                        <h3 className="text-lg font-semibold">Información de la empresa</h3>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="grid gap-2">
                                <Label htmlFor="company">Nombre de la empresa *</Label>
                                <Input
                                    id="company"
                                    value={companyName}
                                    onChange={(e) => setCompanyName(e.target.value)}
                                    required
                                    className={inputStrong}
                                    placeholder="Ej: Finca Los Nogales"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="contact">Contacto principal *</Label>
                                <Input
                                    id="contact"
                                    value={contactName}
                                    onChange={(e) => setContactName(e.target.value)}
                                    required
                                    className={inputStrong}
                                    placeholder="Ej: Juan Pérez"
                                />
                            </div>
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="grid gap-2">
                                <Label htmlFor="crop">Cultivo principal</Label>
                                <Input
                                    id="crop"
                                    value={mainCrop}
                                    onChange={(e) => setMainCrop(e.target.value)}
                                    placeholder="Nogal, Pistacho, Citricos, etc."
                                    className={inputStrong}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="slug">Identificador único</Label>
                                <Input
                                    id="slug"
                                    value={slug}
                                    onChange={(e) => setSlug(e.target.value)}
                                    className={inputStrong}
                                    placeholder="Se genera automáticamente"
                                />
                                <p className="text-xs text-muted-foreground">
                                    Este será usado para identificar tu empresa en el sistema
                                </p>
                            </div>
                        </div>
                    </section>

                    {/* Datos del administrador */}
                    <section className="space-y-4">
                        <h3 className="text-lg font-semibold">Cuenta del administrador</h3>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="grid gap-2">
                                <Label htmlFor="adminName">Nombre completo *</Label>
                                <Input
                                    id="adminName"
                                    value={adminFullName}
                                    onChange={(e) => setAdminFullName(e.target.value)}
                                    required
                                    className={inputStrong}
                                    placeholder="Nombre y apellido"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="adminEmail">Email *</Label>
                                <Input
                                    id="adminEmail"
                                    type="email"
                                    value={adminEmail}
                                    onChange={(e) => setAdminEmail(e.target.value)}
                                    required
                                    className={inputStrong}
                                    placeholder="admin@tuempresa.com"
                                />
                            </div>
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="grid gap-2">
                                <Label htmlFor="adminPassword">Contraseña *</Label>
                                <div className="relative">
                                    <Input
                                        id="adminPassword"
                                        type={showPassword ? "text" : "password"}
                                        value={adminPassword}
                                        onChange={(e) => setAdminPassword(e.target.value)}
                                        required
                                        className={`${inputStrong} pr-10`}
                                        placeholder="Mínimo 8 caracteres"
                                    />
                                    <button
                                        type="button"
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="adminPhone">Teléfono</Label>
                                <Input
                                    id="adminPhone"
                                    value={adminPhone}
                                    onChange={(e) => setAdminPhone(e.target.value)}
                                    className={inputStrong}
                                    placeholder="+54 9 261 123-4567"
                                />
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="adminDocument">Documento de identidad</Label>
                            <Input
                                id="adminDocument"
                                value={adminDocumentId}
                                onChange={(e) => setAdminDocumentId(e.target.value)}
                                className={inputStrong}
                                placeholder="DNI, CUIT, etc."
                            />
                        </div>
                    </section>

                    {/* Usuarios + funcionalidades */}
                    <section className="grid gap-6 lg:grid-cols-2">
                        {/* Usuarios */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold">Plan de usuarios</h3>
                            <div className="space-y-3 rounded-xl border bg-card p-4 shadow-sm">
                                <Label>Cantidad de usuarios estimada</Label>

                                {/* Control con botones – / + */}
                                <div className="flex items-center gap-3">
                                    <div className="inline-flex items-center rounded-lg border bg-white shadow-sm">
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            onClick={decUsers}
                                            disabled={users <= MIN_USERS}
                                            aria-label="Disminuir usuarios"
                                            className="h-11 w-11 rounded-l-lg"
                                        >
                                            <Minus className="h-4 w-4" />
                                        </Button>

                                        <Input
                                            type="number"
                                            inputMode="numeric"
                                            min={MIN_USERS}
                                            step={1}
                                            value={users}
                                            onChange={(e) => {
                                                const val = clamp(Number(e.target.value), MIN_USERS);
                                                setUsers(val);
                                            }}
                                            onBlur={(e) => {
                                                const val = clamp(Number(e.target.value), MIN_USERS);
                                                if (val !== users) setUsers(val);
                                            }}
                                            onWheel={(e) => (e.currentTarget as HTMLInputElement).blur()}
                                            className={`w-24 border-0 text-center focus-visible:ring-0 ${inputStrong.replace(
                                                "border-muted",
                                                "border-transparent"
                                            )}`}
                                            aria-label="Cantidad de usuarios"
                                        />

                                        <Button
                                            type="button"
                                            variant="ghost"
                                            onClick={incUsers}
                                            aria-label="Aumentar usuarios"
                                            className="h-11 w-11 rounded-r-lg"
                                        >
                                            <Plus className="h-4 w-4" />
                                        </Button>
                                    </div>

                                    <span className="text-sm text-muted-foreground">
                    mín. {MIN_USERS} incluidos
                  </span>
                                </div>

                                <div className="mt-4 rounded-lg border bg-background p-3 text-sm">
                                    <div className="flex items-center justify-between pb-1">
                    <span className="text-muted-foreground">
                      Usuarios extra ({extraUsers})
                    </span>
                                        <span className="font-medium">
                      {money(subtotalUsers)}/mes
                    </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-muted-foreground">Incluidos</span>
                                        <span className="font-medium">{BASE_USERS_INCLUDED}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Funcionalidades */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold">Funcionalidades</h3>
                            <div className="rounded-xl border bg-card p-4 shadow-sm overflow-hidden">
                                <p className="text-sm text-muted-foreground">
                                    Seleccioná las funcionalidades en la pantalla dedicada. Las obligatorias ya vienen incluidas.
                                </p>

                                <ul className="mt-3 grid list-disc gap-1 pl-5 text-sm text-muted-foreground">
                                    {MODULES.map((m) => (
                                        <li key={m}>{m}</li>
                                    ))}
                                </ul>

                                <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
                                    <Button type="button" asChild className="w-full sm:flex-1">
                                        <a href="/funcionalidades">Configurar funcionalidades</a>
                                    </Button>

                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="w-full sm:w-auto sm:shrink-0"
                                        onClick={() => {
                                            localStorage.removeItem(OPTIONAL_KEY);
                                            setOptional([]);
                                        }}
                                    >
                                        Limpiar selección
                                    </Button>
                                </div>

                                <div className="mt-4 rounded-lg border bg-gradient-to-r from-primary/5 to-transparent p-3">
                                    <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Sparkles className="size-4 text-primary" />
                      Seleccionadas (incluye obligatorias)
                    </span>

                                        <span className="inline-flex items-center justify-center rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">
                      {allSelected.length}
                    </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Resumen de costos */}
                    <section className="grid gap-6 lg:grid-cols-2">
                        <div className="rounded-xl border bg-card p-4 shadow-sm">
                            <h3 className="mb-2 text-lg font-semibold">Resumen de costos</h3>
                            <div className="flex items-center justify-between py-2">
                                <span className="text-muted-foreground">Plan básico (piso)</span>
                                <span className="font-medium">{money(BASE_PRICE)}/mes</span>
                            </div>
                            <div className="flex items-center justify-between py-2">
                <span className="text-muted-foreground">
                  Usuarios extra ({extraUsers} × {money(USER_PRICE)})
                </span>
                                <span className="font-medium">{money(subtotalUsers)}/mes</span>
                            </div>
                            <div className="flex items-center justify-between py-2">
                <span className="text-muted-foreground">
                  Funcionalidades ({allSelected.length} × {money(FEATURE_PRICE)})
                </span>
                                <span className="font-medium">{money(subtotalFeatures)}/mes</span>
                            </div>
                            <div className="my-3 h-px bg-border" />
                            <div className="flex items-center justify-between py-2">
                                <span className="text-lg font-semibold">Total mensual</span>
                                <span className="text-lg font-extrabold">{money(total)}/mes</span>
                            </div>
                            <p className="mt-2 text-xs text-muted-foreground">
                                Precios estimados. Contactanos para cotización final.
                            </p>
                        </div>

                        <div className="rounded-xl border bg-card p-4 shadow-sm">
                            <h3 className="mb-2 text-lg font-semibold">Incluye siempre</h3>
                            <ul className="grid list-disc gap-1 pl-5 text-sm text-muted-foreground">
                                <li>{BASE_USERS_INCLUDED} usuarios incluidos</li>
                                <li>Soporte estándar</li>
                                <li>Acceso web + móvil</li>
                                <li>Exportación de datos</li>
                                <li>Backup automático</li>
                                <li>SSL y seguridad</li>
                            </ul>
                        </div>
                    </section>

                    {error && (
                        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm">
                            <div className="text-destructive font-medium mb-2">Error</div>
                            <div className="text-destructive">{error}</div>

                            {error.includes("Ya existe un usuario registrado") && (
                                <div className="mt-3 pt-2 border-t border-destructive/20">
                                    <p className="text-xs text-destructive/80 mb-2">
                                        Si ya intentaste crear esta cuenta anteriormente, podés intentar usar un email diferente o contactar con soporte.
                                    </p>
                                    <div className="flex gap-2 flex-wrap">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                                setAdminEmail("");
                                                setError(null);
                                            }}
                                            className="text-xs h-8"
                                        >
                                            Cambiar email
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => clearFormData()}
                                            className="text-xs h-8"
                                        >
                                            Empezar de nuevo
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <Button type="submit" disabled={loading} className="h-11 sm:order-1">
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 size-4 animate-spin" /> Creando cuenta…
                                </>
                            ) : (
                                "Crear empresa y cuenta"
                            )}
                        </Button>

                        <div className="flex gap-2 sm:order-2">
                            <Button type="button" variant="outline" asChild>
                                <a href="/login">Ya tengo cuenta</a>
                            </Button>

                            <Button
                                type="button"
                                variant="outline"
                                onClick={clearFormData}
                                className="text-destructive hover:text-destructive"
                            >
                                Limpiar formulario
                            </Button>
                        </div>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}
