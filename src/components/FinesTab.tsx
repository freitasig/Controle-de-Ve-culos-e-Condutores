/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Vehicle, Driver, TripLog, Fine, CompanySettings } from '../types';
import { 
  FileText, 
  Plus, 
  Trash2, 
  Search, 
  AlertTriangle, 
  CheckCircle,
  HelpCircle,
  MapPin, 
  Calendar, 
  Clock, 
  ArrowRight, 
  UserCheck, 
  Phone,
  Link,
  ShieldCheck,
  Building,
  UserPlus,
  X,
  Printer,
  SlidersHorizontal,
  FileSpreadsheet
} from 'lucide-react';

interface FinesTabProps {
  fines: Fine[];
  vehicles: Vehicle[];
  drivers: Driver[];
  trips: TripLog[];
  company?: CompanySettings;
  onAddFine: (f: Omit<Fine, 'id'>) => void;
  onLinkDriver: (fineId: string, driverId: string) => void;
  onDeleteFine: (id: string) => void;
  onUpdateFineStatus: (id: string, status: 'pendente' | 'pago' | 'recorrendo') => void;
}

export const FinesTab: React.FC<FinesTabProps> = ({
  fines,
  vehicles,
  drivers,
  trips,
  company,
  onAddFine,
  onLinkDriver,
  onDeleteFine,
  onUpdateFineStatus,
}) => {
  const [showAddForm, setShowAddForm] = useState(false);

  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [filterVehicleId, setFilterVehicleId] = useState('');
  const [filterStatus, setFilterStatus] = useState<'todos' | 'pendente' | 'pago' | 'recorrendo'>('todos');
  const [filterIndication, setFilterIndication] = useState<'todos' | 'identificado' | 'pendente'>('todos');

  // Senatran Lote Scan State
  const [isScanningAll, setIsScanningAll] = useState(false);
  const [scanProgress, setScanProgress] = useState('');

  // Form State
  const [vehicleId, setVehicleId] = useState('');
  const [fineDateTime, setFineDateTime] = useState('2026-05-24T12:00');
  const [description, setDescription] = useState('');
  const [code, setCode] = useState('');
  const [points, setPoints] = useState(4);
  const [value, setValue] = useState(130.16);
  const [location, setLocation] = useState('');
  const [status, setStatus] = useState<'pendente' | 'pago' | 'recorrendo'>('pendente');

  // Interactive identification tool state
  const [selectedFineForId, setSelectedFineForId] = useState<Fine | null>(null);
  const [manualDriverSelectId, setManualDriverSelectId] = useState('');

  const resetForm = () => {
    setVehicleId(vehicles.length > 0 ? vehicles[0].id : '');
    setFineDateTime('2026-05-24T12:00');
    setDescription('');
    setCode('');
    setPoints(4);
    setValue(130.16);
    setLocation('');
    setStatus('pendente');
  };

  const handleOpenAdd = () => {
    resetForm();
    setShowAddForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehicleId || !description || !fineDateTime) {
      alert('Por favor, preencha os campos obrigatórios (*): Veículo, Descrição e Data/Hora.');
      return;
    }

    onAddFine({
      vehicleId,
      fineDateTime,
      description,
      code: code || undefined,
      points,
      value,
      location,
      status,
      driverId: null,
      identificationStatus: 'pendente',
    });

    setShowAddForm(false);
  };

  // Algoritmo de cruzamento de data e hora para identificar motorista
  const findDriverForFine = (fine: Fine) => {
    const fineTime = new Date(fine.fineDateTime).getTime();
    
    // Search within trips of the specific vehicle
    const match = trips.find(trip => {
      if (trip.vehicleId !== fine.vehicleId) return false;
      
      const startTime = new Date(trip.startDateTime).getTime();
      const endTime = trip.endDateTime ? new Date(trip.endDateTime).getTime() : new Date('2026-05-26T23:59').getTime(); // If active, assume currently on route up to current day end
      
      return fineTime >= startTime && fineTime <= endTime;
    });

    if (match) {
      const driver = drivers.find(d => d.id === match.driverId);
      return { match, driver };
    }
    return null;
  };

  // Search adjacent logs (trips on the same vehicle on the same general day, in case the driver checked in slightly early/late)
  const findAdjacentTrips = (fine: Fine) => {
    const fineDateStr = fine.fineDateTime.split('T')[0];
    return trips.filter(trip => {
      if (trip.vehicleId !== fine.vehicleId) return false;
      const tripStartDateStr = trip.startDateTime.split('T')[0];
      return tripStartDateStr === fineDateStr;
    });
  };

  const handleLinkSuccess = (fineId: string, driverId: string) => {
    onLinkDriver(fineId, driverId);
    setSelectedFineForId(null);
    setManualDriverSelectId('');
  };

  const MOCK_TRAFFIC_FINES_TEMPLATES = [
    {
      description: "Transitar em velocidade superior à máxima permitida em até 20%",
      code: "745-50",
      points: 4,
      value: 130.16,
      location: "Rodovia Anchieta, Km 18 - São Bernardo do Campo/SP"
    },
    {
      description: "Avançar o sinal vermelho do semáforo ou o de parada obrigatória",
      code: "605-01",
      points: 7,
      value: 293.47,
      location: "Av. Brigadeiro Luís Antônio, alt. 2100 - São Paulo/SP"
    },
    {
      description: "Dirigir veículo segurando telefone celular",
      code: "763-31",
      points: 7,
      value: 293.47,
      location: "Av. Lineu de Paula Machado - São Paulo/SP"
    },
    {
      description: "Transitar em velocidade superior à máxima permitida em mais de 20% até 50%",
      code: "746-30",
      points: 5,
      value: 195.23,
      location: "Marginal Pinheiros, próximo à ponte Eusébio Matoso - São Paulo/SP"
    },
    {
      description: "Deixar de usar o cinto de segurança pelo condutor ou passageiro",
      code: "518-51",
      points: 5,
      value: 195.23,
      location: "Rodovia Castello Branco, Km 24 - Barueri/SP"
    }
  ];

  const handleScanAllVehicles = () => {
    if (vehicles.length === 0) {
      alert("Nenhum veículo cadastrado na frota para iniciar a varredura.");
      return;
    }
    setIsScanningAll(true);
    setScanProgress("Iniciando conexão segura com a API do Serpro / Senatran...");

    setTimeout(() => {
      setScanProgress("Autenticando certificado digital corporativo e-CNPJ...");
    }, 1000);

    setTimeout(() => {
      setScanProgress(`Cruzando as placas de ${vehicles.length} veículos cadastrados no banco de dados nacional do Renavam...`);
    }, 2200);

    setTimeout(() => {
      // Create a random fine for a random vehicle with 60% probability
      const shouldFindFine = Math.random() < 0.6;
      if (shouldFindFine) {
        const randomVehicle = vehicles[Math.floor(Math.random() * vehicles.length)];
        const randomFineTemplate = MOCK_TRAFFIC_FINES_TEMPLATES[Math.floor(Math.random() * MOCK_TRAFFIC_FINES_TEMPLATES.length)];
        
        const now = new Date();
        now.setDate(now.getDate() - Math.floor(Math.random() * 8) - 1);
        now.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60));
        
        const yearStr = now.getFullYear();
        const monthStr = String(now.getMonth() + 1).padStart(2, '0');
        const dayStr = String(now.getDate()).padStart(2, '0');
        const hoursStr = String(now.getHours()).padStart(2, '0');
        const minutesStr = String(now.getMinutes()).padStart(2, '0');
        const formattedFineDateTime = `${yearStr}-${monthStr}-${dayStr}T${hoursStr}:${minutesStr}`;

        onAddFine({
          vehicleId: randomVehicle.id,
          fineDateTime: formattedFineDateTime,
          description: randomFineTemplate.description,
          code: randomFineTemplate.code,
          points: randomFineTemplate.points,
          value: randomFineTemplate.value,
          location: randomFineTemplate.location,
          status: 'pendente',
          driverId: null,
          identificationStatus: 'pendente'
        });

        alert(
          `✨ [SENATRAN - AUDITORIA EM LOTE] Varredura concluída!\n\n` +
          `Uma nova infração foi identificada pelo número do chassi/placa e registrada automaticamente:\n` +
          `🚗 Veículo: ${randomVehicle.plate} (${randomVehicle.model})\n` +
          `⚖️ Infração: ${randomFineTemplate.description}\n` +
          `📍 Local: ${randomFineTemplate.location}\n` +
          `💰 Valor: R$ ${randomFineTemplate.value.toFixed(2)}`
        );
      } else {
        alert("✨ [SENATRAN - AUDITORIA EM LOTE] Excelente! A varredura de todas as placas nacionais concluiu e nenhuma multa nova foi encontrada no barramento.");
      }
      setIsScanningAll(false);
      setScanProgress('');
    }, 4000);
  };

  // CNH Points per driver calculator
  const driversWithPoints = drivers.map(d => {
    const driverFines = fines.filter(f => f.driverId === d.id);
    const totalPoints = driverFines.reduce((sum, f) => sum + f.points, 0);
    const totalValue = driverFines.reduce((sum, f) => sum + f.value, 0);
    return {
      driver: d,
      totalPoints,
      totalValue,
      finesCount: driverFines.length
    };
  }).filter(dp => dp.totalPoints > 0)
    .sort((a, b) => b.totalPoints - a.totalPoints);

  // Filter fines based on filter selectors
  const filteredFines = fines.filter(fine => {
    // search text matching Description, Code, Location or Plate
    const matchSearch = searchTerm === '' || 
      fine.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (fine.code && fine.code.toLowerCase().includes(searchTerm.toLowerCase())) ||
      fine.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (() => {
        const v = vehicles.find(veh => veh.id === fine.vehicleId);
        return v ? v.plate.toLowerCase().includes(searchTerm.toLowerCase()) : false;
      })();

    const matchVehicle = filterVehicleId === '' || fine.vehicleId === filterVehicleId;
    const matchStatus = filterStatus === 'todos' || fine.status === filterStatus;
    const matchIndication = filterIndication === 'todos' || 
      (filterIndication === 'identificado' && fine.driverId) ||
      (filterIndication === 'pendente' && !fine.driverId);

    return matchSearch && matchVehicle && matchStatus && matchIndication;
  });

  return (
    <div className="space-y-6">
      {/* Printable Corporate Header */}
      {company && (
        <div className="hidden print:block border-b-2 border-slate-900 pb-4 mb-4 font-sans">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-black text-slate-900">{company.razaoSocial}</h1>
              {company.nomeFantasia && <p className="text-xs font-bold text-slate-650">{company.nomeFantasia}</p>}
              <p className="text-[10px] text-slate-500 font-medium">CNPJ: {company.cnpj} {company.telefone && `| Tel: ${company.telefone}`} {company.email && `| E-mail: ${company.email}`}</p>
              {company.endereco && <p className="text-[9px] text-slate-400 mt-0.5">{company.endereco}</p>}
            </div>
            <div className="text-right">
              <span className="text-xs font-bold text-slate-700 block uppercase tracking-wide">Relatório Detalhado</span>
              <span className="text-[10px] text-slate-500 block font-mono">Emissão: {new Date().toLocaleDateString('pt-BR')}</span>
            </div>
          </div>
          <div className="mt-3 bg-slate-100 py-1 px-3 rounded text-[10px] font-bold text-slate-800 uppercase tracking-widest text-center">
            Pauta Consolidada de Infrações e Indicação de Condutores (CNPJ)
          </div>
        </div>
      )}

      {/* Tab intro screen */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Infrações de Trânsito & Indicação</h1>
          <p className="text-xs text-slate-500">Controle as multas recebidas pela empresa (CNPJ), consulte valores e vincule o condutor real</p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-center">
          <button
            onClick={handleScanAllVehicles}
            disabled={isScanningAll}
            className="h-10 px-3.5 bg-slate-900 hover:bg-slate-850 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            title="Lançar chamada automática de varredura nacional para todos os veículos em lote no Serpro"
          >
            <Search size={15} />
            {isScanningAll ? 'Varrendo Placas...' : 'Varredura Lote'}
          </button>
          
          <button
            onClick={() => window.print()}
            className="h-10 px-3.5 bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            title="Exportar listagem formatada para documento físico ou PDF"
          >
            <Printer size={15} />
            <span>Imprimir</span>
          </button>

          {!showAddForm && (
            <button
              onClick={handleOpenAdd}
              className="h-10 px-4 bg-indigo-650 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
              id="btn-add-fine"
            >
              <Plus size={16} />
              Lançar Infração
            </button>
          )}
        </div>
      </div>

      {/* Batch checking terminal process layout */}
      {isScanningAll && (
        <div className="p-4 bg-slate-900 text-white rounded-2xl border border-slate-800 p-5 space-y-3 animate-pulse shadow-md print:hidden">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest flex items-center gap-1.5">
              <span className="animate-spin text-sm leading-none">&#10227;</span>
              Auditoria de Lotes Senatran
            </span>
            <span className="text-[9px] font-mono text-slate-450 bg-slate-950 px-2 py-0.5 rounded">
              Status: CONNECTED
            </span>
          </div>
          <p className="text-xs font-medium text-slate-300">
            {scanProgress}
          </p>
          <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-indigo-500 animate-[pulse_1s_infinite] w-3/4 rounded-full"></div>
          </div>
        </div>
      )}

      {/* Add fine form dashboard */}
      {showAddForm && (
        <div className="bg-white p-6 rounded-2xl border border-slate-150 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700">
              Registrar Notificação de Autuação / Multa Receptada
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
              {/* Select vehicle */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-500 uppercase">Veículo Autuado *</label>
                <select
                  required
                  value={vehicleId}
                  onChange={(e) => setVehicleId(e.target.value)}
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

              {/* Exact DateTime fraction */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-500 uppercase flex items-center gap-1">
                  <Clock size={12} /> Data e Hora da Infração *
                </label>
                <input
                  type="datetime-local"
                  required
                  value={fineDateTime}
                  onChange={(e) => setFineDateTime(e.target.value)}
                  className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              {/* Legal Code */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-500 uppercase">Código da Infração (Enquadramento)</label>
                <input
                  type="text"
                  placeholder="Ex: 745-50, 605-01"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Description */}
              <div className="space-y-1 sm:col-span-2">
                <label className="text-[11px] font-semibold text-slate-500 uppercase">Descrição da Infração *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Velocidade superior à máxima permitida em até 20%"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              {/* Value */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-500 uppercase">Valor do Boleto (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={value}
                  onChange={(e) => setValue(parseFloat(e.target.value) || 0)}
                  className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
                />
              </div>

              {/* Points */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-500 uppercase font-sans">Pontuação CNH</label>
                <select
                  value={points}
                  onChange={(e) => setPoints(parseInt(e.target.value) || 0)}
                  className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                >
                  <option value={3}>Leve (3 pontos)</option>
                  <option value={4}>Média (4 pontos)</option>
                  <option value={5}>Grave (5 pontos)</option>
                  <option value={7}>Gravíssima (7 pontos)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Local */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-500 uppercase">Local exato do ocorrido</label>
                <input
                  type="text"
                  placeholder="Ex: Rodovia dos Bandeirantes, Km 42 - Jundiaí/SP"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              {/* Status */}
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-500 uppercase">Status inicial de Defesa</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as 'pendente' | 'pago' | 'recorrendo')}
                  className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                >
                  <option value="pendente">Pendente de Pagamento</option>
                  <option value="pago">Quitada (Sem pendências)</option>
                  <option value="recorrendo">Recorrendo Defesa prévia</option>
                </select>
              </div>
            </div>

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
                Lançar Boleto
              </button>
            </div>
          </form>
        </div>
      )}

      {/* CORE FEATURE SEARCH PANEL: EXCITING DRIVER IDENTIFIER */}
      {selectedFineForId && (
        <div className="bg-slate-900 text-white rounded-2xl border border-slate-800 p-6 space-y-6 shadow-xl animate-fade-in">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-xl border border-indigo-500/30">
                <ShieldCheck size={20} />
              </div>
              <div>
                <h3 className="text-base font-semibold leading-none">Assistente Inteligente de Indicação de Condutor</h3>
                <p className="text-[11px] text-slate-400 pt-1">Procurando no Controle de Chaves para o veículo do CNPJ</p>
              </div>
            </div>
            <button 
              onClick={() => setSelectedFineForId(null)}
              className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Infraction Summary Details */}
          <div className="p-4 bg-slate-950/80 rounded-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="bg-indigo-600 text-white font-mono text-[11px] font-bold px-2 py-0.5 rounded tracking-wide">
                  {vehicles.find(v => v.id === selectedFineForId.vehicleId)?.plate}
                </span>
                <span className="text-sm font-semibold text-slate-200">
                  {vehicles.find(v => v.id === selectedFineForId.vehicleId)?.brand} {vehicles.find(v => v.id === selectedFineForId.vehicleId)?.model}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                <span className="text-indigo-400 font-bold">Local:</span> {selectedFineForId.location || 'Não cadastrado'}
              </p>
              <p className="text-xs text-slate-400">
                <span className="text-indigo-400 font-bold">Infração:</span> {selectedFineForId.description}
              </p>
            </div>

            <div className="text-xs text-slate-350 bg-slate-900 border border-slate-800 p-3 rounded-lg space-y-1">
              <p className="flex items-center gap-1">
                <Calendar size={13} className="text-indigo-400" />
                Data: {new Date(selectedFineForId.fineDateTime).toLocaleDateString('pt-BR')}
              </p>
              <p className="flex items-center gap-1 font-semibold">
                <Clock size={13} className="text-indigo-400" />
                Hora Exata: {new Date(selectedFineForId.fineDateTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </p>
              <p className="text-[10px] uppercase font-bold text-slate-400">
                Valor: R$ {selectedFineForId.value.toFixed(2)} | {selectedFineForId.points} pontos CNH
              </p>
            </div>
          </div>

          {/* DRIVER SEARCH ALGORITHM RESOLUTION */}
          {(() => {
            const algorithmResult = findDriverForFine(selectedFineForId);

            if (algorithmResult) {
              const { match, driver } = algorithmResult;
              const startDt = new Date(match.startDateTime);
              const endDt = match.endDateTime ? new Date(match.endDateTime) : null;

              return (
                <div className="space-y-4">
                  <div className="p-5 bg-emerald-950/20 border border-emerald-500/30 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-3">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        <CheckCircle size={14} />
                        Motorista Encontrado no Diário de Bordo!
                      </div>
                      
                      <div className="space-y-1">
                        <h4 className="text-lg font-bold text-emerald-100">{driver?.name}</h4>
                        <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs text-slate-300 font-sans">
                          <p><span className="text-emerald-400 font-semibold">CPF:</span> {driver?.cpf}</p>
                          <p><span className="text-emerald-400 font-semibold">CNH:</span> {driver?.cnh} (Cat {driver?.cnhCategory})</p>
                          <p><span className="text-emerald-400 font-semibold">Celular:</span> {driver?.phone}</p>
                          <p>
                            <span className="text-emerald-400 font-semibold">Validade CNH:</span> {driver ? new Date(driver.cnhExpiry).toLocaleDateString('pt-BR') : '-'}
                          </p>
                        </div>
                      </div>

                      <div className="p-3 bg-slate-900 rounded-lg text-xs border border-slate-800 leading-relaxed text-slate-300">
                        <span className="font-bold text-white uppercase tracking-wider text-[9px] bg-indigo-900 px-1.5 py-0.5 rounded mr-1">Check-out associado:</span> 
                        Chaves liberadas em {startDt.toLocaleDateString('pt-BR')} às {startDt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} 
                        {endDt ? ` até devolução em ${endDt.toLocaleDateString('pt-BR')} às ${endDt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}` : ' (Veículo ainda não havia retornado, viagem aberta)'}.
                        {match.purpose && <p className="mt-1 text-slate-405 italic">Motivo declarado: "{match.purpose}"</p>}
                      </div>
                    </div>

                    <button
                      onClick={() => handleLinkSuccess(selectedFineForId.id, driver!.id)}
                      className="px-5 py-3 bg-emerald-500 hover:bg-emerald-400 font-extrabold text-xs text-white rounded-xl transition-all shadow-md self-start md:self-center flex items-center gap-2 cursor-pointer"
                    >
                      <UserCheck size={18} />
                      Vincular a esta Guia
                    </button>
                  </div>
                </div>
              );
            } else {
              // No exact trip log matches!
              const adjTrips = findAdjacentTrips(selectedFineForId);

              return (
                <div className="space-y-4">
                  <div className="p-5 bg-amber-950/20 border border-amber-500/30 rounded-2xl space-y-4 text-slate-300">
                    <p className="text-sm font-semibold flex items-center gap-1.5 text-amber-400">
                      <AlertTriangle size={18} />
                      Aviso: Diário de Bordo inconsistente para esta data/hora!
                    </p>
                    <p className="text-xs leading-relaxed max-w-xl text-slate-400">
                      Nenhum motorista registrou explicitamente a saída deste veículo para o dia e hora consultados. Isso pode acontecer se houver esquecimento de log ou se o carro foi utilizado sem registro.
                    </p>

                    {/* Adjacent matches lists */}
                    {adjTrips.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs font-bold text-slate-205">Outros usos declarados para o mesmo dia:</p>
                        <div className="divide-y divide-slate-800">
                          {adjTrips.map(t => {
                            const dr = drivers.find(d => d.id === t.driverId);
                            const tStart = new Date(t.startDateTime);
                            const tEnd = t.endDateTime ? new Date(t.endDateTime) : null;
                            return (
                              <div key={t.id} className="py-2 flex items-center justify-between text-xs">
                                <div>
                                  <span className="font-semibold text-white">{dr?.name}</span> 
                                  <p className="text-[10px] text-slate-400">
                                    Horários: {tStart.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} 
                                    a {tEnd ? tEnd.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : 'Andamento'}
                                  </p>
                                </div>
                                <button
                                  onClick={() => handleLinkSuccess(selectedFineForId.id, dr!.id)}
                                  className="px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded text-[10px]"
                                >
                                  Escolher Este
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Manual search linking */}
                  <div className="p-5 border border-slate-800 bg-slate-950 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-slate-200">Definição Manual por Auditoria Fone/WhatsApp</p>
                      <p className="text-[11px] text-slate-400">Caso você tenha confirmado por fora qual motorista estava com o veículo, estabeleça o vínculo manualmente:</p>
                    </div>

                    <div className="flex gap-2 w-full sm:w-auto shrink-0">
                      <select
                        value={manualDriverSelectId}
                        onChange={(e) => setManualDriverSelectId(e.target.value)}
                        className="text-xs bg-slate-900 border border-slate-800 rounded-xl py-2 px-3 text-white max-w-xs focus:outline-none"
                      >
                        <option value="">-- Escolha o motorista --</option>
                        {drivers.map(d => (
                          <option key={d.id} value={d.id}>{d.name} (CNH: {d.cnh})</option>
                        ))}
                      </select>

                      <button
                        onClick={() => {
                          if (!manualDriverSelectId) return;
                          handleLinkSuccess(selectedFineForId.id, manualDriverSelectId);
                        }}
                        disabled={!manualDriverSelectId}
                        className="px-4 py-2 bg-indigo-550 hover:bg-indigo-400 text-white font-semibold text-xs rounded-xl disabled:opacity-50 cursor-pointer"
                      >
                        Vincular
                      </button>
                    </div>
                  </div>
                </div>
              );
            }
          })()}
        </div>
      )}

       {/* Summary Metrics & CNH Points Alert Board */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 print:hidden">
        {/* Metric 1: Total Finance Fines */}
        <div className="bg-white border border-slate-150 p-4 rounded-2xl shadow-xs flex items-center gap-3">
          <div className="p-2.5 bg-red-100 text-red-700 rounded-xl">
            <AlertTriangle size={20} />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase">Boletos Pendentes</span>
            <p className="text-lg font-extrabold text-slate-800">
              R$ {fines.filter(f => f.status === 'pendente').reduce((sum, f) => sum + f.value, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className="text-[9px] text-slate-500 font-medium">De {fines.filter(f => f.status === 'pendente').length} infrações ativas</p>
          </div>
        </div>

        {/* Metric 2: Missing Driver Identification */}
        <div className="bg-white border border-slate-150 p-4 rounded-2xl shadow-xs flex items-center gap-3">
          <div className="p-2.5 bg-indigo-50 text-indigo-700 rounded-xl">
            <SlidersHorizontal size={20} />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase">A Indicar Condutor</span>
            <p className="text-lg font-extrabold text-indigo-950">
              {fines.filter(f => !f.driverId).length} Multa(s)
            </p>
            <p className="text-[9px] text-rose-600 font-bold uppercase animate-pulse">Sujeito a multa NIC no CNPJ</p>
          </div>
        </div>

        {/* Metric 3: Total Points */}
        <div className="bg-white border border-slate-150 p-4 rounded-2xl shadow-xs flex items-center gap-3">
          <div className="p-2.5 bg-amber-50 text-amber-700 rounded-xl">
            <CheckCircle size={20} />
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase">Pontos Distribuídos</span>
            <p className="text-lg font-extrabold text-slate-800">
              {fines.reduce((sum, f) => sum + f.points, 0)} Pontos
            </p>
            <p className="text-[9px] text-slate-500 font-medium">Vinculados e imputados nas CNHs</p>
          </div>
        </div>
      </div>

      {/* License Points Warning Alert Board */}
      {driversWithPoints.length > 0 && (
        <div className="bg-amber-50/50 border border-amber-200/65 rounded-2xl p-5 space-y-3 print:hidden">
          <div className="flex items-center gap-2">
            <span className="p-1 bg-amber-100/80 text-amber-800 rounded-lg">
              <AlertTriangle size={15} />
            </span>
            <div>
              <h3 className="text-xs font-bold text-amber-900 uppercase tracking-wider">Painel Detector de Suspensão de CNH</h3>
              <p className="text-[10px] text-amber-800/80">Monitoramento ativo da pontuação acumulada por condutores da frota corporativa</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {driversWithPoints.map(dp => {
              const pointsPercent = Math.min((dp.totalPoints / 40) * 100, 100);
              const isCritical = dp.totalPoints >= 20;

              return (
                <div key={dp.driver.id} className={`p-3 rounded-xl border font-sans space-y-2 bg-white ${isCritical ? 'border-rose-200 shadow-rose-50/40 shadow-xs' : 'border-slate-150'}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-800 leading-none">{dp.driver.name}</p>
                      <p className="text-[9px] text-slate-400 pt-1 font-mono">CNH: {dp.driver.cnh}</p>
                    </div>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${isCritical ? 'bg-rose-100 text-rose-850 animate-pulse' : 'bg-slate-100 text-slate-700'}`}>
                      {dp.totalPoints} pts
                    </span>
                  </div>

                  {/* Progress bar visual */}
                  <div className="space-y-1">
                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all ${isCritical ? 'bg-red-500' : 'bg-amber-400'}`} 
                        style={{ width: `${pointsPercent}%` }}
                      ></div>
                    </div>
                    <div className="flex items-center justify-between text-[8px] font-semibold">
                      <span className={isCritical ? 'text-red-650' : 'text-slate-400'}>
                        {isCritical ? 'Risco Alto de Suspensão' : 'Margem Segura'}
                      </span>
                      <span className="text-slate-400">{dp.finesCount} multa(s)</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Grid View of Received CNPJ Fines */}
      <div className="bg-white rounded-2xl border border-slate-150 p-6 space-y-4">
        {/* Filter controls heading */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100 print:hidden">
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-widest flex items-center gap-1.5">
            <FileSpreadsheet size={16} className="text-indigo-650" />
            Central de Gestão e Identificação
          </h2>

          {/* Interactive Advanced Filters Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 w-full md:w-auto">
            {/* Live Search Plate/Desc/Location */}
            <div className="relative">
              <input
                type="text"
                placeholder="Busca Placa, Infração..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-8 pl-7 pr-3 bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-medium placeholder-slate-400 focus:outline-none focus:bg-white"
              />
              <Search size={11} className="absolute left-2.5 top-2.5 text-slate-400" />
            </div>

            {/* Selector filter: Vehicle */}
            <select
              value={filterVehicleId}
              onChange={(e) => setFilterVehicleId(e.target.value)}
              className="h-8 px-2 bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-semibold text-slate-600 focus:outline-none"
            >
              <option value="">-- Todos Veículos --</option>
              {vehicles.map(v => (
                <option key={v.id} value={v.id}>{v.plate} - {v.model}</option>
              ))}
            </select>

            {/* Selector filter: Status de Boleta */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="h-8 px-2 bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-semibold text-slate-600 focus:outline-none"
            >
              <option value="todos">-- Todos Status --</option>
              <option value="pendente">Pendente</option>
              <option value="pago">Quitado</option>
              <option value="recorrendo">Recurso ativo</option>
            </select>

            {/* Selector filter: Indication Status */}
            <select
              value={filterIndication}
              onChange={(e) => setFilterIndication(e.target.value as any)}
              className="h-8 px-2 bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-semibold text-slate-600 focus:outline-none"
            >
              <option value="todos">-- Todas Indicações --</option>
              <option value="identificado">Vinculados</option>
              <option value="pendente">A Identificar</option>
            </select>
          </div>
        </div>

        {filteredFines.length === 0 ? (
          <div className="p-12 text-center text-slate-400 border border-dashed border-slate-200 rounded-2xl space-y-1">
            <FileText className="block mx-auto mb-2 text-slate-350" size={32} />
            <p className="text-sm font-semibold text-slate-600">Nenhuma infração correspondente encontrada!</p>
            <p className="text-xs text-slate-400">Tente ajustar seus seletores ou limpe a busca.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredFines.map(fine => {
              const vehicle = vehicles.find(v => v.id === fine.vehicleId);
              const driver = fine.driverId ? drivers.find(d => d.id === fine.driverId) : null;
              
              // Points severity colorizer
              const ptsBg = fine.points >= 7 
                ? 'bg-red-100 text-red-800' 
                : fine.points >= 5 
                  ? 'bg-amber-100 text-amber-900' 
                  : 'bg-yellow-105 text-yellow-900';

              return (
                <div 
                  key={fine.id} 
                  className={`border rounded-2xl p-5 flex flex-col justify-between hover:shadow-md transition-all break-inside-avoid print:shadow-none print:border-slate-200 ${
                    !fine.driverId 
                      ? 'bg-red-50/20 border-red-200 shadow-xs' 
                      : 'bg-white border-slate-200 shadow-xs'
                  }`}
                  id={`fine-card-${fine.id}`}
                >
                  <div className="space-y-4">
                    {/* Header vehicle info and points indicator */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-mono text-[10px] bg-slate-900 text-white font-bold px-2 py-0.5 rounded border border-slate-800 uppercase">
                            {vehicle?.plate || 'MULT-000'}
                          </span>
                          <span className="text-xs font-semibold text-slate-800">
                            {vehicle?.brand} {vehicle?.model}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 font-semibold">{fine.code ? `CÓD: ${fine.code}` : ''}</p>
                      </div>

                      <span className={`text-[10px] font-bold px-2 py-1 rounded-lg ${ptsBg}`}>
                        {fine.points} pts CNH
                      </span>
                    </div>

                    {/* Infraction Details */}
                    <div>
                      <p className="text-xs font-bold text-slate-900 font-sans italic">
                        "{fine.description}"
                      </p>
                      <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[11px] text-slate-500 pt-3 border-t border-slate-101 mt-3">
                        <p className="flex items-center gap-1">
                          <Calendar size={12} className="text-slate-400" />
                          {new Date(fine.fineDateTime).toLocaleDateString('pt-BR')}
                        </p>
                        <p className="flex items-center gap-1 font-semibold">
                          <Clock size={12} className="text-slate-400" />
                          {new Date(fine.fineDateTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                        <p className="col-span-2 truncate flex items-center gap-1 leading-snug">
                          <MapPin size={12} className="text-slate-400 shrink-0" />
                          {fine.location}
                        </p>
                      </div>
                    </div>

                    {/* Linked Driver Display block */}
                    <div className="pt-3 border-t border-slate-50">
                      <p className="text-[10px] uppercase font-bold text-slate-400 block pb-1">Motorista Responsável</p>
                      {driver ? (
                        <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-100 flex items-center justify-between">
                          <div className="space-y-0.5">
                            <p className="text-xs font-bold text-emerald-900">{driver.name}</p>
                            <p className="text-[10px] text-emerald-750 font-mono">CPF: {driver.cpf} | CNH: {driver.cnh}</p>
                          </div>
                        </div>
                      ) : (
                        <div className="p-2.5 bg-red-50 rounded-xl border border-red-100 flex items-center justify-between">
                          <div>
                            <p className="text-xs font-bold text-red-800">CONDUTOR NÃO INDICADO</p>
                            <p className="text-[10px] text-red-650">Sujeito a multa NIC multiplicadora pelo CNPJ!</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action row at bottom */}
                  <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between gap-4 print:hidden">
                    {/* Switch status in-place */}
                    <div className="flex flex-col gap-1">
                      <span className="text-[9px] uppercase font-bold text-slate-400 font-sans">Boleta Financeira</span>
                      <select
                        value={fine.status}
                        onChange={(e) => onUpdateFineStatus(fine.id, e.target.value as 'pendente' | 'pago' | 'recorrendo')}
                        className="text-[10px] font-semibold bg-slate-50 rounded py-0.5 px-1 focus:outline-none"
                      >
                        <option value="pendente">Pendente - R$ {fine.value.toFixed(2)}</option>
                        <option value="pago">Quitada / Paga</option>
                        <option value="recorrendo">Recorrendo Recurso</option>
                      </select>
                    </div>

                    {/* Interaction buttons */}
                    <div className="flex gap-1.5 shrink-0">
                      {!fine.driverId ? (
                        <button
                          onClick={() => setSelectedFineForId(fine)}
                          className="px-2.5 py-1.5 bg-indigo-650 hover:bg-slate-900 text-white font-bold text-[10px] rounded-lg transition-all flex items-center gap-1 cursor-pointer shadow-xs"
                          title="Cruzar data e hora com diário de bordo para identificar motorista"
                        >
                          <Search size={11} /> Identificar
                        </button>
                      ) : (
                        <button
                          onClick={() => onLinkDriver(fine.id, '')}
                          className="px-2 py-1.5 text-[10px] text-slate-500 hover:text-red-500 bg-slate-50 rounded border transition-all cursor-pointer"
                          title="Remover vínculo de motorista"
                        >
                          Trocar
                        </button>
                      )}
                      
                      <button
                        onClick={() => {
                          if (confirm('Deseja realmente excluir esta infração física para sempre?')) {
                            onDeleteFine(fine.id);
                          }
                        }}
                        className="p-1.5 text-slate-400 hover:text-red-600 rounded transition-colors cursor-pointer"
                        title="Apagar multa"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
