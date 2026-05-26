/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Vehicle, Driver, TripLog, Maintenance, Fine } from './types';

export const initialVehicles: Vehicle[] = [
  {
    id: 'v1',
    brand: 'Chevrolet',
    model: 'Onix Hatch 1.0 Turbo',
    plate: 'QYX-9B42',
    year: 2021,
    currentOdometer: 45120,
    cnpj: '12.345.678/0001-99',
    renavam: '12345678901',
    chassi: '9BHXXXXXXXXXXXXXX',
    ipvaStatus: 'pago',
    ipvaDueDate: '2026-08-15',
    ipvaValue: 1650.00,
    licensingStatus: 'pago',
    licensingDueDate: '2026-08-15',
  },
  {
    id: 'v2',
    brand: 'Volkswagen',
    model: 'Gol 1.6 Trendline',
    plate: 'GOL-1234',
    year: 2019,
    currentOdometer: 82150,
    cnpj: '12.345.678/0001-99',
    renavam: '98765432101',
    chassi: '9BWXXXXXXXXXXXXXX',
    ipvaStatus: 'pago',
    ipvaDueDate: '2026-10-10',
    ipvaValue: 1210.00,
    licensingStatus: 'pendente',
    licensingDueDate: '2026-05-30', // Imminent alert!
  },
  {
    id: 'v3',
    brand: 'Ford',
    model: 'Ka SE 1.5 Sedan',
    plate: 'FKD-5678',
    year: 2018,
    currentOdometer: 112400,
    cnpj: '98.765.432/0001-00',
    renavam: '11223344556',
    chassi: '9BFXXXXXXXXXXXXXX',
    ipvaStatus: 'vencido', // Blocked / overdued alert!
    ipvaDueDate: '2026-04-10',
    ipvaValue: 1450.00,
    licensingStatus: 'vencido',
    licensingDueDate: '2026-04-10',
  }
];

export const initialDrivers: Driver[] = [
  {
    id: 'd1',
    name: 'Carlos Souza',
    cpf: '123.456.789-00',
    cnh: '987654321-0',
    cnhCategory: 'AB',
    cnhExpiry: '2028-10-15',
    phone: '(11) 98765-4321',
    active: true,
  },
  {
    id: 'd2',
    name: 'Mariana Costa',
    cpf: '456.789.123-11',
    cnh: '123456789-4',
    cnhCategory: 'B',
    cnhExpiry: '2026-04-10', // Expired CNH alert!
    phone: '(11) 99876-5432',
    active: true,
  },
  {
    id: 'd3',
    name: 'João Silva',
    cpf: '789.123.456-22',
    cnh: '456123789-9',
    cnhCategory: 'D',
    cnhExpiry: '2027-12-05',
    phone: '(11) 97654-3210',
    active: true,
  }
];

export const initialTripLogs: TripLog[] = [
  {
    id: 't1',
    vehicleId: 'v1',
    driverId: 'd1',
    startDateTime: '2026-05-20T08:00',
    startOdometer: 44200,
    endDateTime: '2026-05-20T18:00',
    endOdometer: 44350,
    purpose: 'Entrega de mercadorias no centro comercial',
  },
  {
    id: 't2',
    vehicleId: 'v1',
    driverId: 'd2',
    startDateTime: '2026-05-24T09:00', // Matches fine 1 (2026-05-24 at 11:45)
    startOdometer: 44350,
    endDateTime: '2026-05-24T16:30',
    endOdometer: 44500,
    purpose: 'Visita técnica a cliente em Campinas-SP',
  },
  {
    id: 't3',
    vehicleId: 'v2',
    driverId: 'd3',
    startDateTime: '2026-05-25T14:00', // Matches fine 2 (2026-05-25 at 15:30)
    startOdometer: 81900,
    endDateTime: '2026-05-25T19:30',
    endOdometer: 82050,
    purpose: 'Reunião de diretoria em Alphaville',
  },
  {
    id: 't4',
    vehicleId: 'v1',
    driverId: 'd1',
    startDateTime: '2026-05-26T08:00', // Out right now in our current mockup! (Active trip)
    startOdometer: 45010,
    endDateTime: null,
    endOdometer: null,
    purpose: 'Rotas de vendas e captação Zona Sul',
  }
];

export const initialMaintenances: Maintenance[] = [
  {
    id: 'm1',
    vehicleId: 'v1',
    description: 'Troca de Óleo do Motor 5W30 e Filtro de combustível',
    date: '2026-02-15',
    odometer: 40000,
    cost: 320.00,
    nextRecommendedOdometer: 50000, // Safe (has ~5000km left)
    nextRecommendedDate: '2026-08-15',
    status: 'concluida',
  },
  {
    id: 'm2',
    vehicleId: 'v2',
    description: 'Substituição das Pastilhas de Freio Dianteiras',
    date: '2025-11-10',
    odometer: 75000,
    cost: 450.00,
    nextRecommendedOdometer: 95000,
    nextRecommendedDate: '2026-11-10',
    status: 'concluida',
  },
  {
    id: 'm3',
    vehicleId: 'v2',
    description: 'Revisão Básica e Alinhamento/Balanceamento preventivo',
    date: '2026-05-12',
    odometer: 82100,
    cost: 380.00,
    nextRecommendedOdometer: 87100,
    nextRecommendedDate: '2026-11-12',
    status: 'concluida',
  },
  {
    id: 'm4',
    vehicleId: 'v3',
    description: 'Troca de Óleo e Filtro de Óleo',
    date: '2025-08-10',
    odometer: 102000,
    cost: 290.00,
    nextRecommendedOdometer: 112000, // OVERDUE ODOMETER ALERT! (Current is 112400)
    nextRecommendedDate: '2026-02-10', // OVERDUE DATE ALERT!
    status: 'concluida',
  },
  {
    id: 'm5',
    vehicleId: 'v3',
    description: 'Revisão da Suspensão e Amortecedores Dianteiros',
    date: '2026-06-12',
    odometer: 115000,
    cost: 1850.00,
    nextRecommendedOdometer: null,
    nextRecommendedDate: null,
    status: 'agendada',
  }
];

export const initialFines: Fine[] = [
  {
    id: 'f1',
    vehicleId: 'v1',
    fineDateTime: '2026-05-24T11:45', // Happened during t2 (Mariana Costa)
    description: 'Transitar em velocidade superior à máxima permitida em até 20%',
    code: '745-50',
    points: 4,
    value: 130.16,
    location: 'Rodovia dos Bandeirantes, Km 42 - Jundiaí/SP',
    status: 'pendente',
    driverId: null, // Starts unlinked to demonstrate automatic selection
    identificationStatus: 'pendente',
  },
  {
    id: 'f2',
    vehicleId: 'v2',
    fineDateTime: '2026-05-25T15:30', // Happened during t3 (João Silva)
    description: 'Avançar o sinal vermelho do semáforo ou o de parada obrigatória',
    code: '605-01',
    points: 7,
    value: 293.47,
    location: 'Av. Paulista, alt. 1500 - São Paulo/SP',
    status: 'pendente',
    driverId: null, // Stars unlinked
    identificationStatus: 'pendente',
  },
  {
    id: 'f3',
    vehicleId: 'v3',
    fineDateTime: '2026-05-10T10:00', // No trip log found for this exact window
    description: 'Estacionar o veículo em desacordo com as condições regulamentadas',
    code: '554-11',
    points: 5,
    value: 195.23,
    location: 'Rua Tabapuã, 850 - Itaim Bibi - São Paulo/SP',
    status: 'recorrendo',
    driverId: null,
    identificationStatus: 'pendente',
  }
];
