/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Driver, TripLog } from '../types';
import { 
  Users, 
  Plus, 
  Trash2, 
  Edit2, 
  Calendar, 
  UserCheck, 
  Phone, 
  FileText, 
  AlertOctagon, 
  X,
  TrendingUp,
  MapPin
} from 'lucide-react';

interface DriversTabProps {
  drivers: Driver[];
  trips: TripLog[];
  onAddDriver: (d: Omit<Driver, 'id'>) => void;
  onEditDriver: (id: string, updated: Partial<Driver>) => void;
  onDeleteDriver: (id: string) => void;
}

export const DriversTab: React.FC<DriversTabProps> = ({
  drivers,
  trips,
  onAddDriver,
  onEditDriver,
  onDeleteDriver,
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [cpf, setCpf] = useState('');
  const [cnh, setCnh] = useState('');
  const [cnhCategory, setCnhCategory] = useState('B');
  const [cnhExpiry, setCnhExpiry] = useState('2028-10-15');
  const [phone, setPhone] = useState('');
  const [active, setActive] = useState(true);

  const resetForm = () => {
    setName('');
    setCpf('');
    setCnh('');
    setCnhCategory('B');
    setCnhExpiry('2028-10-15');
    setPhone('');
    setActive(true);
    setEditingId(null);
  };

  const handleOpenEdit = (d: Driver) => {
    setEditingId(d.id);
    setName(d.name);
    setCpf(d.cpf);
    setCnh(d.cnh);
    setCnhCategory(d.cnhCategory);
    setCnhExpiry(d.cnhExpiry);
    setPhone(d.phone);
    setActive(d.active);
    setShowAddForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !cpf || !cnh) {
      alert('Por favor, preencha os campos obrigatórios (*): Nome completo, CPF e CNH.');
      return;
    }

    const driverData = {
      name,
      cpf,
      cnh,
      cnhCategory,
      cnhExpiry,
      phone,
      active,
    };

    if (editingId) {
      onEditDriver(editingId, driverData);
    } else {
      onAddDriver(driverData);
    }

    resetForm();
    setShowAddForm(false);
  };

  return (
    <div className="space-y-6">
      {/* Tab Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Motoristas e Condutores Autorizados</h1>
          <p className="text-xs text-slate-500">Acompanhe a elegibilidade (CNH) dos colaboradores e evite multas graves de trânsito</p>
        </div>
        {!showAddForm && (
          <button
            onClick={() => { resetForm(); setShowAddForm(true); }}
            className="h-10 px-4 bg-indigo-650 hover:bg-slate-900 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition-all self-start sm:self-center cursor-pointer shadow-xs"
            id="btn-add-driver"
          >
            <Plus size={16} />
            Novo Motorista
          </button>
        )}
      </div>

      {/* Insert or Edit driver form */}
      {showAddForm && (
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700">
              {editingId ? 'Editar Motorista' : 'Cadastrar Novo Motorista de Frota'}
            </h3>
            <button 
              onClick={() => { resetForm(); setShowAddForm(false); }}
              className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-500 uppercase">Nome Completo *</label>
                <input
                  type="text"
                  placeholder="Nome do condutor"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-500 uppercase">CPF *</label>
                <input
                  type="text"
                  placeholder="Ex: 000.000.000-00"
                  required
                  value={cpf}
                  onChange={(e) => setCpf(e.target.value)}
                  className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-500 uppercase">Telefone / WhatsApp</label>
                <input
                  type="text"
                  placeholder="Ex: (11) 98765-4321"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-500 uppercase">Número da CNH *</label>
                <input
                  type="text"
                  placeholder="Número de registro"
                  required
                  value={cnh}
                  onChange={(e) => setCnh(e.target.value)}
                  className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-500 uppercase">Categoria CNH</label>
                <select
                  value={cnhCategory}
                  onChange={(e) => setCnhCategory(e.target.value)}
                  className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="A">A (Moto)</option>
                  <option value="B">B (Carro)</option>
                  <option value="AB">A & B (Carro/Moto)</option>
                  <option value="C">C (Caminhão básico)</option>
                  <option value="D">D (Microônibus/Ônibus)</option>
                  <option value="E">E (Especial/Carreta)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-500 uppercase">Vencimento da CNH</label>
                <input
                  type="date"
                  required
                  value={cnhExpiry}
                  onChange={(e) => setCnhExpiry(e.target.value)}
                  className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-500 uppercase">Elegível ao Serviço</label>
                <div className="flex items-center h-10 gap-2">
                  <input
                    type="checkbox"
                    id="checkbox-active"
                    checked={active}
                    onChange={(e) => setActive(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <label htmlFor="checkbox-active" className="text-xs font-semibold text-slate-700">Ativo / Autorizado</label>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
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
                {editingId ? 'Salvar Alterações' : 'Adicionar Motorista'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Driver cards rendering */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {drivers.map(d => {
          // Verify if CNH is expired
          const systemToday = new Date('2026-05-26');
          const expiryDate = new Date(d.cnhExpiry);
          const isExpired = expiryDate < systemToday;
          
          // Verify if driver is currently in use
          const onDutyTrip = trips.find(t => t.driverId === d.id && t.endDateTime === null);

          return (
            <div 
              key={d.id} 
              className={`bg-white rounded-2xl border ${
                isExpired 
                  ? 'border-red-200' 
                  : 'border-slate-150 shadow-xs'
              } flex flex-col p-5 hover:shadow-md transition-all relative`}
              id={`driver-card-${d.id}`}
            >
              {/* Alert expired float tag */}
              {isExpired && (
                <div className="absolute top-4 right-4 bg-red-100 text-red-700 px-2.5 py-1 rounded-full text-[9px] font-bold flex items-center gap-1">
                  <AlertOctagon size={11} /> CNH Vencida
                </div>
              )}

              {/* Header profile info */}
              <div className="flex items-center gap-4">
                <div className={`h-12 w-12 rounded-full font-bold text-sm text-white flex items-center justify-center shrink-0 uppercase tracking-widest ${
                  isExpired 
                    ? 'bg-red-400' 
                    : onDutyTrip 
                      ? 'bg-sky-500' 
                      : 'bg-indigo-650'
                }`}>
                  {d.name.substring(0, 2)}
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 leading-snug">{d.name}</h3>
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 pt-0.5">
                    <span className="bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">{d.cnhCategory}</span>
                    <span>CNH: {d.cnh}</span>
                  </div>
                </div>
              </div>

              {/* Driver usage info / CNH / Expiry */}
              <div className="mt-5 space-y-3 flex-1 text-slate-700">
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block pb-0.5">CPF</span>
                    <span className="font-medium text-slate-800">{d.cpf}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block pb-0.5">WhatsApp / Fone</span>
                    <span className="font-medium text-slate-800 flex items-center gap-1">
                      <Phone size={12} className="text-slate-400" /> {d.phone || 'S/ Telefone'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs pt-1">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block pb-0.5">Vencimento CNH</span>
                    <span className={`font-semibold ${isExpired ? 'text-red-600 font-bold' : 'text-slate-800'}`}>
                      {expiryDate.toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block pb-0.5">Status Autorização</span>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      d.active && !isExpired 
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-100' 
                        : 'bg-slate-100 text-slate-600 border border-slate-200'
                    }`}>
                      {d.active ? (isExpired ? 'Elegibilidade Bloqueada' : 'Ativo') : 'Inativo / Suspenso'}
                    </span>
                  </div>
                </div>

                {/* Status on route indicator info */}
                {onDutyTrip && (
                  <div className="p-3 bg-sky-50 border border-sky-100 rounded-xl flex items-center gap-2.5 text-xs mt-2">
                    <MapPin className="text-sky-500 shrink-0 animate-bounce" size={16} />
                    <div>
                      <p className="font-semibold text-sky-900 leading-none">Atualmente em trânsito</p>
                      <p className="text-[11px] text-sky-700 pt-1 leading-snug">Liberou saída desde {new Date(onDutyTrip.startDateTime).toLocaleDateString('pt-BR')}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Header card footers */}
              <div className="border-t border-slate-100 pt-4 mt-5 flex items-center justify-between text-xs">
                <button
                  onClick={() => handleOpenEdit(d)}
                  className="text-slate-500 hover:text-indigo-600 font-medium px-2 py-1 hover:bg-slate-50 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Edit2 size={13} /> Editar Motorista
                </button>
                <button
                  onClick={() => {
                    if (confirm(`Deseja realmente apagar o cadastro de ${d.name}? Históricos de multas e logs poderão ficar sem referência.`)) {
                      onDeleteDriver(d.id);
                    }
                  }}
                  className="text-slate-400 hover:text-red-500 font-medium px-2 py-1 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 size={13} /> Excluir
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
