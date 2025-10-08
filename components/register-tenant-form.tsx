"use client";

import { useEffect, useState, useCallback } from "react";
import { Check, Loader2, Eye, EyeOff, Mail, UserPlus, Users, MapPin, Package, DollarSign, CheckCircle } from "lucide-react";
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
import { authService, validators, sanitizeInput } from "../lib/supabaseAuth"; 
import { useRouter } from "next/navigation";

const FORM_DATA_KEY = "seedor.tenant.registration";
const PENDING_VERIFICATION_KEY = "seedor.tenant.verification";
const TENANT_CREATED_KEY = "seedor.tenant.created";

const inputStrong = "h-12 bg-white border-2 border-slate-200 shadow-sm placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-[#81C101]/30 focus-visible:border-[#81C101] transition-all duration-200";

const PLANS = [
  { 
    value: 'basico', 
    label: 'Plan Básico', 
    price: '$49',
    originalPrice: '$59',
    period: '/mes',
    description: 'Perfecto para campos pequeños',
    maxUsers: 10,
    maxFields: 5,
    modules: ['Campo', 'Empaque'],
    features: [
      'Hasta 10 usuarios',
      'Hasta 5 campos/fincas',
      'Gestión de campo',
      'Gestión de empaque',
      'Soporte por email',
      'Reportes básicos'
    ],
    popular: false,
    color: 'from-[#81C101]/10 to-[#81C101]/5',  
    borderColor: 'border-[#81C101]/30',
    textColor: 'text-[#81C101]', 
    badgeColor: 'bg-[#81C101]/10 text-[#81C101]'
  },
  { 
    value: 'profesional', 
    label: 'Plan Profesional', 
    price: '$99',
    originalPrice: '$129',
    period: '/mes',
    description: 'Para operaciones más grandes',
    maxUsers: 30,
    maxFields: 20,
    modules: ['Campo', 'Empaque', 'Finanzas'],
    features: [
      'Hasta 30 usuarios',
      'Hasta 20 campos/fincas',
      'Gestión de campo',
      'Gestión de empaque',
      'Módulo de finanzas',
      'Reportes avanzados',
      'Soporte prioritario',
      'Analytics detallados'
    ],
    popular: true,
    color: 'from-[#81C101]/10 to-[#81C101]/5',  
    borderColor: 'border-[#81C101]',
    textColor: 'text-[#81C101]', 
    badgeColor: 'bg-amber-400 text-amber-900'
  }
];

const ValidatedInput = ({ 
    id, 
    label, 
    value, 
    onChange, 
    fieldName, 
    required = false, 
    type = "text",
    placeholder,
    fieldErrors,
    icon: Icon,
    ...props 
}: any) => (
    <div className="grid gap-3">
        <Label htmlFor={id} className="text-sm font-semibold text-slate-700">
            {label} {required && <span className="text-red-500">*</span>}
        </Label>
        <div className="relative">
            {Icon && (
                <Icon className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-slate-400" />
            )}
            <Input
                id={id}
                type={type}
                value={value}
                onChange={(e) => onChange(fieldName, e.target.value)}
                required={required}
                className={`${inputStrong} ${Icon ? 'pl-12' : 'pl-4'} ${fieldErrors[fieldName] ? 'border-red-400 focus-visible:ring-red-400/30 focus-visible:border-red-400' : ''}`}
                placeholder={placeholder}
                {...props}
            />
        </div>
        <div className="h-5">
            {fieldErrors[fieldName] && (
                <p className="text-sm text-red-500 leading-tight flex items-center gap-1">
                    <span className="size-4 rounded-full bg-red-100 flex items-center justify-center">
                        <span className="size-2 rounded-full bg-red-500"></span>
                    </span>
                    {fieldErrors[fieldName]}
                </p>
            )}
        </div>
    </div>
);

