"use client";

import { useState } from "react";
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
import { useRouter } from "next/navigation";
import { useToast } from "../hooks/use-toast";

// Estilos comunes para campos de entrada
const inputStrong = "h-12 bg-white border-2 border-slate-200 shadow-sm placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-[#81C101]/30 focus-visible:border-[#81C101] transition-all duration-200";

// Definir planes disponibles
const PLANS = [
  { 
    value: 'basico', 
    label: 'Plan Básico', 
    price: '$49',
    originalPrice: '$59',
    period: '/mes',
    description: 'Perfecto para campos pequeños',
    maxUsers: 3,
    maxFields: 5,
    modules: ['Campo', 'Empaque'],
    features: [
      'Hasta 3 usuarios',
      'Hasta 5 campos/fincas',
      'Gestión de campo básica',
      'Gestión de empaque',
      'Gestión de inventario básica',
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
    maxUsers: 10,
    maxFields: 20,
    modules: ['Campo', 'Empaque', 'Finanzas'],
    features: [
      'Hasta 10 usuarios',
      'Hasta 20 campos/fincas',
      'Gestión de campo avanzada',
      'Gestión de empaque',
      'Módulo de finanzas',
      'Exportación a Excel',
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

// Componente de entrada validada
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

// Componente para mostrar planes
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
      {/* Header */}
      <div className="text-center pt-2">
        <h3 className={`text-xl font-bold ${selected ? plan.textColor : 'text-slate-900'}`}>
          {plan.label}
        </h3>
        <p className="text-sm mt-1 text-slate-600">
          {plan.description}
        </p>
      </div>

      {/* Precio */}
      <div className="text-center">
        <div className="flex items-baseline justify-center gap-1">
          <span className={`text-4xl font-bold ${selected ? plan.textColor : 'text-slate-900'}`}>
            {plan.price}
          </span>
          <span className="text-lg text-slate-600">
            {plan.period}
          </span>
        </div>
        {plan.originalPrice && (
          <div className="flex items-center justify-center gap-2 mt-1">
            <span className="text-sm line-through text-slate-500">
              {plan.originalPrice}
            </span>
            <span className="bg-red-100 text-red-700 text-xs px-2 py-1 rounded-full font-semibold">
              Oferta
            </span>
          </div>
        )}
        <p className="text-xs mt-2 text-slate-500">
          Facturación mensual
        </p>
      </div>

      {/* Métricas principales */}
      <div className="grid grid-cols-2 gap-3">
        <div className={`text-center p-4 rounded-xl ${selected ? 'bg-white/20' : 'bg-slate-50'}`}>
          <Users className={`size-6 mx-auto mb-2 ${selected ? plan.textColor : 'text-[#81C101]'}`} />
          <div className={`text-sm font-bold ${selected ? plan.textColor : 'text-slate-700'}`}>
            {plan.maxUsers}
          </div>
          <div className="text-xs text-slate-600">
            usuarios
          </div>
        </div>
        <div className={`text-center p-4 rounded-xl ${selected ? 'bg-white/20' : 'bg-slate-50'}`}>
          <MapPin className={`size-6 mx-auto mb-2 ${selected ? plan.textColor : 'text-[#81C101]'}`} />
          <div className={`text-sm font-bold ${selected ? plan.textColor : 'text-slate-700'}`}>
            {plan.maxFields}
          </div>
          <div className="text-xs text-slate-600">
            campos
          </div>
        </div>
      </div>

      {/* Módulos incluidos */}
      <div>
        <h4 className={`text-sm font-bold mb-3 ${selected ? plan.textColor : 'text-slate-700'}`}>
          Módulos incluidos:
        </h4>
        <div className="flex flex-wrap gap-2">
          {plan.modules.map((module: string) => (
            <span key={module} className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-full bg-[#81C101]/10 text-[#81C101]">
              {module === 'Campo' && <MapPin className="size-3" />}
              {module === 'Empaque' && <Package className="size-3" />}
              {module === 'Finanzas' && <DollarSign className="size-3" />}
              {module}
            </span>
          ))}
        </div>
      </div>

      {/* Features */}
      <div>
        <h4 className={`text-sm font-bold mb-3 ${selected ? plan.textColor : 'text-slate-700'}`}>
          Características:
        </h4>
        <ul className="space-y-2">
          {plan.features.map((feature: string, index: number) => (
            <li key={index} className="flex items-start gap-2 text-sm">
              <Check className={`size-4 flex-shrink-0 mt-0.5 ${selected ? plan.textColor : 'text-[#81C101]'}`} />
              <span className="text-slate-700">
                {feature}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* Indicador de selección */}
      <div className="flex items-center justify-center pt-4 min-h-[3rem]">
        <div className={`w-6 h-6 rounded-full border-3 flex items-center justify-center transition-all duration-200 ${
          selected 
            ? 'border-[#81C101] bg-[#81C101]'
            : 'border-slate-300 hover:border-[#81C101]'
        }`}>
          {selected && <Check className="size-4 text-white" />}
        </div>
      </div>
    </div>
  </div>
);

// Función para generar slug a partir del nombre
const generateSlug = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, "-")
    .substring(0, 50);
};

export default function RegisterTenantFormV2() {
  const router = useRouter();
  const { toast } = useToast();

  // Estados principales
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState(1); // 1: Formulario principal, 2: Confirmación, 3: Completado
  const [tenantCreated, setTenantCreated] = useState<any>(null);

  // Datos del formulario
  const [formData, setFormData] = useState({
    companyName: "",
    contactName: "",
    contactEmail: "",
    password: "",
    phoneNumber: "",
    selectedPlan: "profesional"
  });

  // Errores de validación
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);

  // Mostrar/ocultar contraseña
  const [showPassword, setShowPassword] = useState(false);

  // Función para validar campos
  const validateField = (fieldName: string, value: string): string => {
    switch (fieldName) {
      case 'companyName':
        if (value.trim().length < 2 || value.trim().length > 100) {
          return 'Debe tener entre 2 y 100 caracteres';
        }
        break;
      case 'contactName':
        if (value.trim().length < 2 || value.trim().length > 100) {
          return 'Debe tener entre 2 y 100 caracteres';
        }
        break;
      case 'contactEmail':
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          return 'Debe ser un email válido';
        }
        break;
      case 'password':
        if (value.length < 8 || value.length > 128) {
          return 'Debe tener entre 8 y 128 caracteres';
        }
        break;
      case 'phoneNumber':
        if (value && !/^[\+]?[0-9\s\-\(\)]{8,20}$/.test(value)) {
          return 'Formato inválido';
        }
        break;
    }
    return '';
  };

  // Manejar cambios en los campos
  const handleFieldChange = (fieldName: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: value
    }));

    const error = validateField(fieldName, value);
    setFieldErrors(prev => ({
      ...prev,
      [fieldName]: error
    }));
  };

  // Manejar envío del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError(null);

    // Validar todos los campos
    const errors: Record<string, string> = {};
    Object.entries(formData).forEach(([key, value]) => {
      if (key !== 'phoneNumber') { // El teléfono es opcional
        const error = validateField(key, value.toString());
        if (error) {
          errors[key] = error;
        }
      } else if (value) {
        const error = validateField(key, value.toString());
        if (error) {
          errors[key] = error;
        }
      }
    });

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setGeneralError("Por favor corrige los errores en el formulario.");
      return;
    }

    // Preparar datos para enviar
    const slug = generateSlug(formData.companyName);
    const payload = {
      tenantName: formData.companyName,
      slug,
      plan: formData.selectedPlan,
      contactName: formData.contactName,
      contactEmail: formData.contactEmail,
      password: formData.password,
      phoneNumber: formData.phoneNumber || undefined
    };

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/auth/register-tenant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        setGeneralError(result.error || "Ha ocurrido un error al crear la empresa.");
        return;
      }

      // Guardar datos del tenant creado
      setTenantCreated(result);
      setStep(2); // Avanzar al paso de confirmación

      // Mostrar toast de éxito
      toast({
        title: "¡Empresa creada con éxito!",
        description: `${result.tenant.name} ha sido registrada correctamente.`,
      });

    } catch (error: any) {
      setGeneralError(error.message || "Error de conexión. Intenta nuevamente.");
      
      toast({
        title: "Error",
        description: "No se pudo crear la empresa. Verifica tu conexión.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Función para ir al login después de crear
  const goToLogin = () => {
    router.push('/login');
  };

  // Componente para el paso 2 (confirmación)
  if (step === 2 && tenantCreated) {
    return (
      <Card className="mx-auto w-full max-w-md rounded-3xl border-2 border-slate-200 bg-white shadow-2xl">
        <CardHeader className="text-center pb-6">
          <div className="mx-auto mb-4 grid size-16 place-items-center rounded-2xl bg-gradient-to-br from-[#81C101] to-[#9ED604] shadow-lg">
            <Check className="size-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold text-slate-800">¡Todo listo!</CardTitle>
          <CardDescription className="text-slate-600 mt-2">
            <strong className="text-[#81C101]">{tenantCreated.tenant.name}</strong> ha sido registrada exitosamente
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <div className="rounded-xl border-2 border-[#81C101]/20 bg-[#81C101]/5 p-4 mb-6">
            <p className="text-sm text-[#81C101]">
              Tu cuenta de administrador ha sido creada con tu email:<br/>
              <strong>{tenantCreated.user.email}</strong>
            </p>
          </div>
          <p className="text-sm text-slate-600 mb-8">
            Ahora puedes acceder al dashboard para comenzar a gestionar tu empresa.
          </p>
        </CardContent>
        <CardFooter className="justify-center pt-0">
          <Button 
            onClick={goToLogin}
            className="bg-gradient-to-r from-[#81C101] to-[#9ED604] hover:from-[#73AC01] hover:to-[#8BC34A] text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 cursor-pointer w-full h-12"
          >
            Ir al inicio de sesión
          </Button>
        </CardFooter>
      </Card>
    );
  }

  // Formulario principal (paso 1)
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
          <form onSubmit={handleSubmit} className="space-y-10">
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
                  value={formData.companyName}
                  onChange={handleFieldChange}
                  fieldName="companyName"
                  fieldErrors={fieldErrors}
                  required
                  placeholder="Ej: Finca Los Nogales"
                />
                <ValidatedInput
                  id="contact"
                  label="Tu nombre (propietario)"
                  value={formData.contactName}
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
                value={formData.contactEmail}
                onChange={handleFieldChange}
                fieldName="contactEmail"
                fieldErrors={fieldErrors}
                required
                placeholder="tu@email.com"
                icon={Mail}
              />
              
              {formData.companyName && (
                <div className="rounded-xl border-2 border-[#81C101]/20 bg-[#81C101]/5 p-4">
                  <p className="text-sm text-[#81C101] flex items-center gap-2">
                    <Check className="size-4" />
                    <strong>Identificador:</strong> {generateSlug(formData.companyName)}
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
                    selected={formData.selectedPlan === plan.value}
                    onSelect={() => setFormData(prev => ({ ...prev, selectedPlan: plan.value }))}
                  />
                ))}
              </div>

              <div className="rounded-xl border-2 border-[#81C101]/20 bg-[#81C101]/5 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <CheckCircle className="size-6 text-[#81C101]" />
                  <h4 className="font-bold text-[#81C101] text-lg">Plan seleccionado</h4>
                </div>
                {(() => {
                  const plan = PLANS.find(p => p.value === formData.selectedPlan);
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
                <div className="grid gap-3">
                  <Label htmlFor="password" className="text-sm font-semibold text-slate-700">
                    Contraseña <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) => handleFieldChange('password', e.target.value)}
                      required
                      className={`${inputStrong} pr-12 ${fieldErrors.password ? 'border-red-400 focus-visible:ring-red-400/30 focus-visible:border-red-400' : ''}`}
                      placeholder="Mínimo 8 caracteres"
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer transition-colors duration-200"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  <div className="h-5">
                    {fieldErrors.password && (
                      <p className="text-sm text-red-500 leading-tight flex items-center gap-1">
                        <span className="size-4 rounded-full bg-red-100 flex items-center justify-center">
                          <span className="size-2 rounded-full bg-red-500"></span>
                        </span>
                        {fieldErrors.password}
                      </p>
                    )}
                  </div>
                </div>
                
                <ValidatedInput
                  id="phoneNumber"
                  label="Teléfono"
                  value={formData.phoneNumber}
                  onChange={handleFieldChange}
                  fieldName="phoneNumber"
                  fieldErrors={fieldErrors}
                  placeholder="+54 9 261 123-4567"
                />
              </div>
            </section>

            {generalError && (
              <div className="rounded-xl border-2 border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-center gap-2">
                <span className="size-5 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                  <span className="size-2 rounded-full bg-red-500"></span>
                </span>
                {generalError}
              </div>
            )}

            <div className="flex flex-col gap-4 sm:flex-row sm:justify-between pt-6 border-t border-slate-200">
              <Button 
                type="submit" 
                disabled={isSubmitting} 
                className="h-12 px-8 bg-gradient-to-r from-[#81C101] to-[#9ED604] hover:from-[#73AC01] hover:to-[#8BC34A] text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 size-5 animate-spin" /> Creando empresa...
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
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}