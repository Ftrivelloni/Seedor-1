"use client"

import { FinanzasPage } from "../../components/finanzas/finanzas-page";
import { ProtectedLayout } from "../../components/layout/protected-layout";

export default function FinanzasRoutePage() {
  return (
    <ProtectedLayout
      title="Finanzas"
      subtitle="Gestión financiera y reportes"
      currentPage="finanzas"
      requiredRoles={["Admin", "Finanzas"]}
    >
      <FinanzasPage />
    </ProtectedLayout>
  );
}
