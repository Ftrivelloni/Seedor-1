export default function ContactosPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Gestión de Contactos</h1>
          <p className="text-muted-foreground">Registrá y consultá contactos clave asociados a la operación del campo (proveedores, transportistas, servicios externos, etc).</p>
        </div>
      </div>

      {/* Ejemplo de tarjetas informativas */}
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

      {/* Aquí irán los formularios y tablas de contactos */}
    </div>
  );
}
