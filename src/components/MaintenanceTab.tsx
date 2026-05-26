/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Vehicle, Maintenance } from '../types';
import { 
  Wrench, 
  Plus, 
  Trash2, 
  Calendar, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle,
  Clock, 
  DollarSign, 
  Search,
  Filter,
  X,
  PlusCircle,
  ShieldCheck
} from 'lucide-react';

interface MaintenanceTabProps {
  maintenances: Maintenance[];
  vehicles: Vehicle[];
  onAddMaintenance: (m: Omit<Maintenance, 'id'>) => void;
  onDeleteMaintenance: (id: string) => void;
  onEditMaintenance: (id: string, updated: Partial<Maintenance>) => void;
}

export const MaintenanceTab: React.FC<MaintenanceTabProps> = ({
  maintenances,
  vehicles,
  onAddMaintenance,
  onDeleteMaintenance,
  onEditMaintenance,
}) => {
  const [showAddForm, setShowAddForm] = useState(false);

  // Form State
  const [vehicleId, setVehicleId] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('2026-05-26');
  const [odometer, setOdometer] = useState<number>(0);
  const [cost, setCost] = useState<number>(0);
  const [status, setStatus] = useState<'concluida' | 'agendada'>('concluida');
  
  // Odometer and Date estimations
  const [enableOdoEst, setEnableOdoEst] = useState(false);
  const [nextRecommendedOdometer, setNextRecommendedOdometer] = useState<number>(10000);
  
  const [enableDateEst, setEnableDateEst] = useState(false);
  const [nextRecommendedDate, setNextRecommendedDate] = useState('2026-11-26');

  // Filter list state
  const [filterVehicleId, setFilterVehicleId] = useState('all');

  const handleVehicleChange = (vId: string) => {
    setVehicleId(vId);
    const vehicle = vehicles.find(v => v.id === vId);
    if (vehicle) {
      setOdometer(vehicle.currentOdometer);
      setNextRecommendedOdometer(vehicle.currentOdometer + 10000); // 10.005 km default interval config
    }
  };

  const handleOpenAdd = () => {
    if (vehicles.length > 0) {
      handleVehicleChange(vehicles[0].id);
    } else {
      setVehicleId('');
      setOdometer(0);
    }
    setDescription('');
    setDate('2026-05-26');
    setCost(0);
    setStatus('concluida');
    setEnableOdoEst(false);
    setEnableDateEst(false);
    setShowAddForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehicleId || !description) {
      alert('Selecione o veículo e indique a descrição da manutenção.');
      return;
    }

    onAddMaintenance({
      vehicleId,
      description,
      date,
      odometer,
      cost,
      status,
      nextRecommendedOdometer: enableOdoEst ? nextRecommendedOdometer : null,
      nextRecommendedDate: enableDateEst ? nextRecommendedDate : null,
    });

    setShowAddForm(false);
  };

  // Financial compilation
  const totalCost = maintenances
    .filter(m => m.status === 'concluida')
    .reduce((sum, m) => sum + m.cost, 0);

  // Filter list
  const filteredMaintenances = maintenances.filter(m => {
    return filterVehicleId === 'all' || m.vehicleId === filterVehicleId;
  });

  return (
    <div className="space-y-6">
      {/* Top statistics summary headers */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Cost Invested */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-500 uppercase">Investido em Manutenção</p>
            <h3 className="text-2xl font-bold text-slate-900 font-sans tracking-tight">
              R$ {totalCost.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </h3>
            <p className="text-[10px] text-emerald-600 font-medium leading-none">Total de serviços concluídos</p>
          </div>
          <div className="p-3.5 bg-emerald-50 text-emerald-650 rounded-xl">
            <TrendingUp size={22} />
          </div>
        </div>

        {/* Completed service volume */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-500 uppercase">Serviços Concluídos</p>
            <h3 className="text-2xl font-bold text-slate-950">
              {maintenances.filter(m => m.status === 'concluida').length}
            </h3>
            <p className="text-[10px] text-slate-400 font-medium leading-none">Em nossa frota CNPJ ao total</p>
          </div>
          <div className="p-3.5 bg-indigo-50 text-indigo-650 rounded-xl">
            <CheckCircle size={22} />
          </div>
        </div>

        {/* Scheduled upcoming maintenance */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-slate-500 uppercase">Agendadas / Oficinas</p>
            <h3 className="text-2xl font-bold text-indigo-600">
              {maintenances.filter(m => m.status === 'agendada').length}
            </h3>
            <p className="text-[10px] text-indigo-500 font-medium leading-none">Manutenções agendadas futuras</p>
          </div>
          <div className="p-3.5 bg-indigo-50 text-indigo-600 rounded-xl">
            <Wrench size={22} />
          </div>
        </div>
      </div>

      {/* Tab actions header split */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Histórico de Manutenções da Oficina</h2>
          <p className="text-xs text-slate-500">Organize os custos operacionais, previna quebras e configure alertas automáticos</p>
        </div>
        {!showAddForm && (
          <button
            onClick={handleOpenAdd}
            className="h-10 px-4 bg-indigo-650 hover:bg-slate-900 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition-all self-start sm:self-center cursor-pointer shadow-xs"
            id="btn-add-maint"
          >
            <Plus size={16} />
            Lançar Manutenção
          </button>
        )}
      </div>

      {/* Add Maintenance Form */}
      {showAddForm && (
        <div className="bg-white p-6 rounded-2xl border border-slate-150 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700">
              Registrar Serviço de Manutenção Preventiva/Corretiva
            </h3>
            <button 
              onClick={() => setShowAddForm(false)}
              className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {/* Select target vehicle */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-500 uppercase">Selecione o Veículo *</label>
                <select
                  required
                  value={vehicleId}
                  onChange={(e) => handleVehicleChange(e.target.value)}
                  className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                >
                  <option value="">-- Selecione o veículo --</option>
                  {vehicles.map(v => (
                    <option key={v.id} value={v.id}>
                      {v.plate} - {v.brand} {v.model}
                    </option>
                  ))}
                </select>
              </div>

              {/* Service description */}
              <div className="space-y-1 sm:col-span-2">
                <label className="text-[11px] font-semibold text-slate-500 uppercase">Descrição do Serviço Realizado / Planejado *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Troca de óleo de motor 5w30, Troca de pneus, Alesta de freio..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {/* Date service */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-500 uppercase">Data do Serviço</label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              {/* Odometer service */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-500 uppercase">Km do Veículo na Oficina</label>
                <input
                  type="number"
                  required
                  value={odometer}
                  onChange={(e) => setOdometer(parseInt(e.target.value) || 0)}
                  className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              {/* Cost service */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-500 uppercase">Custo Total (R$)</label>
                <input
                  type="number"
                  required
                  value={cost}
                  onChange={(e) => setCost(parseFloat(e.target.value) || 0)}
                  className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              {/* Status block info */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-500 uppercase">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as 'concluida' | 'agendada')}
                  className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                >
                  <option value="concluida">Concluída / Executada</option>
                  <option value="agendada">Agendada / Preventiva</option>
                </select>
              </div>
            </div>

            {/* Next Recommended Maintenance Predictions */}
            {status === 'concluida' && (
              <div className="p-4 bg-slate-50/70 rounded-xl border border-slate-150 space-y-4">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
                  <ShieldCheck size={15} className="text-indigo-600" />
                  Previsão Próxima Manutenção Alerta (Prazo & Km)
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Kilometers alert setting */}
                  <div className="space-y-2 select-none">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="check-odo-est"
                        checked={enableOdoEst}
                        onChange={(e) => setEnableOdoEst(e.target.checked)}
                        className="h-4 w-4 border-slate-300 text-indigo-650 rounded focus:ring-1 focus:ring-indigo-550"
                      />
                      <label htmlFor="check-odo-est" className="text-xs font-semibold text-slate-700">Prever limite por Quilometragem (Km)</label>
                    </div>
                    {enableOdoEst && (
                      <div className="space-y-1.5 pl-6">
                        <label className="text-[10px] text-slate-400 font-bold uppercase block">Alerta dispara no Km:</label>
                        <input
                          type="number"
                          placeholder="Ex: 50000"
                          value={nextRecommendedOdometer}
                          onChange={(e) => setNextRecommendedOdometer(parseInt(e.target.value) || 0)}
                          className="w-48 h-8 px-2 bg-white border border-slate-200 rounded-lg text-xs"
                        />
                        <p className="text-[10px] text-slate-400">Sugestão: troca anterior ({odometer.toLocaleString('pt-BR')} km) + 10.000 km</p>
                      </div>
                    )}
                  </div>

                  {/* Dates alert setting */}
                  <div className="space-y-2 select-none">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="check-date-est"
                        checked={enableDateEst}
                        onChange={(e) => setEnableDateEst(e.target.checked)}
                        className="h-4 w-4 border-slate-300 text-indigo-650 rounded focus:ring-1 focus:ring-indigo-550"
                      />
                      <label htmlFor="check-date-est" className="text-xs font-semibold text-slate-700">Prever limite por Tempo (Data)</label>
                    </div>
                    {enableDateEst && (
                      <div className="space-y-1.5 pl-6">
                        <label className="text-[10px] text-slate-400 font-bold uppercase block">Próxima data recomendada:</label>
                        <input
                          type="date"
                          value={nextRecommendedDate}
                          onChange={(e) => setNextRecommendedDate(e.target.value)}
                          className="w-48 h-8 px-2 bg-white border border-slate-200 rounded-lg text-xs"
                        />
                        <p className="text-[10px] text-slate-400">Sugestão: 6 meses a partir da troca.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="h-10 px-4 border border-slate-250 text-slate-700 font-medium text-xs rounded-xl hover:bg-slate-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="h-10 px-5 bg-indigo-650 hover:bg-slate-900 text-white font-semibold text-xs rounded-xl transition-all shadow-sm"
              >
                Salvar Manutenção
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Main List & Audits */}
      <div className="bg-white rounded-2xl border border-slate-150 p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-3">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
            <Wrench size={16} className="text-indigo-600" />
            Histórico Consolidado de Manutenções
          </h3>
          
          {/* Quick Select Filter by Vehicle */}
          <div className="flex items-center gap-2">
            <label className="text-[11px] font-bold text-slate-500 uppercase">Filtrar Automóvel:</label>
            <select
              value={filterVehicleId}
              onChange={(e) => setFilterVehicleId(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg py-1 px-2.5 focus:outline-none"
            >
              <option value="all">Todas Manutenções</option>
              {vehicles.map(v => (
                <option key={v.id} value={v.id}>{v.plate} - {v.brand} {v.model}</option>
              ))}
            </select>
          </div>
        </div>

        {filteredMaintenances.length === 0 ? (
          <div className="p-12 text-center text-slate-400 border border-dashed border-slate-150 rounded-xl space-y-1">
            <Wrench className="mx-auto text-slate-350" size={32} />
            <p className="text-sm font-semibold text-slate-500">Nenhuma manutenção encontrada para este veículo.</p>
            <p className="text-xs text-slate-400">Clique em "Lançar Manutenção" para cadastrar seu primeiro recibo.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left text-slate-650">
              <thead className="bg-slate-50 text-slate-400 font-extrabold uppercase tracking-widest text-[9px] border-b border-slate-150">
                <tr>
                  <th className="py-3 px-4">Veículo / Placa</th>
                  <th className="py-3 px-4">Descrição do Serviço</th>
                  <th className="py-3 px-4">Data do Serviço</th>
                  <th className="py-3 px-4 text-right">Odomêtro</th>
                  <th className="py-3 px-4 text-right">Valor do Serviço</th>
                  <th className="py-3 px-4">Próxima Troca Previsão</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                {filteredMaintenances.map(m => {
                  const vehicle = vehicles.find(v => v.id === m.vehicleId);
                  const systemToday = new Date('2026-05-26');
                  
                  // Check limits
                  let isOdoExceeded = false;
                  let isDateExceeded = false;
                  
                  if (m.status === 'concluida' && vehicle) {
                    if (m.nextRecommendedOdometer) {
                      isOdoExceeded = vehicle.currentOdometer >= m.nextRecommendedOdometer;
                    }
                    if (m.nextRecommendedDate) {
                      isDateExceeded = new Date(m.nextRecommendedDate) < systemToday;
                    }
                  }

                  return (
                    <tr key={m.id} className="hover:bg-slate-50/40">
                      <td className="py-3.5 px-4">
                        {vehicle ? (
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[10px] bg-slate-100 border text-slate-900 px-1.5 py-0.5 rounded font-black tracking-wide">
                              {vehicle.plate}
                            </span>
                            <span className="font-semibold text-slate-800">{vehicle.brand} {vehicle.model}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-900 max-w-xs truncate" title={m.description}>
                        {m.description}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 text-slate-600 font-normal">
                          <Calendar size={13} className="text-slate-400" />
                          {new Date(m.date).toLocaleDateString('pt-BR')}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-slate-600 font-normal">
                        {m.odometer.toLocaleString('pt-BR')} km
                      </td>
                      <td className="py-3.5 px-4 text-right font-semibold text-slate-900">
                        R$ {m.cost.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-3.5 px-4 space-y-2">
                        {m.status === 'concluida' && (m.nextRecommendedOdometer || m.nextRecommendedDate) ? (
                          <div className="text-[10px] space-y-2 font-normal max-w-[155px]">
                            {/* Odometer limit with wear progress bar */}
                            {m.nextRecommendedOdometer && vehicle && (() => {
                              const totalExpectedRun = m.nextRecommendedOdometer - m.odometer;
                              const currentRun = vehicle.currentOdometer - m.odometer;
                              const ratio = totalExpectedRun > 0 ? Math.min(100, Math.max(0, (currentRun / totalExpectedRun) * 100)) : 100;
                              const isCrit = ratio >= 90;

                              return (
                                <div className="space-y-1">
                                  <div className="flex items-center justify-between font-semibold">
                                    <span className={isCrit ? 'text-red-700 animate-pulse font-extrabold' : 'text-slate-700'}>
                                      Km: {m.nextRecommendedOdometer.toLocaleString('pt-BR')}
                                    </span>
                                    <span className="font-mono text-[9px]">{ratio.toFixed(0)}% de desgaste</span>
                                  </div>
                                  <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden flex border border-slate-100">
                                    <div 
                                      style={{ width: `${ratio}%` }} 
                                      className={`h-full rounded-full transition-all ${isCrit ? 'bg-red-500 animate-pulse' : 'bg-indigo-500'}`}
                                    />
                                  </div>
                                </div>
                              );
                            })()}

                            {/* Date limit */}
                            {m.nextRecommendedDate && (
                              <p className={`flex items-center gap-1 leading-none ${isDateExceeded ? 'text-red-700 font-bold' : 'text-slate-500 font-mono text-[9px]'}`}>
                                Limite Venc: {new Date(m.nextRecommendedDate).toLocaleDateString('pt-BR')}
                                {isDateExceeded && <AlertTriangle size={11} className="text-red-500 shrink-0" />}
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 font-normal italic text-[10px]">Não programada</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded border ${
                          m.status === 'concluida'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-100'
                            : 'bg-indigo-50 text-indigo-805 border-indigo-100'
                        }`}>
                          {m.status === 'concluida' ? 'Concluída' : 'Agendada'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {m.status === 'agendada' && (
                            <button
                              onClick={() => {
                                if (confirm(`Confirmar que a manutenção "${m.description}" foi finalizada com sucesso?`)) {
                                  onEditMaintenance(m.id, { status: 'concluida' });
                                }
                              }}
                              className="px-2 py-1 bg-indigo-50 text-indigo-755 hover:bg-emerald-500 hover:text-white rounded text-[10px] font-semibold border border-transparent hover:border-emerald-305 transition-all text-center cursor-pointer"
                              title="Marcar como Concluída"
                            >
                              Concluir
                            </button>
                          )}
                          <button
                            onClick={() => {
                              if (confirm('Deseja realmente apagar este registro de manutenção?')) {
                                onDeleteMaintenance(m.id);
                              }
                            }}
                            className="text-slate-400 hover:text-red-500 px-2 py-1 bg-slate-50 border hover:bg-white border-transparent hover:border-slate-200 rounded transition-colors cursor-pointer"
                          >
                            Excluir
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
