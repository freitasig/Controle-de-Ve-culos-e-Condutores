/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Vehicle, Driver, TripLog } from '../types';
import { 
  History, 
  Car, 
  Users, 
  Clock, 
  MapPin, 
  Plus, 
  CheckSquare, 
  Search, 
  Filter, 
  Calendar, 
  Navigation,
  Gauge,
  X,
  AlertTriangle
} from 'lucide-react';

interface TripsTabProps {
  trips: TripLog[];
  vehicles: Vehicle[];
  drivers: Driver[];
  onStartTrip: (trip: Omit<TripLog, 'id' | 'endDateTime' | 'endOdometer'>) => void;
  onEndTrip: (id: string, endOdometer: number, endDateTime?: string) => void;
  onDeleteTrip: (id: string) => void;
}

export const TripsTab: React.FC<TripsTabProps> = ({
  trips,
  vehicles,
  drivers,
  onStartTrip,
  onEndTrip,
  onDeleteTrip,
}) => {
  const [showAddForm, setShowAddForm] = useState(false);

  // Form State
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [selectedDriverId, setSelectedDriverId] = useState('');
  const [startDateTime, setStartDateTime] = useState('2026-05-26T08:00');
  const [startOdometer, setStartOdometer] = useState(0);
  const [purpose, setPurpose] = useState('');

  // End Trip Inline Form state
  const [closingTripId, setClosingTripId] = useState<string | null>(null);
  const [endOdometer, setEndOdometer] = useState('');
  const [endDateTime, setEndDateTime] = useState('2026-05-26T18:00');

  // Filters State
  const [filterVehicleId, setFilterVehicleId] = useState('all');
  const [filterDriverId, setFilterDriverId] = useState('all');

  // Find vehicles currently NOT in use
  const activeTrips = trips.filter(t => t.endDateTime === null);
  const busyVehicleIds = activeTrips.map(t => t.vehicleId);
  const availableVehicles = vehicles.filter(v => !busyVehicleIds.includes(v.id));

  // Determine current system date
  const systemNow = '2026-05-26T20:24';

  const handleVehicleChange = (vId: string) => {
    setSelectedVehicleId(vId);
    const vehicle = vehicles.find(v => v.id === vId);
    if (vehicle) {
      setStartOdometer(vehicle.currentOdometer);
    }
  };

  const handleOpenAdd = () => {
    // Pick first available vehicle
    if (availableVehicles.length > 0) {
      handleVehicleChange(availableVehicles[0].id);
    } else {
      setSelectedVehicleId('');
      setStartOdometer(0);
    }

    // Pick first eligible driver
    const activeDrivers = drivers.filter(d => d.active);
    if (activeDrivers.length > 0) {
      setSelectedDriverId(activeDrivers[0].id);
    } else {
      setSelectedDriverId('');
    }

    setStartDateTime(systemNow);
    setPurpose('');
    setShowAddForm(true);
  };

  const handleSubmitStart = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVehicleId || !selectedDriverId) {
      alert('Selecione um veículo e um motorista ativos.');
      return;
    }

    const driver = drivers.find(d => d.id === selectedDriverId);
    
    // Check if the selected driver already has an active trip (Overlap check)
    const activeDriverTrip = trips.find(t => t.driverId === selectedDriverId && t.endDateTime === null);
    if (activeDriverTrip) {
      const activeVehicle = vehicles.find(v => v.id === activeDriverTrip.vehicleId);
      alert(`CONFLITO DE ESCALA INTEGRAL: O(A) motorista ${driver?.name || 'selecionado'} já possui uma viagem ATIVA em andamento com o veículo ${activeVehicle?.brand} ${activeVehicle?.model} (${activeVehicle?.plate}). Finalize a viagem anterior no Diário de Bordo antes de registrar uma nova saída.`);
      return;
    }

    // Safety check: Is the vehicle already in use?
    const activeVehicleTrip = trips.find(t => t.vehicleId === selectedVehicleId && t.endDateTime === null);
    if (activeVehicleTrip) {
      alert('CONFLITO DE VEÍCULO: Este veículo já possui uma viagem ativa cadastrada em andamento. Finalize a rota anterior primeiro.');
      return;
    }

    if (driver) {
      const isExpired = new Date(driver.cnhExpiry) < new Date('2026-05-26');
      if (isExpired) {
        const accept = confirm(`BLOQUEIO DE COMPLIANCE / CNH VENCIDA: A CNH de ${driver.name} está vencida desde ${new Date(driver.cnhExpiry).toLocaleDateString('pt-BR')}. Deseja prosseguir mesmo assim? A empresa é legalmente responsável por condutores sem habilitação regular.`);
        if (!accept) return;
      }
    }

    onStartTrip({
      vehicleId: selectedVehicleId,
      driverId: selectedDriverId,
      startDateTime,
      startOdometer,
      purpose,
    });

    setShowAddForm(false);
  };

  const handleCloseTripAction = (tripId: string, currentStartOdometer: number) => {
    const odo = parseInt(endOdometer);
    if (isNaN(odo) || odo <= currentStartOdometer) {
      alert(`Valor de odômetro inválido. Deve ser maior que o km de saída (${currentStartOdometer.toLocaleString('pt-BR')} km).`);
      return;
    }

    onEndTrip(tripId, odo, endDateTime || undefined);
    setClosingTripId(null);
    setEndOdometer('');
  };

  const openCloseWizard = (trip: TripLog) => {
    setClosingTripId(trip.id);
    const vehicle = vehicles.find(v => v.id === trip.vehicleId);
    // Suggest current mileage as stop point
    setEndOdometer(vehicle ? String(vehicle.currentOdometer + 100) : '');
    setEndDateTime(systemNow);
  };

  // Filter lists
  const openTripsList = trips.filter(t => t.endDateTime === null);
  const closedTripsList = trips.filter(t => t.endDateTime !== null).filter(t => {
    const vMatch = filterVehicleId === 'all' || t.vehicleId === filterVehicleId;
    const dMatch = filterDriverId === 'all' || t.driverId === filterDriverId;
    return vMatch && dMatch;
  });

  return (
    <div className="space-y-6">
      {/* Upper bar controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Diário de Bordo & Utilização</h1>
          <p className="text-xs text-slate-500">Registre saídas, acompanhe carros em rota e consulte o histórico de chaves</p>
        </div>
        {!showAddForm && (
          <button
            onClick={handleOpenAdd}
            className="h-10 px-4 bg-indigo-650 hover:bg-slate-900 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition-all self-start sm:self-center cursor-pointer shadow-xs"
            id="btn-checkout"
          >
            <Plus size={16} />
            Liberar Saída (Check-out)
          </button>
        )}
      </div>

      {/* Start Trip Check-out form */}
      {showAddForm && (
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700">
              Registrar Saída de Veículo (Entrega de Chave)
            </h3>
            <button 
              onClick={() => setShowAddForm(false)}
              className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleSubmitStart} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Select vehicle */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-500 uppercase">Selecione o Veículo *</label>
                <select
                  required
                  value={selectedVehicleId}
                  onChange={(e) => handleVehicleChange(e.target.value)}
                  className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                >
                  {availableVehicles.length === 0 && (
                    <option value="">-- Nenhum veículo livre na garagem --</option>
                  )}
                  {availableVehicles.map(v => (
                    <option key={v.id} value={v.id}>
                      {v.plate} - {v.brand} {v.model} ({v.currentOdometer.toLocaleString('pt-BR')} km)
                    </option>
                  ))}
                </select>
                {availableVehicles.length === 0 && (
                  <p className="text-[10px] text-red-650 font-medium">Todos os veículos da empresa estão atualmente em rota!</p>
                )}
              </div>

              {/* Select driver */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-500 uppercase font-sans">Selecione o Motorista *</label>
                <select
                  required
                  value={selectedDriverId}
                  onChange={(e) => setSelectedDriverId(e.target.value)}
                  className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                >
                  <option value="">-- Selecione o condutor --</option>
                  {drivers.map(d => {
                    const isExpired = new Date(d.cnhExpiry) < new Date('2026-05-26');
                    return (
                      <option key={d.id} value={d.id} className={isExpired ? 'text-red-500' : ''}>
                        {d.name} {isExpired ? '(⚠️ CNH VENCIDA)' : `(Cat: ${d.cnhCategory})`}
                      </option>
                    )
                  })}
                </select>
              </div>

              {/* Odometer auto fetched */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-500 uppercase">Odômetro de Saída (Leitura)</label>
                <input
                  type="number"
                  required
                  value={startOdometer}
                  onChange={(e) => setStartOdometer(parseInt(e.target.value) || 0)}
                  className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Date & Time */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-500 uppercase">Data e Hora de Saída</label>
                <input
                  type="datetime-local"
                  required
                  value={startDateTime}
                  onChange={(e) => setStartDateTime(e.target.value)}
                  className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              {/* Travel Purpose */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-500 uppercase">Objetivo da Viagem / Destino</label>
                <input
                  type="text"
                  placeholder="Ex: Entrega de insumos, Visita a filiais, etc."
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="h-10 px-4 border border-slate-250 text-slate-700 font-medium text-xs rounded-xl hover:bg-slate-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={!selectedVehicleId || !selectedDriverId}
                className="h-10 px-5 bg-indigo-650 hover:bg-slate-900 text-white font-semibold text-xs rounded-xl transition-all shadow-sm disabled:opacity-50"
              >
                Liberar Chave & Iniciar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Grid of ACTIVE/OPEN checkouts */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5 pt-1">
          <Clock size={16} className="text-sky-500" />
          Veículos Ativos em Uso no Momento ({openTripsList.length})
        </h2>

        {openTripsList.length === 0 ? (
          <div className="bg-white p-8 rounded-2xl border border-slate-150 text-center text-slate-500 space-y-1">
            <CheckSquare className="mx-auto text-emerald-500" size={28} />
            <p className="text-sm font-semibold text-emerald-700">Pátio Cheio!</p>
            <p className="text-xs text-slate-400">Todos os automóveis da CNPJ estão estacionados e disponíveis.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {openTripsList.map(trip => {
              const vehicle = vehicles.find(v => v.id === trip.vehicleId);
              const driver = drivers.find(d => d.id === trip.driverId);
              const isClosing = closingTripId === trip.id;

              return (
                <div key={trip.id} className="bg-white rounded-2xl border border-slate-150 shadow-xs p-5 space-y-4 flex flex-col justify-between">
                  <div>
                    {/* Header vehicle/person */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="bg-slate-900 text-white font-mono text-[11px] px-2 py-0.5 rounded tracking-wide font-semibold border">
                          {vehicle?.plate}
                        </span>
                        <p className="text-sm font-semibold text-slate-800">
                          {vehicle?.brand} {vehicle?.model}
                        </p>
                      </div>
                      <span className="bg-sky-50 text-sky-700 font-bold border border-sky-100 text-[10px] px-2.5 py-0.5 rounded-full uppercase">
                        Em Trânsito
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs text-slate-500 mt-3 pt-3 border-t border-slate-50">
                      <p><span className="font-medium text-slate-700">Motorista:</span> {driver?.name}</p>
                      <p><span className="font-medium text-slate-700">CPF:</span> {driver?.cpf}</p>
                      <p><span className="font-medium text-slate-700">Saída às:</span> {new Date(trip.startDateTime).toLocaleString('pt-BR')}</p>
                      <p><span className="font-medium text-slate-700">Km Saída:</span> {trip.startOdometer.toLocaleString('pt-BR')} km</p>
                    </div>

                    {trip.purpose && (
                      <p className="text-[11px] text-slate-400 italic bg-slate-50 p-2 rounded mt-3">
                        Destino: {trip.purpose}
                      </p>
                    )}
                  </div>

                  {/* Closing section details */}
                  {isClosing ? (
                    <div className="p-4 bg-slate-50/70 border border-slate-200 rounded-xl space-y-3">
                      <p className="text-xs font-bold text-slate-700">Registrar Entrada (Devolução da Chave)</p>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[9px] uppercase font-bold text-slate-405 block">Odômetro Final *</label>
                          <input
                            type="number"
                            required
                            placeholder="Km final"
                            value={endOdometer}
                            onChange={(e) => setEndOdometer(e.target.value)}
                            className="w-full h-8 px-2 bg-white border border-slate-200 rounded-lg text-xs"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] uppercase font-bold text-slate-405 block">Data/Hora Retorno</label>
                          <input
                            type="datetime-local"
                            required
                            value={endDateTime}
                            onChange={(e) => setEndDateTime(e.target.value)}
                            className="w-full h-8 px-2 bg-white border border-slate-200 rounded-lg text-xs"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end gap-2 pt-1 text-xs">
                        <button
                          type="button"
                          onClick={() => setClosingTripId(null)}
                          className="px-3 py-1.5 border border-slate-200 rounded-lg hover:bg-white text-slate-650"
                        >
                          Cancelar
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCloseTripAction(trip.id, trip.startOdometer)}
                          className="px-3 py-1.5 bg-indigo-650 hover:bg-slate-900 text-white font-semibold rounded-lg"
                        >
                          Confirmar Entrada
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-between items-center gap-2 pt-2 border-t border-slate-50 text-xs">
                      <button
                        onClick={() => {
                          if (confirm('Deseja realmente cancelar este registro de uso ativo?')) {
                            onDeleteTrip(trip.id);
                          }
                        }}
                        className="text-slate-400 hover:text-red-500 font-medium cursor-pointer"
                      >
                        Excluir Registro
                      </button>
                      <button
                        onClick={() => openCloseWizard(trip)}
                        className="px-3 py-1.5 bg-indigo-650 hover:bg-indigo-750 text-white font-semibold rounded-lg shadow-xs cursor-pointer"
                      >
                        Encerrar Viagem (Check-in)
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* TRIP LOGS HISTORY SECTION */}
      <div className="bg-white p-6 rounded-2xl border border-slate-150 space-y-4">
        <div className="space-y-1 border-b border-slate-100 pb-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
            <History size={16} className="text-slate-500" />
            Histórico Geral de Utilizações (Devolvidos)
          </h2>
          <p className="text-xs text-slate-400">Auditoria detalhada por veículo e motorista para cruzamento de multas e quilometragens rodadas</p>
        </div>

        {/* Filter Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 bg-slate-50/50 p-4 rounded-xl border border-slate-100">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 shrink-0">
            <Filter size={14} /> Filtros de Auditoria:
          </div>
          <div className="flex flex-wrap gap-3 flex-1">
            <select
              value={filterVehicleId}
              onChange={(e) => setFilterVehicleId(e.target.value)}
              className="text-xs bg-white border border-slate-200 rounded-lg py-1.5 px-3 max-w-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="all">Filtro: Todos Veículos</option>
              {vehicles.map(v => (
                <option key={v.id} value={v.id}>{v.plate} ({v.brand} {v.model})</option>
              ))}
            </select>

            <select
              value={filterDriverId}
              onChange={(e) => setFilterDriverId(e.target.value)}
              className="text-xs bg-white border border-slate-200 rounded-lg py-1.5 px-3 max-w-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="all">Filtro: Todos Motoristas</option>
              {drivers.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Closed Trips Output */}
        {closedTripsList.length === 0 ? (
          <div className="p-12 text-center text-slate-400 border border-dashed border-slate-200 rounded-2xl">
            <History className="mx-auto" size={32} />
            <p className="text-sm font-medium text-slate-500 mt-2">Nenhum histórico arquivado corresponde aos filtros.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left text-slate-600">
              <thead className="bg-slate-50 text-slate-400 uppercase tracking-widest text-[9px] border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">Veículo / Placa</th>
                  <th className="py-3 px-4">Motorista Condutor</th>
                  <th className="py-3 px-4">Saída / Início</th>
                  <th className="py-3 px-4">Retorno / Fim</th>
                  <th className="py-3 px-4 text-center">Duração / Distância</th>
                  <th className="py-3 px-4">Motivo / Notas</th>
                  <th className="py-3 px-4 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 font-medium text-slate-800">
                {closedTripsList.map(trip => {
                  const vehicle = vehicles.find(v => v.id === trip.vehicleId);
                  const driver = drivers.find(d => d.id === trip.driverId);

                  const startDate = new Date(trip.startDateTime);
                  const endDate = trip.endDateTime ? new Date(trip.endDateTime) : null;
                  
                  const distance = (trip.endOdometer && trip.startOdometer)
                    ? trip.endOdometer - trip.startOdometer
                    : 0;

                  return (
                    <tr key={trip.id} className="hover:bg-slate-50/50">
                      <td className="py-3 px-4 font-normal">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-[10px] bg-slate-150 text-slate-800 font-semibold px-1 rounded">
                            {vehicle?.plate}
                          </span>
                          <span className="text-slate-800 font-medium">{vehicle?.brand} {vehicle?.model}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        {driver?.name || 'Deletado'}
                        <p className="text-[10px] text-slate-400 font-mono font-normal">CPF: {driver?.cpf}</p>
                      </td>
                      <td className="py-3 px-4 font-normal text-slate-550">
                        <div className="flex items-center gap-1 text-[11px]">
                          <Calendar size={12} className="text-slate-400" />
                          {startDate.toLocaleString('pt-BR')}
                        </div>
                        <p className="text-[10px] text-slate-400 pt-0.5">Km Saída: {trip.startOdometer.toLocaleString('pt-BR')}</p>
                      </td>
                      <td className="py-3 px-4 font-normal text-slate-550">
                        <div className="flex items-center gap-1 text-[11px]">
                          <Calendar size={12} className="text-slate-300" />
                          {endDate ? endDate.toLocaleString('pt-BR') : '-'}
                        </div>
                        <p className="text-[10px] text-slate-400 pt-0.5">Km Entrada: {trip.endOdometer?.toLocaleString('pt-BR') || '-'}</p>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="bg-indigo-50/70 border border-indigo-100 rounded text-indigo-700 font-semibold px-2 py-1 text-[10px] inline-block font-mono">
                          +{distance.toLocaleString('pt-BR')} km
                        </span>
                      </td>
                      <td className="py-3 px-4 max-w-xs truncate text-slate-500 font-normal italic" title={trip.purpose}>
                        {trip.purpose || '-'}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => {
                            if (confirm('Deseja realmente apagar este histórico da auditoria permanente?')) {
                              onDeleteTrip(trip.id);
                            }
                          }}
                          className="text-red-400 hover:text-red-600 px-2 py-1.5 bg-slate-50 rounded border hover:bg-white border-transparent hover:border-slate-200 transition-colors cursor-pointer"
                        >
                          Excluir
                        </button>
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
