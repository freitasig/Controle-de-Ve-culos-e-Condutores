/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Vehicle, FuelLog, Fine } from '../types';
import { 
  Car, 
  Plus, 
  Trash2, 
  Edit2, 
  Calendar, 
  Gauge, 
  Sliders, 
  ShieldCheck, 
  Building2, 
  FileSpreadsheet,
  X,
  AlertCircle,
  Search,
  Printer,
  FileDown,
  Fuel,
  TrendingUp,
  CircleDollarSign
} from 'lucide-react';

interface VehiclesTabProps {
  vehicles: Vehicle[];
  fuelLogs?: FuelLog[];
  fines?: Fine[];
  onAddVehicle: (v: Omit<Vehicle, 'id'>) => void;
  onEditVehicle: (id: string, updated: Partial<Vehicle>) => void;
  onDeleteVehicle: (id: string) => void;
  onNavigateToTab: (tab: string, prefillId?: string) => void;
  onAddFuelLog: (fl: Omit<FuelLog, 'id'>) => void;
  onDeleteFuelLog: (id: string) => void;
  onAddFine?: (f: Omit<Fine, 'id'>) => void;
  companyCnpj?: string;
}

export const VehiclesTab: React.FC<VehiclesTabProps> = ({
  vehicles,
  fuelLogs = [],
  fines = [],
  onAddVehicle,
  onEditVehicle,
  onDeleteVehicle,
  onNavigateToTab,
  onAddFuelLog,
  onDeleteFuelLog,
  onAddFine,
  companyCnpj = '',
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Filters, Advanced Search and Sorting State
  const [searchTerm, setSearchTerm] = useState('');
  const [filterIpva, setFilterIpva] = useState('all');
  const [filterLicensing, setFilterLicensing] = useState('all');
  const [sortField, setSortField] = useState('model'); // 'model', 'plate', 'year', 'odometer'

  // Refuelling form & drawer states
  const [activeRefuelVehicleId, setActiveRefuelVehicleId] = useState<string | null>(null);
  const [refuelLiters, setRefuelLiters] = useState('35');
  const [refuelCost, setRefuelCost] = useState('180');
  const [refuelOdometer, setRefuelOdometer] = useState('');
  const [refuelFuelType, setRefuelFuelType] = useState<'gasolina' | 'etanol' | 'diesel' | 'gnv'>('gasolina');
  const [refuelDate, setRefuelDate] = useState('2026-05-26');

  // Automatic Fine Checker State per Vehicle
  // Record<vehicleId, { checking: boolean, stage: number, message: string }>
  const [checkingFinesStates, setCheckingFinesStates] = useState<Record<string, { checking: boolean; stage: number; message: string }>>({});

  const MOCK_TRAFFIC_FINES = [
    {
      description: "Transitar em velocidade superior à máxima permitida em até 20%",
      code: "745-50",
      points: 4,
      value: 130.16,
      location: "Av. do Estado, Km 5 - São Paulo/SP"
    },
    {
      description: "Avançar o sinal vermelho do semáforo ou o de parada obrigatória",
      code: "605-01",
      points: 7,
      value: 293.47,
      location: "Av. Brigadeiro Luís Antônio, alt. 2100 - São Paulo/SP"
    },
    {
      description: "Dirigir veículo manuseando telefone celular",
      code: "763-32",
      points: 7,
      value: 293.47,
      location: "Av. das Nações Unidas - São Paulo/SP"
    },
    {
      description: "Transitar em velocidade superior à máxima permitida em mais de 20% até 50%",
      code: "746-30",
      points: 5,
      value: 195.23,
      location: "Marginal Tietê, ponte da Casa Verde - São Paulo/SP"
    },
    {
      description: "Deixar de usar o cinto de segurança pelo condutor ou passageiro",
      code: "518-51",
      points: 5,
      value: 195.23,
      location: "Av. 23 de Maio, alt. Viaduto do Chá - São Paulo/SP"
    }
  ];

  const handleVerifyFines = (vId: string, vPlate: string) => {
    // Stage 1: Connect
    setCheckingFinesStates(prev => ({
      ...prev,
      [vId]: { checking: true, stage: 1, message: 'Estabelecendo handshake seguro com barramento do SENATRAN (SERPRO)...' }
    }));

    // Stage 2: Cross plate / chassi
    setTimeout(() => {
      setCheckingFinesStates(prev => ({
        ...prev,
        [vId]: { checking: true, stage: 2, message: `Buscando infrações vinculadas à placa no DETRAN Estadual (${vPlate})...` }
      }));
    }, 800);

    // Stage 3: Double-checking State Detrans (e.g. Detran SP, Detran MG...)
    setTimeout(() => {
      setCheckingFinesStates(prev => ({
        ...prev,
        [vId]: { checking: true, stage: 3, message: 'Verificando restrições ativas, editais de autuação e convênios municipais...' }
      }));
    }, 1600);

    // Stage 4: Completed
    setTimeout(() => {
      setCheckingFinesStates(prev => ({
        ...prev,
        [vId]: { checking: false, stage: 4, message: 'Consulta concluída com sucesso!' }
      }));
    }, 2400);
  };

  const handleSimulateNewFine = (vId: string) => {
    const randomIndex = Math.floor(Math.random() * MOCK_TRAFFIC_FINES.length);
    const mockFineTemplate = MOCK_TRAFFIC_FINES[randomIndex];

    const now = new Date();
    // randomize time
    now.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60));
    // randomize date in last 10 days
    const randomDaysAgo = Math.floor(Math.random() * 10) + 1;
    now.setDate(now.getDate() - randomDaysAgo);
    
    // Format YYYY-MM-DDTHH:mm
    const yearStr = now.getFullYear();
    const monthStr = String(now.getMonth() + 1).padStart(2, '0');
    const dayStr = String(now.getDate()).padStart(2, '0');
    const hoursStr = String(now.getHours()).padStart(2, '0');
    const minutesStr = String(now.getMinutes()).padStart(2, '0');
    const formattedFineDateTime = `${yearStr}-${monthStr}-${dayStr}T${hoursStr}:${minutesStr}`;

    onAddFine?.({
      vehicleId: vId,
      fineDateTime: formattedFineDateTime,
      description: mockFineTemplate.description,
      code: mockFineTemplate.code,
      points: mockFineTemplate.points,
      value: mockFineTemplate.value,
      location: mockFineTemplate.location,
      status: 'pendente',
      driverId: null,
      identificationStatus: 'pendente'
    });

    alert(
      `[DETRAN ONLINE] Nova infração detectada automaticamente e adicionada ao sistema!\n\n` +
      `🚗 Veículo ID: ${vId}\n` +
      `📝 Infração: ${mockFineTemplate.description}\n` +
      `📍 Local: ${mockFineTemplate.location}\n` +
      `💰 Valor: R$ ${mockFineTemplate.value.toFixed(2)}`
    );
  };

  // Form State
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [plate, setPlate] = useState('');
  const [year, setYear] = useState(new Date().getFullYear());
  const [currentOdometer, setCurrentOdometer] = useState(0);
  const [cnpj, setCnpj] = useState('');
  const [renavam, setRenavam] = useState('');
  const [chassi, setChassi] = useState('');
  
  const [ipvaStatus, setIpvaStatus] = useState<'pago' | 'pendente' | 'vencido'>('pago');
  const [ipvaDueDate, setIpvaDueDate] = useState('2026-08-15');
  const [ipvaValue, setIpvaValue] = useState(0);
  
  const [licensingStatus, setLicensingStatus] = useState<'pago' | 'pendente' | 'vencido'>('pago');
  const [licensingDueDate, setLicensingDueDate] = useState('2026-08-15');

  const resetForm = () => {
    setBrand('');
    setModel('');
    setPlate('');
    setYear(new Date().getFullYear());
    setCurrentOdometer(0);
    setCnpj('');
    setRenavam('');
    setChassi('');
    setIpvaStatus('pago');
    setIpvaDueDate('2026-08-15');
    setIpvaValue(0);
    setLicensingStatus('pago');
    setLicensingDueDate('2026-08-15');
    setEditingId(null);
  };

  // Multi-criteria filter and sort algorithm
  const filteredAndSortedVehicles = vehicles
    .filter(v => {
      const matchSearch = 
        v.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.plate.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (v.cnpj && v.cnpj.includes(searchTerm));
      
      const matchIpva = 
        filterIpva === 'all' || v.ipvaStatus === filterIpva;
        
      const matchLicensing = 
        filterLicensing === 'all' || v.licensingStatus === filterLicensing;

      return matchSearch && matchIpva && matchLicensing;
    })
    .sort((a, b) => {
      if (sortField === 'model') {
        return a.model.localeCompare(b.model);
      }
      if (sortField === 'plate') {
        return a.plate.localeCompare(b.plate);
      }
      if (sortField === 'year') {
        return b.year - a.year; // newer first
      }
      if (sortField === 'odometer') {
        return b.currentOdometer - a.currentOdometer; // higher first
      }
      return 0;
    });

  const handleExportCSV = () => {
    const headers = ['Placa', 'Marca', 'Modelo', 'Ano', 'Odômetro (km)', 'CNPJ', 'IPVA Status', 'IPVA Vencimento', 'Licenc. Status', 'Licenc. Vencimento'];
    const rows = filteredAndSortedVehicles.map(v => [
      v.plate,
      v.brand,
      v.model,
      v.year,
      v.currentOdometer,
      v.cnpj || 'Sem CNPJ',
      v.ipvaStatus,
      v.ipvaDueDate,
      v.licensingStatus,
      v.licensingDueDate
    ]);

    // Format secure CSV file with semicolon or comma separator
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" 
      + [headers.join(';'), ...rows.map(e => e.join(';'))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `relatorio-veiculos-frotamaster-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const handlePrintReport = () => {
    window.print();
  };

  const handleOpenEdit = (v: Vehicle) => {
    setEditingId(v.id);
    setBrand(v.brand);
    setModel(v.model);
    setPlate(v.plate);
    setYear(v.year);
    setCurrentOdometer(v.currentOdometer);
    setCnpj(v.cnpj);
    setRenavam(v.renavam || '');
    setChassi(v.chassi || '');
    setIpvaStatus(v.ipvaStatus);
    setIpvaDueDate(v.ipvaDueDate);
    setIpvaValue(v.ipvaValue);
    setLicensingStatus(v.licensingStatus);
    setLicensingDueDate(v.licensingDueDate);
    setShowAddForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!model || !brand || !plate || !cnpj) {
      alert('Por favor, preencha os campos obrigatórios (*): Marca, Modelo, Placa e CNPJ.');
      return;
    }

    const vehicleData = {
      brand,
      model,
      plate: plate.toUpperCase().trim(),
      year,
      currentOdometer,
      cnpj,
      renavam: renavam || undefined,
      chassi: chassi || undefined,
      ipvaStatus,
      ipvaDueDate,
      ipvaValue,
      licensingStatus,
      licensingDueDate,
    };

    if (editingId) {
      onEditVehicle(editingId, vehicleData);
    } else {
      onAddVehicle(vehicleData);
    }

    resetForm();
    setShowAddForm(false);
  };

  // Plate styling helper
  const renderPlateBadge = (plateNumber: string) => {
    const formattedCode = plateNumber.replace('-', '').toUpperCase();
    const isMercosul = formattedCode.length === 7 && isNaN(parseInt(formattedCode[4])); // Check if 5th char of plate is letter

    return (
      <div className="inline-flex flex-col border border-slate-700 bg-white rounded-md overflow-hidden shadow-xs hover:shadow-sm" style={{ width: '110px' }}>
        {/* Blue bar / Grey bar depending on standard */}
        {isMercosul ? (
          <div className="bg-indigo-600 text-white text-[8px] font-bold text-center py-0.5 leading-none uppercase tracking-wide">
            BRASIL
          </div>
        ) : (
          <div className="bg-slate-300 text-slate-800 text-[8px] font-semibold text-center py-0.5 leading-none uppercase">
            SP - SÃO PAULO
          </div>
        )}
        <div className="px-2 py-0.5 text-center font-mono text-sm font-bold tracking-widest text-slate-900 bg-slate-50 uppercase">
          {isMercosul ? formattedCode : `${formattedCode.substring(0, 3)}-${formattedCode.substring(3)}`}
        </div>
      </div>
    );
  };

  // Status Colors
  const statusLabels = {
    pago: { text: 'Pago/Regular', bg: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
    pendente: { text: 'Pendente', bg: 'bg-amber-50 text-amber-700 border-amber-100' },
    vencido: { text: 'Vencido', bg: 'bg-red-50 text-red-700 border-red-100' }
  };

  return (
    <div className="space-y-6">
      {/* Header operations */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Frota de Veículos da Empresa</h1>
          <p className="text-xs text-slate-500">Cadastre e acompanhe os carros, impostos e licenciamentos em CNPJ</p>
        </div>
        {!showAddForm && (
          <button
            onClick={() => { resetForm(); setShowAddForm(true); }}
            className="h-10 px-4 bg-indigo-650 hover:bg-slate-900 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition-all self-start sm:self-center cursor-pointer shadow-xs"
            id="btn-add-vehicle"
          >
            <Plus size={16} />
            Novo Veículo
          </button>
        )}
      </div>

      {/* Main vehicle register/edit Form */}
      {showAddForm && (
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700">
              {editingId ? 'Editar Veículo da Frota' : 'Cadastrar Novo Veículo da Frota'}
            </h3>
            <button 
              onClick={() => { resetForm(); setShowAddForm(false); }}
              className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <h4 className="text-xs font-semibold text-indigo-600 uppercase tracking-widest">1. Dados Básicos do Veículo</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-500 uppercase">Marca *</label>
                <input
                  type="text"
                  placeholder="Ex: Chevrolet, Volkswagen"
                  required
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-500 uppercase">Modelo *</label>
                <input
                  type="text"
                  placeholder="Ex: Onix Hatch, Gol, KA"
                  required
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-500 uppercase">Placa *</label>
                <input
                  type="text"
                  placeholder="Ex: QYX-9B42 ou GOL-1234"
                  required
                  value={plate}
                  onChange={(e) => setPlate(e.target.value)}
                  className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono uppercase focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-500 uppercase">Ano de Fabricação/Modelo</label>
                <input
                  type="number"
                  placeholder="Ex: 2021"
                  required
                  value={year}
                  onChange={(e) => setYear(parseInt(e.target.value) || new Date().getFullYear())}
                  className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-500 uppercase flex items-center gap-1">
                  <Gauge size={12} /> Odômetro Atual (Km)
                </label>
                <input
                  type="number"
                  placeholder="Ex: 45000"
                  required
                  value={currentOdometer}
                  onChange={(e) => setCurrentOdometer(parseInt(e.target.value) || 0)}
                  className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-semibold text-slate-500 uppercase flex items-center gap-1">
                    <Building2 size={12} /> CNPJ Vinculado *
                  </label>
                  {companyCnpj && (
                    <button
                      type="button"
                      onClick={() => setCnpj(companyCnpj)}
                      className="text-[9px] text-blue-600 hover:text-blue-700 hover:underline font-bold transition-all cursor-pointer leading-none"
                      title={`Copiar CNPJ da empresa cadastrada: ${companyCnpj}`}
                    >
                      Usar CNPJ da Empresa
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  placeholder="Ex: 12.345.678/0001-99"
                  required
                  value={cnpj}
                  onChange={(e) => setCnpj(e.target.value)}
                  className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-500 uppercase">Renavam (Documento)</label>
                <input
                  type="text"
                  placeholder="Apenas números (opcional)"
                  value={renavam}
                  onChange={(e) => setRenavam(e.target.value)}
                  className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-500 uppercase">Chassi</label>
                <input
                  type="text"
                  placeholder="Código do chassi (opcional)"
                  value={chassi}
                  onChange={(e) => setChassi(e.target.value)}
                  className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono uppercase focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            <h4 className="text-xs font-semibold text-indigo-600 uppercase tracking-widest pt-2 border-t border-slate-100">2. IPVA, Licenciamento e Custos</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Licenciamento */}
              <div className="p-4 bg-slate-50/50 rounded-xl border border-slate-200 space-y-3">
                <p className="text-xs font-bold text-slate-700">Licenciamento</p>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400">Status</label>
                  <select
                    value={licensingStatus}
                    onChange={(e) => setLicensingStatus(e.target.value as 'pago' | 'pendente' | 'vencido')}
                    className="w-full h-8 px-2 bg-white border border-slate-200 rounded-lg text-xs"
                  >
                    <option value="pago">Pago / Registrado</option>
                    <option value="pendente">Pendente / Em Aberto</option>
                    <option value="vencido">Vencido / Atrasado</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-400">Vencimento Licenciamento</label>
                  <input
                    type="date"
                    value={licensingDueDate}
                    onChange={(e) => setLicensingDueDate(e.target.value)}
                    className="w-full h-8 px-2 bg-white border border-slate-200 rounded-lg text-xs"
                  />
                </div>
              </div>

              {/* IPVA */}
              <div className="p-4 bg-slate-50/50 rounded-xl border border-slate-200 space-y-3 sm:col-span-2">
                <p className="text-xs font-bold text-slate-700">Imposto sobre Propriedade (IPVA)</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-slate-400">Status IPVA</label>
                    <select
                      value={ipvaStatus}
                      onChange={(e) => setIpvaStatus(e.target.value as 'pago' | 'pendente' | 'vencido')}
                      className="w-full h-8 px-2 bg-white border border-slate-200 rounded-lg text-xs"
                    >
                      <option value="pago">Pago / Cota Única</option>
                      <option value="pendente">Pendente / Parcelado</option>
                      <option value="vencido">Atrasado / Divida Ativa</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-slate-400">Valor Anual IPVA (R$)</label>
                    <input
                      type="number"
                      placeholder="Ex: 1450"
                      value={ipvaValue}
                      onChange={(e) => setIpvaValue(parseFloat(e.target.value) || 0)}
                      className="w-full h-8 px-2 bg-white border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-bold text-slate-400">Vencimento IPVA</label>
                    <input
                      type="date"
                      value={ipvaDueDate}
                      onChange={(e) => setIpvaDueDate(e.target.value)}
                      className="w-full h-8 px-2 bg-white border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => { resetForm(); setShowAddForm(false); }}
                className="h-10 px-4 border border-slate-250 text-slate-700 font-medium text-xs rounded-xl hover:bg-slate-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="h-10 px-5 bg-indigo-650 hover:bg-slate-900 text-white font-semibold text-xs rounded-xl transition-all shadow-sm"
              >
                {editingId ? 'Salvar Alterações' : 'Adicionar Carro da Frota'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Search, Advanced Multi-Criteria Filter & Report Tool */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4 print:hidden">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
            <input
              type="text"
              placeholder="Buscar por placa, modelo, marca ou CNPJ..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-10 pl-9 pr-4 bg-slate-50 border border-slate-200 rounded-xl text-xs placeholder-slate-450 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* IPVA filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase hidden sm:inline">IPVA:</span>
              <select
                value={filterIpva}
                onChange={(e) => setFilterIpva(e.target.value)}
                className="h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-505 bg-white cursor-pointer"
              >
                <option value="all">IPVA: Todos</option>
                <option value="pago font-medium">Regular (Pago)</option>
                <option value="pendente font-medium">Pendente / Parcelas</option>
                <option value="vencido font-bold text-red-600">Atrasado / Vencido</option>
              </select>
            </div>

            {/* Licensing filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase hidden sm:inline">Licenc.:</span>
              <select
                value={filterLicensing}
                onChange={(e) => setFilterLicensing(e.target.value)}
                className="h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-505 bg-white cursor-pointer"
              >
                <option value="all">Licenciat.: Todos</option>
                <option value="pago font-medium">Regular</option>
                <option value="pendente font-medium">Pendente</option>
                <option value="vencido font-bold text-red-600">Atrasado / Vencido</option>
              </select>
            </div>

            {/* Sorting criteria */}
            <div className="flex items-center gap-1.5 font-sans">
              <span className="text-[10px] font-bold text-slate-400 uppercase hidden sm:inline">Ordenar:</span>
              <select
                value={sortField}
                onChange={(e) => setSortField(e.target.value)}
                className="h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-505 bg-white cursor-pointer"
              >
                <option value="model">Veículo: Modelo</option>
                <option value="plate">Veículo: Placa</option>
                <option value="year">Veículo: Ano (Novos)</option>
                <option value="odometer">Veículo: Odômetro (Maior Km)</option>
              </select>
            </div>
            
            {/* CSV export */}
            <button
              onClick={handleExportCSV}
              type="button"
              className="h-10 px-3 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl flex items-center justify-center gap-1.5 text-xs transition-colors cursor-pointer border border-slate-200 font-bold"
            >
              <FileDown size={14} className="text-emerald-600" />
              <span>Exportar</span>
            </button>

            {/* Printer reports */}
            <button
              onClick={handlePrintReport}
              type="button"
              className="h-10 px-3 bg-slate-900 hover:bg-slate-850 text-white rounded-xl flex items-center justify-center gap-1.5 text-xs transition-all cursor-pointer font-bold shrink-0"
            >
              <Printer size={14} className="text-blue-400" />
              <span>Imprimir</span>
            </button>
          </div>
        </div>
      </div>

      {filteredAndSortedVehicles.length === 0 && (
        <div className="bg-white p-12 text-center rounded-2xl border border-slate-150 space-y-2">
          <Car size={36} className="text-slate-300 mx-auto" />
          <p className="text-sm font-bold text-slate-800">Nenhum veículo corresponde à sua busca ou filtro.</p>
          <p className="text-xs text-slate-400">Verifique os filtros selecionados ou digite um critério menos estrito.</p>
        </div>
      )}

      {/* Grid of registered vehicles */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAndSortedVehicles.map(v => {
          const systemToday = new Date('2026-05-26');
          const isIPVAOverdue = v.ipvaStatus === 'vencido' || new Date(v.ipvaDueDate) < systemToday;
          const isLicensingOverdue = v.licensingStatus === 'vencido' || new Date(v.licensingDueDate) < systemToday;

          return (
            <div 
              key={v.id} 
              className="bg-white rounded-2xl border border-slate-150 shadow-xs hover:shadow-md hover:border-slate-350 transition-all flex flex-col overflow-hidden break-inside-avoid print:shadow-none print:border-slate-200"
              id={`vehicle-card-${v.id}`}
            >
              {/* Header card info with plate layout */}
              <div className="p-5 border-b border-slate-100 flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <h3 className="font-semibold text-slate-900 text-base">{v.brand} {v.model}</h3>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                    <Car size={13} className="text-slate-400" />
                    <span>Ano {v.year}</span>
                    <span className="text-slate-300 print:hidden">•</span>
                    <span className="print:hidden">{v.cnpj ? `CNPJ ${v.cnpj.substring(0, 5)}...` : 'Sem CNPJ'}</span>
                    <span className="hidden print:inline">• {v.cnpj ? `CNPJ ${v.cnpj}` : ''}</span>
                  </div>
                </div>
                <div>
                  {renderPlateBadge(v.plate)}
                </div>
              </div>

              {/* Data and details */}
              <div className="p-5 flex-1 space-y-4">
                <div className="flex items-center justify-between text-xs pb-1">
                  <span className="text-slate-500 font-medium flex items-center gap-1">
                    <Gauge size={14} className="text-slate-400" /> Quilometragem atual
                  </span>
                  <span className="font-bold text-slate-800 bg-slate-50 border border-slate-100 px-2 py-1 rounded">
                    {v.currentOdometer.toLocaleString('pt-BR')} km
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  {/* Licensing Status Box */}
                  <div className="p-3 bg-slate-50/50 rounded-xl border border-slate-100 space-y-2">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Licenciamento</p>
                    <div className="flex flex-col gap-1">
                      <span className={`inline-block text-center text-[10px] font-bold px-1.5 py-0.5 rounded border self-start ${
                        isLicensingOverdue 
                          ? statusLabels['vencido'].bg 
                          : statusLabels[v.licensingStatus].bg
                      }`}>
                        {isLicensingOverdue ? 'Vencido' : statusLabels[v.licensingStatus].text}
                      </span>
                      <span className="text-[10px] text-slate-500 font-medium flex items-center gap-1">
                        <Calendar size={11} />
                        {new Date(v.licensingDueDate).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  </div>

                  {/* IPVA Status Box */}
                  <div className="p-3 bg-slate-50/50 rounded-xl border border-slate-100 space-y-2">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">IPVA</p>
                    <div className="flex flex-col gap-1">
                      <span className={`inline-block text-center text-[10px] font-bold px-1.5 py-0.5 rounded border self-start ${
                        isIPVAOverdue 
                          ? statusLabels['vencido'].bg 
                          : statusLabels[v.ipvaStatus].bg
                      }`}>
                        {isIPVAOverdue ? 'Vencido' : statusLabels[v.ipvaStatus].text}
                      </span>
                      <span className="text-[10px] text-slate-700 font-semibold font-sans">
                        R$ {v.ipvaValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Additional vehicle keys */}
                {(v.renavam || v.chassi) && (
                  <div className="p-3 bg-indigo-50/20 rounded-xl border border-indigo-50/50 text-[10px] font-mono text-slate-500 space-y-1">
                    {v.renavam && <p><span className="font-semibold">RENAVAM:</span> {v.renavam}</p>}
                    {v.chassi && <p><span className="font-semibold">CHASSI:</span> {v.chassi}</p>}
                  </div>
                )}

                {/* Fuel Tracking Module */}
                <div className="mt-2 border-t border-slate-100 pt-3 space-y-2 print:hidden" id={`fuel-card-section-${v.id}`}>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-505 uppercase flex items-center gap-1">
                      <Fuel size={13} className="text-emerald-600" />
                      Média de consumo & Abastecimentos
                    </span>
                    <button 
                      onClick={() => setActiveRefuelVehicleId(activeRefuelVehicleId === v.id ? null : v.id)}
                      className="text-[10px] font-bold text-indigo-650 hover:underline cursor-pointer"
                    >
                      {activeRefuelVehicleId === v.id ? 'Fechar Detalhes ▲' : 'Gerenciar Abastecimentos ▼'}
                    </button>
                  </div>

                  {(() => {
                    const vehicleFuelLogs = fuelLogs.filter(fl => fl.vehicleId === v.id);
                    const totalLiters = vehicleFuelLogs.reduce((acc, curr) => acc + curr.liters, 0);
                    const totalFuelCost = vehicleFuelLogs.reduce((acc, curr) => acc + curr.cost, 0);

                    // Accurate consumption average (Km/L) calculated if at least 2 logs exist
                    let kmPerLiter = 'Requer 2 registr.';
                    if (vehicleFuelLogs.length >= 2) {
                      const sortedLogs = [...vehicleFuelLogs].sort((a,b) => a.odometer - b.odometer);
                      const kmRun = sortedLogs[sortedLogs.length - 1].odometer - sortedLogs[0].odometer;
                      const litersSpent = sortedLogs.slice(1).reduce((acc, curr) => acc + curr.liters, 0);
                      if (litersSpent > 0 && kmRun > 0) {
                        kmPerLiter = `${(kmRun / litersSpent).toFixed(1)} km/L`;
                      }
                    } else if (vehicleFuelLogs.length === 1) {
                      kmPerLiter = 'Requer 2 registros';
                    }

                    return (
                      <div className="space-y-2">
                        {/* Summary metrics row layout */}
                        <div className="grid grid-cols-3 gap-1.5 text-center">
                          <div className="bg-slate-50/50 p-1.5 rounded-lg border border-slate-100">
                            <span className="block text-[8px] text-slate-400 font-bold uppercase">Consumo Médio</span>
                            <span className="text-[10px] font-bold text-slate-800 font-mono">{kmPerLiter}</span>
                          </div>
                          <div className="bg-slate-50/50 p-1.5 rounded-lg border border-slate-100">
                            <span className="block text-[8px] text-slate-400 font-bold uppercase">Total Litros</span>
                            <span className="text-[10px] font-bold text-slate-800 font-mono">{totalLiters} L</span>
                          </div>
                          <div className="bg-slate-50/50 p-1.5 rounded-lg border border-slate-100">
                            <span className="block text-[8px] text-slate-400 font-bold uppercase">Custo Total</span>
                            <span className="text-[10px] font-extrabold text-emerald-600 font-mono">
                              R$ {totalFuelCost.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                            </span>
                          </div>
                        </div>

                        {/* Collapsible refuel operations inside card */}
                        {activeRefuelVehicleId === v.id && (
                          <div className="p-3 bg-slate-50 rounded-xl space-y-3 border border-slate-200 transition-all">
                            {/* Short inline log form */}
                            <form 
                              onSubmit={(e) => {
                                e.preventDefault();
                                if (!refuelLiters || !refuelCost || !refuelOdometer) {
                                  alert('Por favor, informe litros, custo em R$ e o odômetro.');
                                  return;
                                }
                                const l = parseFloat(refuelLiters);
                                const c = parseFloat(refuelCost);
                                const odo = parseInt(refuelOdometer);
                                if (odo < v.currentOdometer) {
                                  alert(`Erro: O odômetro não pode ser menor que a km atual do veículo (${v.currentOdometer.toLocaleString('pt-BR')} km).`);
                                  return;
                                }

                                onAddFuelLog({
                                  vehicleId: v.id,
                                  liters: l,
                                  cost: c,
                                  odometer: odo,
                                  fuelType: refuelFuelType,
                                  date: refuelDate
                                });

                                // Notify and reset
                                setRefuelOdometer('');
                                alert('Abastecimento registrado com sucesso! O odômetro atualizado refletirá no sistema.');
                              }}
                              className="space-y-2 border-b border-slate-150 pb-2.5"
                            >
                              <p className="text-[9px] font-bold text-slate-700 flex items-center gap-1 uppercase tracking-wider">
                                <Plus size={12} className="text-indigo-600" /> Registrar Abastecimento
                              </p>
                              
                              <div className="grid grid-cols-2 gap-2">
                                <div className="space-y-0.5">
                                  <label className="text-[8px] font-bold text-slate-400 uppercase">Litros</label>
                                  <input 
                                    type="number" 
                                    step="0.01" 
                                    required
                                    placeholder="Liters"
                                    value={refuelLiters} 
                                    onChange={(e) => setRefuelLiters(e.target.value)}
                                    className="w-full h-7 px-1.5 bg-white border border-slate-200 rounded text-[10px]"
                                  />
                                </div>
                                <div className="space-y-0.5">
                                  <label className="text-[8px] font-bold text-slate-400 uppercase">Custo Pago (R$)</label>
                                  <input 
                                    type="number" 
                                    step="0.01" 
                                    required
                                    placeholder="Valor R$"
                                    value={refuelCost} 
                                    onChange={(e) => setRefuelCost(e.target.value)}
                                    className="w-full h-7 px-1.5 bg-white border border-slate-200 rounded text-[10px]"
                                  />
                                </div>
                                <div className="space-y-0.5">
                                  <label className="text-[8px] font-bold text-slate-400 uppercase font-mono">Odômetro (km)</label>
                                  <input 
                                    type="number" 
                                    required
                                    placeholder={`Min: ${v.currentOdometer}`}
                                    value={refuelOdometer} 
                                    onChange={(e) => setRefuelOdometer(e.target.value)}
                                    className="w-full h-7 px-1.5 bg-white border border-slate-200 rounded text-[10px] font-mono"
                                  />
                                </div>
                                <div className="space-y-0.5">
                                  <label className="text-[8px] font-bold text-slate-400 uppercase">Combustível</label>
                                  <select
                                    value={refuelFuelType}
                                    onChange={(e) => setRefuelFuelType(e.target.value as any)}
                                    className="w-full h-7 px-1 bg-white border border-slate-200 rounded text-[10px]"
                                  >
                                    <option value="gasolina">Gasolina</option>
                                    <option value="etanol">Etanol</option>
                                    <option value="diesel">Diesel</option>
                                    <option value="gnv">GNV</option>
                                  </select>
                                </div>
                              </div>

                              <button 
                                type="submit"
                                className="w-full h-7 bg-indigo-650 hover:bg-slate-900 text-white font-black text-[9px] uppercase tracking-wider rounded transition-all cursor-pointer"
                              >
                                Gravar no Relatório
                              </button>
                            </form>

                            {/* Refuel ledger listings history */}
                            <div className="space-y-1">
                              <p className="text-[9px] font-bold uppercase text-slate-400 tracking-wider">Lançamentos:</p>
                              {vehicleFuelLogs.length === 0 ? (
                                <p className="text-[8px] text-slate-400 italic">Sem abastecimentos anteriores.</p>
                              ) : (
                                <div className="max-h-[90px] overflow-y-auto divide-y divide-slate-100 pr-1">
                                  {vehicleFuelLogs.map(log => (
                                    <div key={log.id} className="py-1 flex items-center justify-between text-[10px] font-medium">
                                      <span className="text-slate-405 font-mono">
                                        {new Date(log.date).toLocaleDateString('pt-BR')} ({log.fuelType.substring(0,3).toUpperCase()})
                                      </span>
                                      <div className="flex items-center gap-1.5">
                                        <span className="font-extrabold text-slate-705 font-mono">
                                          {log.liters}L ~ R$ {log.cost.toLocaleString('pt-BR')}
                                        </span>
                                        <button 
                                          onClick={() => {
                                            const confirmDel = confirm('Deseja excluir este abastecimento?');
                                            if (confirmDel) onDeleteFuelLog(log.id);
                                          }}
                                          className="text-red-500 hover:bg-red-50 font-bold px-1.5 text-[9px] rounded text-center cursor-pointer transition-colors"
                                          title="Deletar registro"
                                        >
                                          ✕
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* Automatic Fines Checking Module */}
                  <div className="mt-3 border-t border-slate-100 pt-3 space-y-2 print:hidden" id={`fine-check-section-${v.id}`}>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
                        <Search size={13} className="text-indigo-600" />
                        Consulta de Multas (Senatran)
                      </span>
                      <span className="text-[8px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded uppercase font-mono">
                        Online
                      </span>
                    </div>

                    {(() => {
                      const vehicleFines = fines.filter(f => f.vehicleId === v.id);
                      const pendingFines = vehicleFines.filter(f => f.status === 'pendente');
                      const checkingState = checkingFinesStates[v.id];

                      if (checkingState?.checking) {
                        return (
                          <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl space-y-2 animate-pulse">
                            <div className="flex items-center gap-2">
                              <span className="animate-spin text-indigo-600 font-extrabold text-sm leading-none">&#10227;</span>
                              <span className="text-[10px] font-extrabold text-indigo-900 uppercase">Varredura em Andamento...</span>
                            </div>
                            <p className="text-[10px] font-medium text-slate-600 leading-snug font-sans">
                              {checkingState.message}
                            </p>
                            {/* Simulated mini terminal status */}
                            <div className="p-1.5 bg-slate-900 text-white font-mono text-[8px] rounded divide-y divide-slate-800 leading-normal">
                              <div>GET /api/v1/vehicles/{v.plate}/infractions HTTP/1.1</div>
                              {checkingState.stage >= 2 && <div className="text-emerald-400">CONNECT serpro.gov.br:443 - SSL_OK</div>}
                              {checkingState.stage >= 3 && <div className="text-yellow-400 font-bold">SENT {v.plate} - SCANNING DETRAN...</div>}
                            </div>
                          </div>
                        );
                      }

                      return (
                        <div className="space-y-2">
                          {/* Status bar */}
                          {vehicleFines.length === 0 ? (
                            <div className="p-2.5 bg-emerald-50/50 border border-emerald-100 rounded-xl flex items-center justify-between text-[10px] text-slate-600">
                              <span className="font-semibold text-emerald-800 flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                                Situação Regular
                              </span>
                              <span className="font-medium text-slate-400">0 multas ativas</span>
                            </div>
                          ) : (
                            <div className="p-2.5 bg-rose-50 border border-rose-100 rounded-xl space-y-1.5">
                              <div className="flex items-center justify-between text-[10px]">
                                <span className="font-extrabold text-rose-800 flex items-center gap-1.5">
                                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping"></span>
                                  CNPJ: {vehicleFines.length} MULTA(S) IDENTIFICADA(S)
                                </span>
                                <button
                                  onClick={() => onNavigateToTab('multas')}
                                  className="text-rose-600 hover:underline font-bold text-[9px] cursor-pointer"
                                >
                                  Ver detalhes &rarr;
                                </button>
                              </div>
                              
                              {/* Brief list of pending fines */}
                              <div className="max-h-20 overflow-y-auto space-y-1 pr-1 font-sans">
                                {vehicleFines.map((fine) => (
                                  <div key={fine.id} className="text-[9px] font-bold text-slate-500 bg-white/70 px-1.5 py-0.5 rounded border border-slate-100 flex items-center justify-between">
                                    <span className="truncate max-w-[130px] italic">"{fine.description}"</span>
                                    <span className={fine.status === 'pago' ? 'text-emerald-600 font-bold' : 'text-rose-650 font-bold'}>
                                      R$ {fine.value.toFixed(2)} ({fine.status.toUpperCase()})
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Action row with verify button and simulation option */}
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => handleVerifyFines(v.id, v.plate)}
                              type="button"
                              className="flex-1 h-7 bg-slate-900 hover:bg-slate-850 text-white font-bold text-[9px] rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer select-none"
                              title="Lança chamada automática para consulta de multas no portal do Senatran"
                            >
                              <span>Verificar Novas Multas ⟲</span>
                            </button>
                            
                            <button
                              onClick={() => handleSimulateNewFine(v.id)}
                              type="button"
                              className="px-2 h-7 bg-rose-50 hover:bg-rose-100 text-rose-750 hover:text-rose-800 border border-rose-200 hover:border-rose-305 font-bold text-[9px] rounded-lg transition-all flex items-center justify-center cursor-pointer select-none font-sans"
                              title="Simular autuação da rodovia para o diário de bordo deste veículo"
                            >
                              <span>Simular Infração</span>
                            </button>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>

              {/* Bottom quick action buttons */}
              <div className="bg-slate-50 p-4 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
                {/* Delete and Edit */}
                <div className="flex gap-1">
                  <button
                    onClick={() => handleOpenEdit(v)}
                    title="Editar informações do veículo"
                    className="p-2 text-slate-500 hover:text-indigo-650 hover:bg-white rounded-lg border border-transparent hover:border-slate-200 transition-colors cursor-pointer"
                  >
                    <Edit2 size={13} />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Deseja realmente excluir o veículo ${v.brand} ${v.model} (${v.plate}) da frota?`)) {
                        onDeleteVehicle(v.id);
                      }
                    }}
                    title="Excluir carro da frota"
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-white rounded-lg border border-transparent hover:border-slate-200 transition-colors cursor-pointer"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>

                {/* Quick tab jumps */}
                <div className="flex gap-1.5 font-medium">
                  <button
                    onClick={() => onNavigateToTab('viagens')}
                    className="px-2 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded text-[10px] text-slate-600 transition-all cursor-pointer"
                  >
                    Lançar Uso
                  </button>
                  <button
                    onClick={() => onNavigateToTab('manutencoes')}
                    className="px-2 py-1 bg-indigo-650 hover:bg-indigo-750 text-white rounded text-[10px] transition-all cursor-pointer"
                  >
                    Lançar Oficina
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
