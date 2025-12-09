// app/funcionalidades/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Crown, Lock, Star, Zap, ArrowRight, Check, X } from "lucide-react";
import { MODULES, FEATURES, type Feature } from "../../lib/features";
import { PLAN_FEATURE_CONFIGS, getPlanConfig, isFeatureIncludedInPlan, getRecommendedUpgrade } from "../../lib/plan-features";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { Alert, AlertDescription } from "../../components/ui/alert";
import { useUser } from "../../lib/auth";

export default function FuncionalidadesEnhanced() {
    const router = useRouter();
    const { user, loading } = useUser();
    const [currentPlan, setCurrentPlan] = useState<string>("basic");

    useEffect(() => {
        if (!loading && !user) {
            router.push("/login");
            return;
        }

        if (user?.tenant?.plan) {
            setCurrentPlan(user.tenant.plan);
        }
    }, [user, loading, router]);

    const planConfig = useMemo(() => {
        return getPlanConfig(currentPlan);
    }, [currentPlan]);

    const recommendedUpgrade = useMemo(() => {
        return getRecommendedUpgrade(currentPlan);
    }, [currentPlan]);

    const featuresByModule = useMemo(() => {
        const modules: Record<string, {
            features: (Feature & { 
                included: boolean; 
                availableInPlan: string | null; 
                isRequired: boolean;
            })[];
            totalFeatures: number;
            includedFeatures: number;
        }> = {};

        for (const moduleName of MODULES) {
            modules[moduleName] = {
                features: [],
                totalFeatures: 0,
                includedFeatures: 0
            };
        }

        for (const feature of FEATURES) {
            const included = isFeatureIncludedInPlan(feature.id, currentPlan);
            const isRequired = feature.required;
            
            let availableInPlan: string | null = null;
            if (!included && !isRequired) {
                for (const config of PLAN_FEATURE_CONFIGS) {
                    if (config.includedFeatures.includes(feature.id)) {
                        availableInPlan = config.planId;
                        break;
                    }
                }
            }

            const enhancedFeature = {
                ...feature,
                included,
                availableInPlan,
                isRequired
            };

            modules[feature.module].features.push(enhancedFeature);
            modules[feature.module].totalFeatures++;
            if (included || isRequired) {
                modules[feature.module].includedFeatures++;
            }
        }

        return modules;
    }, [currentPlan]);

    const overallStats = useMemo(() => {
        const total = FEATURES.length;
        const included = FEATURES.filter(f => 
            f.required || isFeatureIncludedInPlan(f.id, currentPlan)
        ).length;
        const percentage = Math.round((included / total) * 100);
        
        return { total, included, percentage };
    }, [currentPlan]);

    const getPlanIcon = (planId: string) => {
        switch (planId) {
            case 'basic': return <Star className="h-4 w-4" />;
            case 'pro': return <Zap className="h-4 w-4" />;
            case 'enterprise': return <Crown className="h-4 w-4" />;
            default: return <Star className="h-4 w-4" />;
        }
    };

    const getPlanColor = (planId: string) => {
        switch (planId) {
            case 'basic': return 'text-blue-600 bg-blue-100';
            case 'pro': return 'text-primary bg-primary/10';
            case 'enterprise': return 'text-purple-600 bg-purple-100';
            default: return 'text-blue-600 bg-blue-100';
        }
    };

    if (loading) {
        return (
            <main className="mx-auto max-w-6xl px-4 py-10">
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            </main>
        );
    }

    if (!user) {
        return null; 
    }

    return (
        <main className="mx-auto max-w-6xl px-4 py-10">
            <div className="mb-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-extrabold text-primary/90">
                            Funcionalidades de tu plan
                        </h1>
                        <p className="mt-2 text-muted-foreground">
                            Gestiona las funcionalidades disponibles según tu plan de suscripción
                        </p>
                    </div>
                    
                    <div className="flex items-center gap-3">
                        <Badge variant="outline" className={`${getPlanColor(currentPlan)} border-current`}>
                            <div className="flex items-center gap-1">
                                {getPlanIcon(currentPlan)}
                                <span className="font-medium">{planConfig?.planName || "Plan Actual"}</span>
                            </div>
                        </Badge>
                        <Button variant="outline" onClick={() => router.push("/ajustes")}>
                            Gestionar plan
                        </Button>
                    </div>
                </div>

                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Funcionalidades</p>
                                    <p className="text-2xl font-bold">
                                        {overallStats.included}<span className="text-sm text-muted-foreground">/{overallStats.total}</span>
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm text-muted-foreground">Disponibles</p>
                                    <p className="text-lg font-semibold text-primary">{overallStats.percentage}%</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Usuarios</p>
                                    <p className="text-2xl font-bold">
                                        {planConfig?.maxUsers === -1 ? "∞" : planConfig?.maxUsers || 0}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm text-muted-foreground">Campos</p>
                                    <p className="text-lg font-semibold">
                                        {planConfig?.maxFields === -1 ? "∞" : planConfig?.maxFields || 0}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Precio mensual</p>
                                    <p className="text-2xl font-bold">
                                        ${planConfig?.price || 0}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm text-muted-foreground">Plan</p>
                                    <p className="text-lg font-semibold">{planConfig?.planName}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {recommendedUpgrade && (
                <Alert className="mb-6 border-primary/20 bg-primary/5">
                    <Star className="h-4 w-4 text-primary" />
                    <AlertDescription>
                        <div className="flex items-center justify-between">
                            <div>
                                <strong>¿Necesitas más funcionalidades?</strong>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Upgrade al plan <strong>{recommendedUpgrade.planName}</strong> y desbloquea 
                                    {" "}{recommendedUpgrade.includedFeatures.length - (planConfig?.includedFeatures.length || 0)} funcionalidades adicionales
                                </p>
                            </div>
                            <Button size="sm" onClick={() => router.push("/ajustes")}>
                                Upgrade <ArrowRight className="h-4 w-4 ml-1" />
                            </Button>
                        </div>
                    </AlertDescription>
                </Alert>
            )}

            <div className="space-y-6">
                {MODULES.map((moduleName) => {
                    const moduleData = featuresByModule[moduleName];
                    if (!moduleData?.features.length) return null;

                    return (
                        <Card key={moduleName} className="overflow-hidden">
                            <CardHeader className="bg-muted/30">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <CardTitle className="text-lg">{moduleName}</CardTitle>
                                        <CardDescription>
                                            {moduleData.includedFeatures} de {moduleData.totalFeatures} funcionalidades disponibles
                                        </CardDescription>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-sm font-medium">
                                            {Math.round((moduleData.includedFeatures / moduleData.totalFeatures) * 100)}%
                                        </div>
                                        <div className="w-20 h-2 bg-muted rounded-full">
                                            <div 
                                                className="h-full bg-primary rounded-full transition-all duration-300"
                                                style={{ 
                                                    width: `${(moduleData.includedFeatures / moduleData.totalFeatures) * 100}%` 
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </CardHeader>
                            
                            <CardContent className="p-0">
                                <div className="divide-y">
                                    {moduleData.features.map((feature) => (
                                        <div
                                            key={feature.id}
                                            className={`flex items-center justify-between p-4 ${
                                                feature.included || feature.isRequired
                                                    ? 'bg-green-50/50' 
                                                    : 'bg-gray-50/50'
                                            }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                                    feature.included || feature.isRequired
                                                        ? 'bg-green-100 text-green-700'
                                                        : 'bg-gray-100 text-gray-400'
                                                }`}>
                                                    {feature.included || feature.isRequired ? (
                                                        <Check className="h-4 w-4" />
                                                    ) : (
                                                        <X className="h-4 w-4" />
                                                    )}
                                                </div>
                                                
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className={`font-medium ${
                                                            feature.included || feature.isRequired
                                                                ? 'text-foreground'
                                                                : 'text-muted-foreground'
                                                        }`}>
                                                            {feature.title}
                                                        </span>
                                                        
                                                        {feature.isRequired && (
                                                            <Badge variant="outline" className="text-xs bg-yellow-100 text-yellow-800 border-yellow-300">
                                                                Obligatoria
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    
                                                    {!feature.included && !feature.isRequired && feature.availableInPlan && (
                                                        <p className="text-xs text-muted-foreground">
                                                            Disponible en plan {" "}
                                                            <span className="font-medium capitalize">
                                                                {PLAN_FEATURE_CONFIGS.find(p => p.planId === feature.availableInPlan)?.planName}
                                                            </span>
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                            
                                            <div className="flex items-center gap-2">
                                                {feature.included || feature.isRequired ? (
                                                    <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
                                                        Incluida
                                                    </Badge>
                                                ) : (
                                                    <div className="flex items-center gap-2">
                                                        <Lock className="h-4 w-4 text-gray-400" />
                                                        <Badge variant="outline" className="text-gray-600">
                                                            Bloqueada
                                                        </Badge>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            <div className="mt-8 text-center">
                <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
                    <CardContent className="pt-6">
                        <h3 className="text-lg font-semibold mb-2">
                            ¿Necesitas desbloquear más funcionalidades?
                        </h3>
                        <p className="text-muted-foreground mb-4">
                            Upgrade tu plan para acceder a todas las herramientas avanzadas de gestión agropecuaria
                        </p>
                        <div className="flex gap-3 justify-center">
                            <Button onClick={() => router.push("/ajustes")}>
                                Ver planes disponibles
                            </Button>
                            <Button variant="outline" onClick={() => router.push("/contactenos")}>
                                Contactar ventas
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </main>
    );
}