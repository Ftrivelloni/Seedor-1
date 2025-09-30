// components/register-tenant-form-enhanced.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Loader2, Eye, EyeOff } from "lucide-react";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Button } from "./ui/button";
import { authService } from "../lib/supabaseAuth";
import { useRouter } from "next/navigation";
import { PlanSelector, PLANS, type SubscriptionPlan } from "./subscription/PlanSelector";

const FORM_DATA_KEY = "seedor.registration.formData";

export default function RegisterTenantFormEnhanced() {
    const router = useRouter();

    // Empresa
    const [companyName, setCompanyName] = useState("");
    const [contactName, setContactName] = useState("");
    const [mainCrop, setMainCrop] = useState("");
    const [slug, setSlug] = useState("");

    // Plan selection
    const [selectedPlan, setSelectedPlan] = useState<string>("pro"); // Default to Pro (most popular)

    // Admin user details
    const [adminFullName, setAdminFullName] = useState("");
    const [adminEmail, setAdminEmail] = useState("");
    const [adminPassword, setAdminPassword] = useState("");
    const [adminPhone, setAdminPhone] = useState("");
    const [adminDocumentId, setAdminDocumentId] = useState("");
    const [showPassword, setShowPassword] = useState(false);

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
                    setSelectedPlan(formData.selectedPlan || "pro");
                    setAdminFullName(formData.adminFullName || "");
                    setAdminEmail(formData.adminEmail || "");
                    setAdminPassword(formData.adminPassword || "");
                    setAdminPhone(formData.adminPhone || "");
                    setAdminDocumentId(formData.adminDocumentId || "");
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
                selectedPlan,
                adminFullName,
                adminEmail,
                adminPassword,
                adminPhone,
                adminDocumentId,
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
        selectedPlan,
        adminFullName,
        adminEmail,
        adminPassword,
        adminPhone,
        adminDocumentId,
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

    // Get selected plan details
    const currentPlan = useMemo(() => {
        return PLANS.find(p => p.id === selectedPlan) || PLANS[1]; // Default to Pro
    }, [selectedPlan]);

    // Submit
    const [loading, setLoading] = useState(false);
    const [done, setDone] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Function to clear all form data
    const clearFormData = () => {
        if (typeof window !== "undefined") {
            localStorage.removeItem(FORM_DATA_KEY);
        }

        // Reset all form fields
        setCompanyName("");
        setContactName("");
        setMainCrop("");
        setSlug("");
        setSelectedPlan("pro");
        setAdminFullName("");
        setAdminEmail("");
        setAdminPassword("");
        setAdminPhone("");
        setAdminDocumentId("");
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
                plan: selectedPlan,
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

            // After successful tenant creation, try to log in the user automatically
            try {
                const { user: loginUser, error: loginError } = await authService.login(adminEmail, adminPassword);
                
                if (loginUser && !loginError) {
                    // Clear form data from localStorage after successful registration
                    if (typeof window !== "undefined") {
                        localStorage.removeItem(FORM_DATA_KEY);
                    }
                    
                    // Redirect to home instead of showing success page
                    router.push("/home");
                    return;
                }
            } catch (loginErr) {
                console.error('Auto-login failed:', loginErr);
                // Continue to success page if auto-login fails
            }

            // Clear form data from localStorage after successful registration
            if (typeof window !== "undefined") {
                localStorage.removeItem(FORM_DATA_KEY);
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
                        Tu cuenta ha sido creada exitosamente con el plan <strong>{currentPlan.name}</strong>. 
                        Ahora puedes acceder con tu email y contraseña.
                    </CardDescription>
                </CardHeader>
                <CardHeader className="pt-0">
                    <div className="rounded-lg border bg-muted/30 p-4 text-center">
                        <div className="text-sm text-muted-foreground">Plan seleccionado</div>
                        <div className="text-lg font-semibold">{currentPlan.name}</div>
                        <div className="text-sm text-muted-foreground">
                            {new Intl.NumberFormat('es-AR', {
                                style: 'currency',
                                currency: 'USD'
                            }).format(currentPlan.price)}/mes
                        </div>
                    </div>
                </CardHeader>
                <CardHeader className="pt-0">
                    <Button onClick={() => router.push("/login")} className="w-full">
                        Ir al inicio de sesión
                    </Button>
                    <Button variant="outline" onClick={() => window.location.reload()} className="w-full mt-2">
                        Crear otra empresa
                    </Button>
                </CardHeader>
            </Card>
        );
    }

    const inputStrong =
        "h-11 bg-white border-muted shadow-sm placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-primary/30";

    return (
        <Card className="mx-auto w-full max-w-5xl rounded-2xl border bg-card/90 shadow-lg">
            <CardHeader className="pb-4">
                <CardTitle className="text-2xl">Registro de empresa</CardTitle>
                <CardDescription>
                    Creá tu empresa, seleccioná tu plan y configurá tu cuenta de administrador.
                </CardDescription>
                <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                    <div className="h-2 w-2 rounded-full bg-green-500"></div>
                    Los datos del formulario se guardan automáticamente
                </div>
            </CardHeader>

            <CardContent>
                <form onSubmit={onSubmit} className="space-y-8">
                    {/* Plan Selection */}
                    <section className="space-y-4">
                        <PlanSelector 
                            selectedPlan={selectedPlan} 
                            onPlanSelect={setSelectedPlan} 
                        />
                    </section>

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

                    {/* Plan Summary */}
                    <section className="space-y-4">
                        <h3 className="text-lg font-semibold">Resumen del plan seleccionado</h3>
                        <Card className="border-primary/20 bg-primary/5">
                            <CardContent className="pt-6">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                            {currentPlan.icon}
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-lg">{currentPlan.name}</h4>
                                            <p className="text-sm text-muted-foreground">{currentPlan.description}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-2xl font-bold text-primary">
                                            {new Intl.NumberFormat('es-AR', {
                                                style: 'currency',
                                                currency: 'USD'
                                            }).format(currentPlan.price)}
                                        </div>
                                        <div className="text-sm text-muted-foreground">por mes</div>
                                    </div>
                                </div>
                                
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <div className="font-medium">Usuarios incluidos</div>
                                        <div className="text-muted-foreground">
                                            {currentPlan.maxUsers === -1 ? 'Ilimitados' : currentPlan.maxUsers}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="font-medium">Campos/lotes</div>
                                        <div className="text-muted-foreground">
                                            {currentPlan.maxFields === -1 ? 'Ilimitados' : currentPlan.maxFields}
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="mt-4 pt-4 border-t">
                                    <p className="text-xs text-muted-foreground">
                                        Puedes cambiar de plan después del registro desde la sección de ajustes.
                                        Precios estimados, contactanos para cotización final.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
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