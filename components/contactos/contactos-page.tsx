export default function ContactosPage() {
  return (
    <div className="flex-1 flex flex-col">
      <header className="border-b bg-card">
        <div className="flex h-16 items-center justify-between px-6">
          <div>
            <h1 className="text-xl font-semibold">Gestión de Contactos</h1>
            <p className="text-sm text-muted-foreground">Registrá y consultá contactos clave asociados a la operación del campo</p>
          </div>
        </div>
      </header>
      <main className="flex-1 p-6 overflow-auto">
        <div className="max-w-7xl mx-auto space-y-6">

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col justify-between">
          <h3 className="font-semibold text-lg mb-2 text-yellow-600">Proveedores</h3>
          <p className="text-sm text-gray-500">Contactos de empresas o personas que proveen insumos, fertilizantes, semillas, etc.</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col justify-between">
          <h3 className="font-semibold text-lg mb-2 text-yellow-600">Transportistas</h3>
          <p className="text-sm text-gray-500">Contactos de quienes realizan el traslado de productos, insumos o personal.</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col justify-between">
          <h3 className="font-semibold text-lg mb-2 text-yellow-600">Servicios externos</h3>
          <p className="text-sm text-gray-500">Contactos de técnicos, asesores, mantenimiento, y otros servicios tercerizados.</p>
        </div>
      </div>

        </div>
      </main>
    </div>
  );
}
