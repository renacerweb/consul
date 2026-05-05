import LayoutGerenteRegional from '../../components/LayoutGerenteRegional';

function GerenteRegionalDashboard() {
  return (
    <LayoutGerenteRegional title="Dashboard Gerente Regional">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Bienvenido, Gerente Regional</h1>
        <p className="text-gray-600">Aquí podrás gestionar tus zonas y vendedoras.</p>
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-200">
            <h3 className="font-semibold text-emerald-800">Usuarios</h3>
            <p className="text-sm text-emerald-600">Crear Gerentes de Zona y Auxiliares</p>
          </div>
          <div className="bg-teal-50 p-4 rounded-lg border border-teal-200">
            <h3 className="font-semibold text-teal-800">Vendedoras</h3>
            <p className="text-sm text-teal-600">Registrar vendedoras y asignarlas a gerentes</p>
          </div>
        </div>
      </div>
    </LayoutGerenteRegional>
  );
}

export default GerenteRegionalDashboard;