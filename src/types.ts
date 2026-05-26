/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Vehicle {
  id: string;
  model: string;
  brand: string;
  plate: string; // Ex: AAA-1234 or ABC1D23
  year: number;
  currentOdometer: number;
  cnpj: string; // CNPJ of registrations
  renavam?: string;
  chassi?: string;
  ipvaStatus: 'pago' | 'pendente' | 'vencido';
  ipvaDueDate: string; // YYYY-MM-DD
  ipvaValue: number;
  licensingStatus: 'pago' | 'pendente' | 'vencido';
  licensingDueDate: string; // YYYY-MM-DD
}

export interface Driver {
  id: string;
  name: string;
  cpf: string;
  cnh: string;
  cnhCategory: string; // Ex: A, B, AB, D
  cnhExpiry: string; // YYYY-MM-DD
  phone: string;
  active: boolean; // Is dynamic
}

export interface TripLog {
  id: string;
  vehicleId: string;
  driverId: string;
  startDateTime: string; // YYYY-MM-DDTHH:mm
  startOdometer: number;
  endDateTime: string | null; // null if active
  endOdometer: number | null; // null if active
  purpose: string;
}

export interface Maintenance {
  id: string;
  vehicleId: string;
  description: string; // Ex: "Troca de Óleo", "Pastilhas"
  date: string; // YYYY-MM-DD
  odometer: number; // Odometer at maintenance
  cost: number;
  nextRecommendedOdometer: number | null; // Ex: current + 10000
  nextRecommendedDate: string | null; // YYYY-MM-DD
  status: 'concluida' | 'agendada';
}

export interface Fine {
  id: string;
  vehicleId: string;
  fineDateTime: string; // YYYY-MM-DDTHH:mm (EXACT DATE/TIME)
  description: string; // Ex: "Excesso de Velocidade"
  code?: string; // Código de enquadramento
  points: number;
  value: number;
  location: string;
  status: 'pendente' | 'pago' | 'recorrendo';
  driverId: string | null; // Auto-identified or manual ID
  identificationStatus: 'pendente' | 'identificado' | 'nao_se_aplica';
}

export interface FuelLog {
  id: string;
  vehicleId: string;
  date: string; // YYYY-MM-DD
  liters: number;
  cost: number;
  odometer: number;
  fuelType: 'gasolina' | 'etanol' | 'diesel' | 'gnv';
}

export interface CompanySettings {
  razaoSocial: string;
  cnpj: string;
  nomeFantasia?: string;
  inscricaoEstadual?: string;
  telefone?: string;
  email?: string;
  endereco?: string;
}


