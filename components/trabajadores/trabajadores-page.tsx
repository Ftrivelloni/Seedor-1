export default function TrabajadoresPage() {
  return (
  <div className="space-y-6 px-4 py-6 max-w-5xl mx-auto">
      {/* Header principal igual que Finanzas, Campo, Empaque y Ajustes */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Gestión de Trabajadores</h1>
          <p className="text-muted-foreground">Control y administración de los trabajadores del campo</p>
        </div>
        {/* Aquí podrías agregar acciones futuras */}
      </div>

      {/* Tarjetas con estilo unificado */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col justify-between">
          <h3 className="font-semibold text-lg mb-2 text-yellow-600">Creación de trabajadores</h3>
          <p className="text-sm text-gray-500">Alta de nuevos trabajadores en el sistema.</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col justify-between">
          <h3 className="font-semibold text-lg mb-2 text-yellow-600">Asignación de área</h3>
          <p className="text-sm text-gray-500">Asigná el área a la que pertenece cada trabajador (campo, finanzas, etc).</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col justify-between">
          <h3 className="font-semibold text-lg mb-2 text-yellow-600">Stats de asistencia</h3>
          <p className="text-sm text-gray-500">Visualizá si faltaron o no y el motivo.</p>
        </div>
      </div>
      {/* Aquí irán los formularios y tablas de gestión */}
    </div>
  );
}