const PlanCard = ({ plan, selected, onSelect }: { plan: any, selected: boolean, onSelect: () => void }) => (
    <div 
        className={`relative cursor-pointer rounded-2xl border-3 p-6 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl ${
            selected 
                ? `${plan.borderColor} bg-gradient-to-br ${plan.color} shadow-lg transform scale-[1.02]` 
                : 'border-slate-200 bg-white hover:border-[#81C101]/40 shadow-md hover:shadow-lg'
        }`}
        onClick={onSelect}
    >
        {plan.popular && (
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                <div className={`${plan.badgeColor} px-4 py-2 rounded-full text-xs font-bold shadow-md flex items-center gap-1`}>
                    <CheckCircle className="size-3" />
                    Más Popular
                </div>
            </div>
        )}
        
        {selected && (
            <div className="absolute -top-2 -right-2">
                <div className="bg-[#81C101] text-white rounded-full p-2 shadow-lg">
                    <Check className="size-4" />
                </div>
            </div>
        )}
        
        <div className="space-y-5">
            <div className="text-center pt-2">
                <h3 className={`text-xl font-bold ${selected ? plan.textColor : 'text-slate-900'}`}>
                    {plan.label}
                </h3>
                <p className="text-sm mt-1 text-slate-600"> {/* Gris más oscuro siempre */}
                    {plan.description}
                </p>
            </div>

            <div className="text-center">
                <div className="flex items-baseline justify-center gap-1">
                    <span className={`text-4xl font-bold ${selected ? plan.textColor : 'text-slate-900'}`}>
                        {plan.price}
                    </span>
                    <span className="text-lg text-slate-600"> {/* Gris más oscuro siempre */}
                        {plan.period}
                    </span>
                </div>
                {plan.originalPrice && (
                    <div className="flex items-center justify-center gap-2 mt-1">
                        <span className="text-sm line-through text-slate-500"> {/* Gris más oscuro */}
                            {plan.originalPrice}
                        </span>
                        <span className="bg-red-100 text-red-700 text-xs px-2 py-1 rounded-full font-semibold">
                            Oferta
                        </span>
                    </div>
                )}
                <p className="text-xs mt-2 text-slate-500"> {/* Gris más oscuro siempre */}
                    Facturación mensual
                </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div className={`text-center p-4 rounded-xl ${selected ? 'bg-white/20' : 'bg-slate-50'}`}>
                    <Users className={`size-6 mx-auto mb-2 ${selected ? plan.textColor : 'text-[#81C101]'}`} />
                    <div className={`text-sm font-bold ${selected ? plan.textColor : 'text-slate-700'}`}>
                        {plan.maxUsers}
                    </div>
                    <div className="text-xs text-slate-600"> {/* Gris más oscuro siempre */}
                        usuarios
                    </div>
                </div>
                <div className={`text-center p-4 rounded-xl ${selected ? 'bg-white/20' : 'bg-slate-50'}`}>
                    <MapPin className={`size-6 mx-auto mb-2 ${selected ? plan.textColor : 'text-[#81C101]'}`} />
                    <div className={`text-sm font-bold ${selected ? plan.textColor : 'text-slate-700'}`}>
                        {plan.maxFields}
                    </div>
                    <div className="text-xs text-slate-600"> {/* Gris más oscuro siempre */}
                        campos
                    </div>
                </div>
            </div>

            <div>
                <h4 className={`text-sm font-bold mb-3 ${selected ? plan.textColor : 'text-slate-700'}`}>
                    Módulos incluidos:
                </h4>
                <div className="flex flex-wrap gap-2">
                    {plan.modules.map((module: string) => (
                        <span key={module} className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-full bg-[#81C101]/10 text-[#81C101]"> {/* Color fijo siempre */}
                            {module === 'Campo' && <MapPin className="size-3" />}
                            {module === 'Empaque' && <Package className="size-3" />}
                            {module === 'Finanzas' && <DollarSign className="size-3" />}
                            {module}
                        </span>
                    ))}
                </div>
            </div>

            <div>
                <h4 className={`text-sm font-bold mb-3 ${selected ? plan.textColor : 'text-slate-700'}`}>
                    Características:
                </h4>
                <ul className="space-y-2">
                    {plan.features.map((feature: string, index: number) => (
                        <li key={index} className="flex items-start gap-2 text-sm">
                            <Check className={`size-4 flex-shrink-0 mt-0.5 ${selected ? plan.textColor : 'text-[#81C101]'}`} />
                            <span className="text-slate-700"> {/* Gris más oscuro siempre */}
                                {feature}
                            </span>
                        </li>
                    ))}
                </ul>
            </div>

            <div className="flex items-center justify-center pt-4 min-h-[3rem]"> {/* Agregado min-h y pt-4 */}
                <div className={`w-6 h-6 rounded-full border-3 flex items-center justify-center transition-all duration-200 ${
                    selected 
                        ? 'border-[#81C101] bg-[#81C101]' // Cambiado para que sea visible
                        : 'border-slate-300 hover:border-[#81C101]'
                }`}>
                    {selected && <Check className="size-4 text-white" />} {/* Cambiado a texto blanco */}
                </div>
            </div>
        </div>
    </div>
);

export default function RegisterTenantForm() {
    const router = useRouter();

    const [currentStep, setCurrentStep] = useState<'form' | 'verification' | 'admin-invite' | 'complete'>('form');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [companyName, setCompanyName] = useState("");
    const [contactName, setContactName] = useState("");
    const [contactEmail, setContactEmail] = useState("");
    const [ownerPhone, setOwnerPhone] = useState("");
    const [selectedPlan, setSelectedPlan] = useState("profesional"); // Profesional por defecto

    const [verificationCode, setVerificationCode] = useState("");
    const [verifyingCode, setVerifyingCode] = useState(false);

    const [adminEmail, setAdminEmail] = useState("");
    const [invitingAdmin, setInvitingAdmin] = useState(false);

    const [registrationData, setRegistrationData] = useState<any>(null);
    const [tenantData, setTenantData] = useState<any>(null);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    const generateSlug = (name: string): string => {
        return name
            .toLowerCase()
            .replace(/[^a-z0-9\s]/g, "")
            .replace(/\s+/g, "-")
            .substring(0, 50);
    };

   
    useEffect(() => {
        if (typeof window === "undefined") return;

        const urlParams = new URLSearchParams(window.location.search);
        const isNewRegistration = urlParams.get('new') === 'true' || !document.referrer;
        
        if (isNewRegistration) {
            localStorage.removeItem(FORM_DATA_KEY);
            localStorage.removeItem(PENDING_VERIFICATION_KEY);
            localStorage.removeItem(TENANT_CREATED_KEY);
            console.log('🧹 Cleared previous registration data for new session');
            return;
        }

        const tenantCreated = localStorage.getItem(TENANT_CREATED_KEY);
        if (tenantCreated) {
            try {
                const data = JSON.parse(tenantCreated);
                
                const createdAt = new Date(data.timestamp || 0);
                const now = new Date();
                const hoursDiff = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
                
                if (hoursDiff > 1) {
                    console.log('🕐 Tenant creation data is too old, clearing...');
                    localStorage.removeItem(TENANT_CREATED_KEY);
                    return;
                }
                
                console.log('📂 Restoring tenant creation step...');
                setTenantData(data);
                setCurrentStep('admin-invite');
                return;
            } catch (e) {
                console.warn('Error parsing tenant data:', e);
                localStorage.removeItem(TENANT_CREATED_KEY);
            }
        }

        const pendingData = localStorage.getItem(PENDING_VERIFICATION_KEY);
        if (pendingData) {
            try {
                const data = JSON.parse(pendingData);
                
                const createdAt = new Date(data.timestamp || 0);
                const now = new Date();
                const minutesDiff = (now.getTime() - createdAt.getTime()) / (1000 * 60);
                
                if (minutesDiff > 30) {
                    console.log('🕐 Verification data is too old, clearing...');
                    localStorage.removeItem(PENDING_VERIFICATION_KEY);
                    return;
                }
                
                console.log('📂 Restoring verification step...');
                setRegistrationData(data);
                setCurrentStep('verification');
                return;
            } catch (e) {
                console.warn('Error parsing verification data:', e);
                localStorage.removeItem(PENDING_VERIFICATION_KEY);
            }
        }

        const savedFormData = localStorage.getItem(FORM_DATA_KEY);
        if (savedFormData) {
            try {
                const data = JSON.parse(savedFormData);
                
                const savedAt = new Date(data.timestamp || 0);
                const now = new Date();
                const hoursDiff = (now.getTime() - savedAt.getTime()) / (1000 * 60 * 60);
                
                if (hoursDiff > 2) {
                    console.log('🕐 Form data is too old, clearing...');
                    localStorage.removeItem(FORM_DATA_KEY);
                    return;
                }
                
                console.log('📂 Restoring form data...');
                setCompanyName(data.companyName || "");
                setContactName(data.contactName || "");
                setContactEmail(data.contactEmail || "");
                setOwnerPhone(data.ownerPhone || "");
                setSelectedPlan(data.selectedPlan || "profesional");
            } catch (e) {
                console.warn("Error parsing form data:", e);
                localStorage.removeItem(FORM_DATA_KEY);
            }
        }
    }, []);

    useEffect(() => {
        if (typeof window === "undefined" || currentStep !== 'form') return;

        const formData = {
            companyName,
            contactName,
            contactEmail,
            ownerPhone,
            selectedPlan,
            timestamp: new Date().toISOString()
        };

        localStorage.setItem(FORM_DATA_KEY, JSON.stringify(formData));
    }, [companyName, contactName, contactEmail, ownerPhone, selectedPlan, currentStep]);
    
    const validateField = useCallback((fieldName: string, value: string): string => {
        switch (fieldName) {
            case 'companyName':
                if (!validators.text(value, 2, 100)) {
                    return 'Debe tener entre 2 y 100 caracteres'
                }
                break;
            case 'contactName':
                if (!validators.text(value, 2, 100)) {
                    return 'Debe tener entre 2 y 100 caracteres'
                }
                break;
            case 'contactEmail':
                if (value && !validators.email(value)) {
                    return 'Debe ser un email válido'
                }
                break;

            case 'ownerPhone':
                if (value && !validators.phone(value)) {
                    return 'Formato inválido'
                }
                break;
            case 'adminEmail':
                if (value && !validators.email(value)) {
                    return 'Debe ser un email válido'
                }
                break;
        }
        return '';
    }, []);

    const handleFieldChange = useCallback((fieldName: string, value: string) => {
        switch (fieldName) {
            case 'companyName':
                setCompanyName(value);
                break;
            case 'contactName':
                setContactName(value);
                break;
            case 'contactEmail':
                setContactEmail(value);
                break;

            case 'ownerPhone':
                setOwnerPhone(value);
                break;
            case 'adminEmail':
                setAdminEmail(value);
                break;
        }

        const error = validateField(fieldName, value);
        setFieldErrors(prev => ({
            ...prev,
            [fieldName]: error
        }));
    }, [validateField]);

    const onSubmitTenantForm = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        const allErrors: Record<string, string> = {};
        allErrors.companyName = validateField('companyName', companyName);
        allErrors.contactName = validateField('contactName', contactName);
        allErrors.contactEmail = validateField('contactEmail', contactEmail);

        allErrors.ownerPhone = validateField('ownerPhone', ownerPhone);

        const filteredErrors = Object.fromEntries(
            Object.entries(allErrors).filter(([_, error]) => error !== '')
        );

        setFieldErrors(filteredErrors);

        if (Object.keys(filteredErrors).length > 0) {
            setError("Por favor corregí los errores en el formulario.");
            return;
        }

        if (!companyName || !contactName || !contactEmail) {
            setError("Completá todos los campos obligatorios.");
            return;
        }

        setLoading(true);

        try {
            const completeData = {
                tenantName: companyName,
                slug: generateSlug(companyName),
                plan: selectedPlan,
                contactName: contactName,
                contactEmail: contactEmail,
                ownerPassword: "temp-password-not-used", // Owner usa OTP, no password
                ownerPhone: ownerPhone || undefined,
            };

            const { success, error: sendError } = await authService.sendOwnerVerificationCode(contactEmail);

            if (!success || sendError) {
                setError(sendError || "Error al enviar código de verificación");
                return;
            }

            if (typeof window !== "undefined") {
                const dataWithTimestamp = {
                    ...completeData,
                    timestamp: new Date().toISOString()
                };
                localStorage.setItem(PENDING_VERIFICATION_KEY, JSON.stringify(dataWithTimestamp));
                localStorage.removeItem(FORM_DATA_KEY);
            }

            setRegistrationData(completeData);
            setCurrentStep('verification');

        } catch (err: any) {
            setError(err.message || "Error inesperado");
        } finally {
            setLoading(false);
        }
    }, [companyName, contactName, contactEmail, ownerPhone, selectedPlan, validateField]);

    const onVerifyCode = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!verificationCode.trim()) {
            setError("Ingresá el código de verificación.");
            return;
        }

        if (verificationCode.trim().length !== 6) {
            setError("El código debe tener 6 dígitos.");
            return;
        }

        console.log('🔄 Starting verification process...', {
            email: registrationData?.contactEmail,
            code: verificationCode,
            hasRegistrationData: !!registrationData
        });

        setVerifyingCode(true);

        try {
            const { success, error: verifyError } = await authService.verifyOwnerCode(
                registrationData.contactEmail,
                verificationCode.trim()
            );

            console.log('📧 Verification result:', { success, verifyError });

            if (!success || verifyError) {
                setError(verifyError || "Código inválido. Verificá y volvé a intentar.");
                return;
            }

            console.log('🏢 Creating tenant with owner...');
            const { success: createSuccess, error: createError, data } = await authService.createTenantWithOwner(registrationData);

            console.log('🏢 Creation result:', { createSuccess, createError, data });

            if (!createSuccess || createError) {
            setError(createError || "Error al crear la empresa. Intentá de nuevo.");
            return;
            }

            if (typeof window !== "undefined") {
            const dataWithTimestamp = {
                ...data,
                timestamp: new Date().toISOString()
            };
            localStorage.removeItem(PENDING_VERIFICATION_KEY);
            localStorage.setItem(TENANT_CREATED_KEY, JSON.stringify(dataWithTimestamp));
            }

            console.log('✅ Tenant created successfully, moving to admin invite step');
            setTenantData(data);
            setCurrentStep('admin-invite');

        } catch (err: any) {
            console.error('❌ Error in verification process:', err);
            setError(err.message || "Error durante la verificación. Intentá de nuevo.");
        } finally {
            console.log('🔄 Verification process finished');
            setVerifyingCode(false);
        }
        }, [verificationCode, registrationData]);

    const onInviteAdmin = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!validators.email(adminEmail)) {
            setError("Ingresá un email válido para el administrador.");
            return;
        }

        if (adminEmail === registrationData?.contactEmail) {
            setError("El email del administrador debe ser diferente al tuyo.");
            return;
        }

        setInvitingAdmin(true);

        try {
            const { success, error: inviteError } = await authService.inviteAdmin(
                tenantData.tenant.id,
                adminEmail,
                tenantData.user.id
            );

            if (!success || inviteError) {
                setError(inviteError || "Error al enviar invitación.");
                return;
            }

            if (typeof window !== "undefined") {
                localStorage.removeItem(TENANT_CREATED_KEY);
            }

            setCurrentStep('complete');

        } catch (err: any) {
            setError(err.message || "Error inesperado.");
        } finally {
            setInvitingAdmin(false);
        }
    }, [adminEmail, tenantData, registrationData]);

    const clearAllData = useCallback(() => {
        if (typeof window !== "undefined") {
            localStorage.removeItem(FORM_DATA_KEY);
            localStorage.removeItem(PENDING_VERIFICATION_KEY);
            localStorage.removeItem(TENANT_CREATED_KEY);
        }
        setCurrentStep('form');
        setCompanyName("");
        setContactName("");
        setContactEmail("");

        setOwnerPhone("");
        setSelectedPlan("profesional");
        setVerificationCode("");
        setAdminEmail("");
        setFieldErrors({});
        setError(null);
        setRegistrationData(null);
        setTenantData(null);
    }, []);

    if (currentStep === 'verification') {
        return (
            <Card className="mx-auto w-full max-w-md rounded-3xl border-2 border-slate-200 bg-white shadow-2xl">
                <CardHeader className="text-center pb-6">
                    <div className="mx-auto mb-4 grid size-16 place-items-center rounded-2xl bg-gradient-to-br from-[#81C101] to-[#9ED604] shadow-lg">
                        <Mail className="size-8 text-white" />
                    </div>
                    <CardTitle className="text-2xl font-bold text-slate-800">Verificá tu email</CardTitle>
                    <CardDescription className="text-slate-600 mt-2">
                        Enviamos un código de verificación a:<br />
                        <strong className="text-[#81C101]">{registrationData?.contactEmail}</strong>
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={onVerifyCode} className="space-y-6">
                        <div className="grid gap-3">
                            <Label htmlFor="code" className="text-sm font-semibold text-slate-700">
                                Código de verificación
                            </Label>
                            <Input
                                id="code"
                                type="text"
                                value={verificationCode}
                                onChange={(e) => setVerificationCode(e.target.value)}
                                placeholder="000000"
                                className="text-center text-2xl tracking-widest font-mono h-16 border-2 border-slate-200 focus-visible:ring-2 focus-visible:ring-[#81C101]/30 focus-visible:border-[#81C101]"
                                maxLength={6}
                                required
                            />
                        </div>

                        {error && (
                            <div className="rounded-xl border-2 border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-center gap-2">
                                <span className="size-5 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                                    <span className="size-2 rounded-full bg-red-500"></span>
                                </span>
                                {error}
                            </div>
                        )}

                        <Button 
                            type="submit" 
                            className="w-full h-12 bg-gradient-to-r from-[#81C101] to-[#9ED604] hover:from-[#73AC01] hover:to-[#8BC34A] text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 cursor-pointer" 
                            disabled={verifyingCode}
                        >
                            {verifyingCode ? (
                                <>
                                    <Loader2 className="mr-2 size-5 animate-spin" /> Verificando...
                                </>
                            ) : (
                                "Verificar y crear empresa"
                            )}
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="flex justify-between pt-4">
                    <Button 
                        variant="outline" 
                        onClick={clearAllData}
                        className="border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50 cursor-pointer transition-all duration-200"
                    >
                        Cancelar
                    </Button>
                    <Button 
                        variant="ghost" 
                        onClick={async () => {
                        setError(null);
                        setVerificationCode("");
                        try {
                            const { success, error: resendError } = await authService.sendOwnerVerificationCode(registrationData?.contactEmail);
                            if (!success) {
                            setError(resendError || "Error al reenviar código");
                            } else {
                            // Mostrar mensaje de éxito temporal
                            const originalError = error;
                            setError("✅ Código reenviado correctamente");
                            setTimeout(() => setError(originalError), 3000);
                            }
                        } catch (err: any) {
                            setError(err.message || "Error al reenviar código");
                        }
                        }}
                        disabled={loading || verifyingCode}
                        size="sm"
                        className="text-[#81C101] hover:text-[#73AC01] hover:bg-[#81C101]/5 cursor-pointer transition-all duration-200"
                    >
                        {loading ? "Enviando..." : "Reenviar código"}
                    </Button>
                </CardFooter>
            </Card>
        );
    }

    if (currentStep === 'admin-invite') {
        return (
            <Card className="mx-auto w-full max-w-md rounded-3xl border-2 border-slate-200 bg-white shadow-2xl">
                <CardHeader className="text-center pb-6">
                    <div className="mx-auto mb-4 grid size-16 place-items-center rounded-2xl bg-gradient-to-br from-[#81C101] to-[#9ED604] shadow-lg">
                        <UserPlus className="size-8 text-white" />
                    </div>
                    <CardTitle className="text-2xl font-bold text-slate-800">¡Empresa creada!</CardTitle>
                    <CardDescription className="text-slate-600 mt-2">
                        Ahora invitá al administrador de <strong className="text-[#81C101]">{tenantData?.tenant?.name}</strong>
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={onInviteAdmin} className="space-y-6">
                        <ValidatedInput
                            id="adminEmail"
                            label="Email del administrador"
                            type="email"
                            value={adminEmail}
                            onChange={handleFieldChange}
                            fieldName="adminEmail"
                            fieldErrors={fieldErrors}
                            placeholder="admin@empresa.com"
                            required
                            icon={Mail}
                        />

                        <div className="rounded-xl border-2 border-[#81C101]/20 bg-[#81C101]/5 p-4">
                            <p className="text-sm text-[#81C101] flex items-center gap-2">
                                <UserPlus className="size-4 flex-shrink-0" />
                                Le enviaremos un link para que complete sus datos y se una como administrador.
                            </p>
                        </div>

                        {error && (
                            <div className="rounded-xl border-2 border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-center gap-2">
                                <span className="size-5 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                                    <span className="size-2 rounded-full bg-red-500"></span>
                                </span>
                                {error}
                            </div>
                        )}

                        <Button 
                            type="submit" 
                            className="w-full h-12 bg-gradient-to-r from-[#81C101] to-[#9ED604] hover:from-[#73AC01] hover:to-[#8BC34A] text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 cursor-pointer" 
                            disabled={invitingAdmin}
                        >
                            {invitingAdmin ? (
                                <>
                                    <Loader2 className="mr-2 size-5 animate-spin" /> Enviando invitación...
                                </>
                            ) : (
                                "Invitar administrador"
                            )}
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="justify-center pt-4">
                    <Button 
                        variant="outline" 
                        onClick={() => router.push("/home")}
                        className="border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50 cursor-pointer transition-all duration-200"
                    >
                        Saltar por ahora
                    </Button>
                </CardFooter>
            </Card>
        );
    }

    if (currentStep === 'complete') {
        return (
            <Card className="mx-auto w-full max-w-md rounded-3xl border-2 border-slate-200 bg-white shadow-2xl">
                <CardHeader className="text-center pb-6">
                    <div className="mx-auto mb-4 grid size-16 place-items-center rounded-2xl bg-gradient-to-br from-[#81C101] to-[#9ED604] shadow-lg">
                        <Check className="size-8 text-white" />
                    </div>
                    <CardTitle className="text-2xl font-bold text-slate-800">¡Todo listo!</CardTitle>
                    <CardDescription className="text-slate-600 mt-2">
                        Se envió la invitación a <strong className="text-[#81C101]">{adminEmail}</strong>
                    </CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                    <p className="text-sm text-slate-600">
                        Una vez que el administrador complete sus datos, podrás gestionar tu campo completamente.
                    </p>
                </CardContent>
                <CardFooter className="justify-center pt-4">
                    <Button 
                        onClick={() => router.push("/home")}
                        className="bg-gradient-to-r from-[#81C101] to-[#9ED604] hover:from-[#73AC01] hover:to-[#8BC34A] text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 cursor-pointer"
                    >
                        Ir al dashboard
                    </Button>
                </CardFooter>
            </Card>
        );
    }

    return (
        <div className="mx-auto w-full max-w-5xl">
            <Card className="rounded-3xl border-2 border-slate-200 bg-white shadow-2xl overflow-hidden">
                <div className="px-8 py-8 border-b border-slate-200">
                    <CardTitle className="text-3xl font-bold text-slate-900">Crear tu empresa</CardTitle>
                    <CardDescription className="text-slate-600 mt-2 text-lg">
                        Registrá tu empresa y elegí el plan que mejor se adapte a tus necesidades
                    </CardDescription>
                </div>

                <CardContent className="p-8">
                    <form onSubmit={onSubmitTenantForm} className="space-y-10">
                        <section className="space-y-6">
                            <div className="flex items-center gap-3">
                                <div className="size-10 rounded-xl bg-[#81C101]/10 flex items-center justify-center">
                                    <MapPin className="size-5 text-[#81C101]" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-slate-800">Información de la empresa</h3>
                                    <p className="text-slate-500 text-sm">Datos básicos de tu organización</p>
                                </div>
                            </div>
                            
                            <div className="grid gap-6 sm:grid-cols-2">
                                <ValidatedInput
                                    id="company"
                                    label="Nombre de la empresa"
                                    value={companyName}
                                    onChange={handleFieldChange}
                                    fieldName="companyName"
                                    fieldErrors={fieldErrors}
                                    required
                                    placeholder="Ej: Finca Los Nogales"
                                />
                                <ValidatedInput
                                    id="contact"
                                    label="Tu nombre (propietario)"
                                    value={contactName}
                                    onChange={handleFieldChange}
                                    fieldName="contactName"
                                    fieldErrors={fieldErrors}
                                    required
                                    placeholder="Ej: Juan Pérez"
                                />
                            </div>
                            
                            <ValidatedInput
                                id="contactEmail"
                                label="Tu email"
                                type="email"
                                value={contactEmail}
                                onChange={handleFieldChange}
                                fieldName="contactEmail"
                                fieldErrors={fieldErrors}
                                required
                                placeholder="tu@email.com"
                                icon={Mail}
                            />
                            
                            {companyName && (
                                <div className="rounded-xl border-2 border-[#81C101]/20 bg-[#81C101]/5 p-4">
                                    <p className="text-sm text-[#81C101] flex items-center gap-2">
                                        <Check className="size-4" />
                                        <strong>Identificador:</strong> {generateSlug(companyName)}
                                    </p>
                                </div>
                            )}
                        </section>

                        <section className="space-y-6">
                            <div className="flex items-center gap-3">
                                <div className="size-10 rounded-xl bg-[#81C101]/10 flex items-center justify-center">
                                    <DollarSign className="size-5 text-[#81C101]" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-slate-800">Elegí tu plan</h3>
                                    <p className="text-slate-500 text-sm">Seleccioná el plan que mejor se adapte al tamaño de tu operación</p>
                                </div>
                            </div>
                            
                            <div className="grid gap-8 lg:grid-cols-2">
                                {PLANS.map((plan) => (
                                    <PlanCard
                                        key={plan.value}
                                        plan={plan}
                                        selected={selectedPlan === plan.value}
                                        onSelect={() => setSelectedPlan(plan.value)}
                                    />
                                ))}
                            </div>

                            <div className="rounded-xl border-2 border-[#81C101]/20 bg-[#81C101]/5 p-6">
                                <div className="flex items-center gap-3 mb-4">
                                    <CheckCircle className="size-6 text-[#81C101]" />
                                    <h4 className="font-bold text-[#81C101] text-lg">Plan seleccionado</h4>
                                </div>
                                {(() => {
                                    const plan = PLANS.find(p => p.value === selectedPlan);
                                    return (
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="font-semibold text-[#81C101] text-lg">{plan?.label}</p>
                                                <p className="text-[#73AC01]">
                                                    {plan?.maxUsers} usuarios • {plan?.maxFields} campos • {plan?.modules.join(', ')}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-3xl font-bold text-[#81C101]">{plan?.price}<span className="text-lg">{plan?.period}</span></p>
                                            </div>
                                        </div>
                                    );
                                })()}
                            </div>
                        </section>

                        <section className="space-y-6">
                            <div className="flex items-center gap-3">
                                <div className="size-10 rounded-xl bg-[#81C101]/10 flex items-center justify-center">
                                    <Users className="size-5 text-[#81C101]" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-slate-800">Tu cuenta</h3>
                                    <p className="text-slate-500 text-sm">Configurá tu acceso al sistema</p>
                                </div>
                            </div>
                            
                            <div className="grid gap-6 sm:grid-cols-2">
                                
                                <ValidatedInput
                                    id="ownerPhone"
                                    label="Teléfono"
                                    value={ownerPhone}
                                    onChange={handleFieldChange}
                                    fieldName="ownerPhone"
                                    fieldErrors={fieldErrors}
                                    placeholder="+54 9 261 123-4567"
                                />
                            </div>
                        </section>

                        {error && (
                            <div className="rounded-xl border-2 border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-center gap-2">
                                <span className="size-5 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                                    <span className="size-2 rounded-full bg-red-500"></span>
                                </span>
                                {error}
                            </div>
                        )}

                        <div className="flex flex-col gap-4 sm:flex-row sm:justify-between pt-6 border-t border-slate-200">
                            <Button 
                                type="submit" 
                                disabled={loading} 
                                className="h-12 px-8 bg-gradient-to-r from-[#81C101] to-[#9ED604] hover:from-[#73AC01] hover:to-[#8BC34A] text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 cursor-pointer"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="mr-2 size-5 animate-spin" /> Enviando código...
                                    </>
                                ) : (
                                    "Crear empresa"
                                )}
                            </Button>

                            <div className="flex gap-3">
                                <Button 
                                    type="button" 
                                    variant="outline" 
                                    asChild
                                    className="border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50 cursor-pointer transition-all duration-200"
                                >
                                    <a href="/login">Ya tengo cuenta</a>
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={clearAllData}
                                    className="text-red-600 border-2 border-red-200 hover:border-red-300 hover:bg-red-50 cursor-pointer transition-all duration-200"
                                >
                                    Limpiar
                                </Button>
                            </div>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}