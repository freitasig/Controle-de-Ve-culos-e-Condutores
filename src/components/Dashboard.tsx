/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Vehicle, Driver, TripLog, Maintenance, Fine, FuelLog, CompanySettings } from '../types';
import { 
  Car, 
  Users, 
  AlertTriangle, 
  Clock, 
  FileText, 
  Wrench, 
  CheckCircle, 
  ShieldAlert,
  ArrowRight,
  ArrowUpRight,
  Calendar,
  Gauge,
  CircleDollarSign,
  Fuel,
  TrendingUp,
  Building2,
  Printer
} from 'lucide-react';

interface DashboardProps {
  vehicles: Vehicle[];
  drivers: Driver[];
  trips: TripLog[];
  maintenances: Maintenance[];
  fines: Fine[];
  fuelLogs?: FuelLog[];
  company?: CompanySettings;
  onNavigate: (tab: string) => void;
  onEndTrip: (tripId: string, endOdometer: number) => void;
  onEditCompany?: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  vehicles,
  drivers,
  trips,
  maintenances,
  fines,
  fuelLogs = [],
  company,
  onNavigate,
  onEndTrip,
  onEditCompany,
}) => {
  // Stats
  const totalVehicles = vehicles.length;
  const totalDrivers = drivers.length;
  const activeTrips = trips.filter(t => t.endDateTime === null);
  const unlinkedFinesCount = fines.filter(f => f.identificationStatus === 'pendente' && !f.driverId).length;

  // Compile active alerts of all kinds
  const alerts: {
    id: string;
    type: 'critical' | 'warning';
    category: 'maintenance' | 'document' | 'fine' | 'driver';
    title: string;
    description: string;
    itemType: string;
  }[] = [];

  // Check CNH expiries (current date in system is 2026-05-26)
  const systemDate = new Date('2026-05-26');
  drivers.forEach(driver => {
    const expiry = new Date(driver.cnhExpiry);
    if (expiry < systemDate) {
      alerts.push({
        id: `driver-cnh-expired-${driver.id}`,
        type: 'critical',
        category: 'driver',
        title: `CNH Vencida: ${driver.name}`,
        description: `CNH vencida em ${new Date(driver.cnhExpiry).toLocaleDateString('pt-BR')}.`,
        itemType: 'Motorista',
      });
    } else {
      const diffTime = expiry.getTime() - systemDate.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays <= 30 && diffDays > 0) {
        alerts.push({
          id: `driver-cnh-warning-${driver.id}`,
          type: 'warning',
          category: 'driver',
          title: `CNH prestes a vencer: ${driver.name}`,
          description: `Vence em ${diffDays} dias (${new Date(driver.cnhExpiry).toLocaleDateString('pt-BR')}).`,
          itemType: 'Motorista',
        });
      }
    }
  });

  // Check IPVA and Licensing for Vehicles
  vehicles.forEach(vehicle => {
    // Licensing
    const licDue = new Date(vehicle.licensingDueDate);
    if (vehicle.licensingStatus === 'vencido' || licDue < systemDate) {
      alerts.push({
        id: `lic-expired-${vehicle.id}`,
        type: 'critical',
        category: 'document',
        title: `Licenciamento Vencido: ${vehicle.brand} ${vehicle.model} (${vehicle.plate})`,
        description: `Vencimento em ${licDue.toLocaleDateString('pt-BR')}. Regularize imediatamente!`,
        itemType: 'Documento',
      });
    } else if (vehicle.licensingStatus === 'pendente') {
      const diffTime = licDue.getTime() - systemDate.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      alerts.push({
        id: `lic-pending-${vehicle.id}`,
        type: diffDays <= 7 ? 'critical' : 'warning',
        category: 'document',
        title: `Licenciamento Pendente: ${vehicle.brand} ${vehicle.model} (${vehicle.plate})`,
        description: diffDays <= 0 
          ? 'Hoje é o último dia para pagamento!' 
          : `Vence em ${diffDays} dias (${licDue.toLocaleDateString('pt-BR')}).`,
        itemType: 'Documento',
      });
    }

    // IPVA
    const ipvaDue = new Date(vehicle.ipvaDueDate);
    if (vehicle.ipvaStatus === 'vencido' || ipvaDue < systemDate) {
      alerts.push({
        id: `ipva-expired-${vehicle.id}`,
        type: 'critical',
        category: 'document',
        title: `IPVA Vencido: ${vehicle.brand} ${vehicle.model} (${vehicle.plate})`,
        description: `IPVA vencido em ${ipvaDue.toLocaleDateString('pt-BR')}.`,
        itemType: 'Documento',
      });
    } else if (vehicle.ipvaStatus === 'pendente') {
      const diffTime = ipvaDue.getTime() - systemDate.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      alerts.push({
        id: `ipva-pending-${vehicle.id}`,
        type: diffDays <= 15 ? 'critical' : 'warning',
        category: 'document',
        title: `IPVA Pendente: ${vehicle.brand} ${vehicle.model} (${vehicle.plate})`,
        description: `Valor de R$ ${vehicle.ipvaValue.toFixed(2)}. Vence em ${diffDays} dias (${ipvaDue.toLocaleDateString('pt-BR')}).`,
        itemType: 'Documento',
      });
    }
  });

  // Check Maintenance due
  maintenances.forEach(m => {
    if (m.status === 'concluida') {
      const vehicle = vehicles.find(v => v.id === m.vehicleId);
      if (vehicle) {
        // Evaluate limit by Odometer
        if (m.nextRecommendedOdometer) {
          const remainingKm = m.nextRecommendedOdometer - vehicle.currentOdometer;
          if (remainingKm <= 0) {
            alerts.push({
              id: `maint-odo-overdue-${m.id}`,
              type: 'critical',
              category: 'maintenance',
              title: `Manutenção Atrasada (Odômetro): ${vehicle.plate} (${vehicle.model})`,
              description: `"${m.description}" deveria ser refeita aos ${m.nextRecommendedOdometer.toLocaleString('pt-BR')} km. Km atual: ${vehicle.currentOdometer.toLocaleString('pt-BR')} km (Excedido por ${Math.abs(remainingKm).toLocaleString('pt-BR')} km).`,
              itemType: 'Manutenção',
            });
          } else if (remainingKm <= 1000) {
            alerts.push({
              id: `maint-odo-warn-${m.id}`,
              type: 'warning',
              category: 'maintenance',
              title: `Manutenção Próxima (Odômetro): ${vehicle.plate} (${vehicle.model})`,
              description: `"${m.description}" programada para ${m.nextRecommendedOdometer.toLocaleString('pt-BR')} km. Restam apenas ${remainingKm.toLocaleString('pt-BR')} km.`,
              itemType: 'Manutenção',
            });
          }
        }

        // Evaluate limit by Date
        if (m.nextRecommendedDate) {
          const nextDate = new Date(m.nextRecommendedDate);
          if (nextDate < systemDate) {
            alerts.push({
              id: `maint-date-overdue-${m.id}`,
              type: 'critical',
              category: 'maintenance',
              title: `Manutenção Atrasada (Prazo): ${vehicle.plate} (${vehicle.model})`,
              description: `"${m.description}" expirou o prazo em ${nextDate.toLocaleDateString('pt-BR')}.`,
              itemType: 'Manutenção',
            });
          } else {
            const diffTime = nextDate.getTime() - systemDate.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            if (diffDays <= 15) {
              alerts.push({
                id: `maint-date-warn-${m.id}`,
                type: 'warning',
                category: 'maintenance',
                title: `Manutenção Próxima (Prazo): ${vehicle.plate} (${vehicle.model})`,
                description: `"${m.description}" recomendada até ${nextDate.toLocaleDateString('pt-BR')} (em ${diffDays} dias).`,
                itemType: 'Manutenção',
              });
            }
          }
        }
      }
    }
  });

  // End odometer states for fast inline checkout returns
  const [returnOdometer, setReturnOdometer] = React.useState<{ [key: string]: string }>({});

  const handleQuickEnd = (tripId: string, currentStartOdo: number) => {
    const typedOdo = parseInt(returnOdometer[tripId] || '');
    if (!typedOdo || isNaN(typedOdo)) {
      alert('Por favor, informe a quilometragem de retorno.');
      return;
    }
    if (typedOdo <= currentStartOdo) {
      alert(`O odômetro de retorno deve ser maior que o de saída (${currentStartOdo.toLocaleString('pt-BR')} km).`);
      return;
    }
    onEndTrip(tripId, typedOdo);
    setReturnOdometer(prev => ({ ...prev, [tripId]: '' }));
  };

  return (
    <div className="space-y-6">
      {/* Dynamic Welcome Header row */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs" id="dashboard-welcome-header">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-black uppercase tracking-wider bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200 leading-none">
              Visão Geral / Auditoria
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          </div>
          <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight leading-none mt-2">Visão Geral da Frota</h3>
          <p className="text-xs text-slate-500 font-medium mt-1">Indicadores consolidados e controle ativo em tempo real.</p>
        </div>
        
        <button
          onClick={() => window.print()}
          type="button"
          className="px-4 py-2 bg-slate-900 hover:bg-slate-850 text-white text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 border border-slate-950"
          title="Gerar impressão do painel principal da frota"
        >
          <Printer size={13} />
          <span>Imprimir Relatório</span>
        </button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Vehicles */}
        <div 
          onClick={() => onNavigate('veiculos')} 
          className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs hover:shadow-md hover:border-slate-300 transition-all cursor-pointer group flex items-start justify-between"
          id="stat-vehicles"
        >
          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-500">Veículos Cadastrados</p>
            <h3 className="text-3xl font-semibold text-slate-950 font-sans tracking-tight">{totalVehicles}</h3>
            <div className="flex items-center gap-1 text-xs text-indigo-600 font-medium pt-1">
              Ver frota de carros <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <Car size={24} />
          </div>
        </div>

        {/* Drivers */}
        <div 
          onClick={() => onNavigate('motoristas')} 
          className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs hover:shadow-md hover:border-slate-300 transition-all cursor-pointer group flex items-start justify-between"
          id="stat-drivers"
        >
          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-500">Motoristas Registrados</p>
            <h3 className="text-3xl font-semibold text-slate-950 font-sans tracking-tight">{totalDrivers}</h3>
            <div className="flex items-center gap-1 text-xs text-blue-600 font-medium pt-1">
              Gerenciar motoristas <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Users size={24} />
          </div>
        </div>

        {/* Active Usage */}
        <div 
          onClick={() => onNavigate('viagens')} 
          className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs hover:shadow-md hover:border-slate-300 transition-all cursor-pointer group flex items-start justify-between"
          id="stat-trips"
        >
          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-500">Veículos em Trânsito</p>
            <h3 className="text-3xl font-semibold text-sky-600 font-sans tracking-tight">{activeTrips.length}</h3>
            <div className="flex items-center gap-1 text-xs text-sky-650 font-medium pt-1">
              Registrar saídas/entradas <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
          <div className="p-3 bg-sky-50 text-sky-600 rounded-xl">
            <Clock size={24} />
          </div>
        </div>

        {/* Pending Fines Identification */}
        <div 
          onClick={() => onNavigate('multas')} 
          className="bg-red-50/50 p-5 rounded-2xl border border-red-100 shadow-xs hover:shadow-md hover:border-red-300 transition-all cursor-pointer group flex items-start justify-between"
          id="stat-fines"
        >
          <div className="space-y-2">
            <p className="text-sm font-medium text-red-800">Multas Sem Condutor</p>
            <h3 className="text-3xl font-bold text-red-650 font-sans tracking-tight">{unlinkedFinesCount}</h3>
            <div className="flex items-center gap-1 text-xs text-red-700 font-semibold pt-1">
              Identificar condutor já! <ArrowUpRight size={12} className="group-hover:translate-y-[-1px] group-hover:translate-x-[1px] transition-transform" />
            </div>
          </div>
          <div className="p-3 bg-red-100 text-red-600 rounded-xl">
            <ShieldAlert size={24} />
          </div>
        </div>
      </div>

      {/* BI ANALYTICS BOARD */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6" id="dashboard-bi-analytics">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-sm sm:text-base font-extrabold text-slate-900 flex items-center gap-2">
              <TrendingUp className="text-blue-600" size={18} />
              Painel de Despesas Consolidadas & Gestão BI
            </h2>
            <p className="text-[11px] text-slate-500 font-medium">Controle de custos agregados nas operações da empresa (CNPJ)</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs bg-slate-50 text-slate-800 font-extrabold px-3 py-1.5 rounded-xl flex items-center gap-1.5 border border-slate-250">
              <CircleDollarSign size={14} className="text-emerald-600 animate-pulse" />
              Gastos Totais Operacionais: R$ {(
                maintenances.reduce((acc, current) => acc + current.cost, 0) +
                fines.reduce((acc, current) => acc + current.value, 0) +
                fuelLogs.reduce((acc, current) => acc + current.cost, 0)
              ).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* 2-Column charts section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Column A: Multi-series cost distribution */}
          <div className="space-y-3">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <CircleDollarSign size={14} className="text-emerald-500" />
              Aporte de Custo por Categoria Financeira
            </h4>
            
            {/* Horizontal Stacked Bars and indicators */}
            <div className="space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-150">
              {(() => {
                const totalMain = maintenances.reduce((acc, curr) => acc + curr.cost, 0);
                const totalFines = fines.reduce((acc, curr) => acc + curr.value, 0);
                const totalFuel = fuelLogs.reduce((acc, curr) => acc + curr.cost, 0);
                const grandTotal = totalMain + totalFines + totalFuel || 1;

                const pMain = (totalMain / grandTotal) * 100;
                const pFines = (totalFines / grandTotal) * 100;
                const pFuel = (totalFuel / grandTotal) * 100;

                return (
                  <div className="space-y-4">
                    {/* Visual Segmented bar */}
                    <div className="h-6 w-full bg-slate-200 rounded-full overflow-hidden flex shadow-inner">
                      {totalMain > 0 && (
                        <div 
                          style={{ width: `${pMain}%` }} 
                          className="bg-blue-600 h-full hover:brightness-95 transition-all text-[9px] sm:text-[10px] font-extrabold text-white flex items-center justify-center truncate"
                          title={`Manutenção: R$ ${totalMain.toFixed(2)}`}
                        >
                          {pMain > 12 && `${pMain.toFixed(0)}%`}
                        </div>
                      )}
                      {totalFuel > 0 && (
                        <div 
                          style={{ width: `${pFuel}%` }} 
                          className="bg-emerald-500 h-full hover:brightness-95 transition-all text-[9px] sm:text-[10px] font-extrabold text-white flex items-center justify-center truncate"
                          title={`Combustível: R$ ${totalFuel.toFixed(2)}`}
                        >
                          {pFuel > 12 && `${pFuel.toFixed(0)}%`}
                        </div>
                      )}
                      {totalFines > 0 && (
                        <div 
                          style={{ width: `${pFines}%` }} 
                          className="bg-red-500 h-full hover:brightness-95 transition-all text-[9px] sm:text-[10px] font-extrabold text-white flex items-center justify-center truncate"
                          title={`Multas: R$ ${totalFines.toFixed(2)}`}
                        >
                          {pFines > 12 && `${pFines.toFixed(0)}%`}
                        </div>
                      )}
                    </div>

                    {/* Numeric details row */}
                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                      <div className="p-2 sm:p-2.5 bg-white rounded-lg border border-slate-200">
                        <span className="block text-[9px] uppercase tracking-wider font-bold text-slate-400">Manutenção</span>
                        <p className="font-black text-blue-600 mt-1">R$ {totalMain.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</p>
                        <p className="text-[10px] text-slate-400 font-medium font-mono">({pMain.toFixed(1)}%)</p>
                      </div>
                      <div className="p-2 sm:p-2.5 bg-white rounded-lg border border-slate-200">
                        <span className="block text-[9px] uppercase tracking-wider font-bold text-slate-400">Combustível</span>
                        <p className="font-black text-emerald-600 mt-1">R$ {totalFuel.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</p>
                        <p className="text-[10px] text-slate-400 font-medium font-mono">({pFuel.toFixed(1)}%)</p>
                      </div>
                      <div className="p-2 sm:p-2.5 bg-white rounded-lg border border-slate-200">
                        <span className="block text-[9px] uppercase tracking-wider font-bold text-slate-400">Multas CNPJ</span>
                        <p className="font-black text-red-500 mt-1">R$ {totalFines.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</p>
                        <p className="text-[10px] text-slate-400 font-medium font-mono">({pFines.toFixed(1)}%)</p>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>

          {/* Column B: Fuel optimization / Efficiency by Car */}
          <div className="space-y-3">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Fuel size={14} className="text-blue-500" />
              Consumo Correlacionado por Veículo Ativo
            </h4>

            {/* Custom Efficiency bars */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-150 space-y-3">
              {vehicles.length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center">Nenhum veículo cadastrado na frota corporativa.</p>
              ) : (
                <div className="space-y-3">
                  {vehicles.slice(0, 3).map(v => {
                    const vehicleFuelLogs = fuelLogs.filter(fl => fl.vehicleId === v.id);
                    const totalLiters = vehicleFuelLogs.reduce((acc, curr) => acc + curr.liters, 0);
                    const totalFuelCost = vehicleFuelLogs.reduce((acc, curr) => acc + curr.cost, 0);

                    return (
                      <div key={v.id} className="space-y-1">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-slate-800">{v.brand} {v.model} ({v.plate})</span>
                          <span className="text-slate-500 font-bold font-mono text-[10px]">
                            {vehicleFuelLogs.length} Abast. • Total {totalLiters || 0} L • R$ {totalFuelCost.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                          </span>
                        </div>
                        {/* Progress bar representing refuel logs volume relative to other cars */}
                        <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden flex border border-slate-100">
                          <div 
                            style={{ width: `${Math.max(10, Math.min(100, (totalFuelCost / 800) * 100))}%` }} 
                            className="bg-emerald-500 rounded-full h-full transition-all duration-500"
                          />
                        </div>
                      </div>
                    );
                  })}
                  <p className="text-[10px] text-slate-400 italic text-right font-medium">Acompanhamento completo na aba Veículos</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Active trips block */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main section: Active Trips and quick check-in */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-sky-500"></span>
                  </span>
                  Utilizações Ativas em Andamento
                </h2>
                <p className="text-xs text-slate-500">Identifique no mapa ou registre a devolução dos veículos em uso</p>
              </div>
              <button 
                onClick={() => onNavigate('viagens')}
                className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1"
              >
                Novo registro <ArrowRight size={12} />
              </button>
            </div>

            {activeTrips.length === 0 ? (
              <div className="p-8 border border-dashed border-slate-150 rounded-xl text-center space-y-2">
                <Car className="mx-auto text-slate-350" size={32} />
                <p className="text-sm font-medium text-slate-600">Nenhum veículo em rota no momento.</p>
                <p className="text-xs text-slate-400">Todos os carros estão estacionados na garagem da empresa.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {activeTrips.map(trip => {
                  const vehicle = vehicles.find(v => v.id === trip.vehicleId);
                  const driver = drivers.find(d => d.id === trip.driverId);
                  const startDate = new Date(trip.startDateTime);

                  return (
                    <div key={trip.id} className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="bg-slate-900 text-white font-mono text-xs px-2 py-0.5 rounded tracking-wide font-semibold border border-slate-800">
                            {vehicle?.plate || 'S/P'}
                          </span>
                          <span className="text-sm font-semibold text-slate-800">
                            {vehicle?.brand} {vehicle?.model}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-slate-500">
                          <div>
                            <span className="font-medium text-slate-700">Condutor:</span> {driver?.name || 'Não cadastrado'}
                          </div>
                          <div>
                            <span className="font-medium text-slate-700">CNH:</span> {driver?.cnh} ({driver?.cnhCategory})
                          </div>
                          <div>
                            <span className="font-medium text-slate-700">Saída em:</span> {startDate.toLocaleString('pt-BR')}
                          </div>
                          <div>
                            <span className="font-medium text-slate-700">Km inicial:</span> {trip.startOdometer.toLocaleString('pt-BR')} km
                          </div>
                        </div>
                        {trip.purpose && (
                          <p className="text-xs text-slate-400 italic bg-slate-50 px-2 py-1 rounded max-w-md">
                            Motivo: {trip.purpose}
                          </p>
                        )}
                      </div>

                      {/* Quick Return actions */}
                      <div className="sm:max-w-xs flex items-center gap-2">
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
                            <Gauge size={14} />
                          </div>
                          <input
                            type="number"
                            placeholder="Km Retorno"
                            style={{ paddingLeft: '28px' }}
                            value={returnOdometer[trip.id] || ''}
                            onChange={(e) => setReturnOdometer({ ...returnOdometer, [trip.id]: e.target.value })}
                            className="text-xs h-9 w-28 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-1 focus:ring-blue-500 focus:outline-none"
                          />
                        </div>
                        <button
                          onClick={() => handleQuickEnd(trip.id, trip.startOdometer)}
                          className="h-9 px-3 bg-blue-600 hover:bg-slate-950 text-white text-xs font-semibold rounded-lg shadow-sm hover:shadow-md transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer"
                        >
                          <CheckCircle size={14} />
                          Finalizar
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Rapid driver finder presentation block */}
          <div className="bg-gradient-to-r from-slate-900 to-slate-950 p-6 rounded-2xl text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 border border-slate-800">
            <div className="space-y-2">
              <span className="text-[10px] uppercase font-bold tracking-widest text-blue-300 bg-blue-500/20 px-2.5 py-1 rounded-full border border-blue-500/20">
                Exclusivo para CNPJ
              </span>
              <h3 className="text-lg font-bold tracking-tight leading-snug">
                Recebeu uma multa e precisa indicar o motorista?
              </h3>
              <p className="text-xs text-slate-300 max-w-lg leading-relaxed">
                Nossa IA inteligente busca nos registros diários de chaves quem estava dirigindo o carro no dia e hora exatos da infração, evitando perdas de prazos e multas por não indicação de condutor (Multa NIC)!
              </p>
            </div>
            <button 
              onClick={() => onNavigate('multas')}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl tracking-wide shadow-md hover:shadow-lg transition-all shrink-0 flex items-center gap-2 cursor-pointer"
            >
              <ShieldAlert size={16} />
              Identificar Condutor Agora
            </button>
          </div>
        </div>

        {/* Right column: Alerts and maintenance schedules */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-900 flex items-center gap-1.5">
                <AlertTriangle size={18} className="text-amber-500 shrink-0" />
                Alertas da Frota ({alerts.length})
              </h2>
              {alerts.length > 0 && (
                <span className="bg-red-100 text-red-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  Imediato
                </span>
              )}
            </div>

            {alerts.length === 0 ? (
              <div className="p-8 text-center text-slate-500 space-y-1">
                <CheckCircle className="mx-auto text-emerald-500" size={28} />
                <p className="text-sm font-medium text-emerald-700">Tudo em dia!</p>
                <p className="text-xs text-slate-400">Nenhum alerta de documento, CNH ou manutenção pendente.</p>
              </div>
            ) : (
              <div className="max-h-[380px] overflow-y-auto space-y-3 pr-1">
                {alerts.map((alertItem) => (
                  <div
                    key={alertItem.id}
                    className={`p-3 rounded-xl border text-xs flex flex-col gap-1 ${
                      alertItem.type === 'critical'
                        ? 'bg-red-50/50 border-red-100 text-red-900'
                        : 'bg-amber-50/40 border-amber-100 text-amber-900'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                        alertItem.type === 'critical' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {alertItem.itemType}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium font-mono">
                        {alertItem.category === 'maintenance' ? 'Manut.' : alertItem.category === 'document' ? 'Doc' : alertItem.category === 'driver' ? 'Motorista' : 'Geral'}
                      </span>
                    </div>
                    <p className="font-semibold">{alertItem.title}</p>
                    <p className="text-slate-600 leading-relaxed font-sans">{alertItem.description}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
