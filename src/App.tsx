/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Car, 
  Users, 
  Clock, 
  Wrench, 
  ShieldAlert, 
  LayoutDashboard,
  Calendar,
  Layers,
  Database,
  ArrowDownToLine,
  ArrowUpToLine,
  RefreshCw,
  Info,
  Building2,
  User
} from 'lucide-react';
import { Vehicle, Driver, TripLog, Maintenance, Fine, FuelLog, CompanySettings } from './types';
import { 
  initialVehicles, 
  initialDrivers, 
  initialTripLogs, 
  initialMaintenances, 
  initialFines 
} from './mockData';

// Tabs
import { Dashboard } from './components/Dashboard';
import { VehiclesTab } from './components/VehiclesTab';
import { DriversTab } from './components/DriversTab';
import { TripsTab } from './components/TripsTab';
import { MaintenanceTab } from './components/MaintenanceTab';
import { FinesTab } from './components/FinesTab';

// Google Drive Sync
import { GoogleDriveSync, updateDriveFile } from './components/GoogleDriveSync';

// Login Portal
import { LoginPortal } from './components/LoginPortal';

// Logo Asset
import profrotaLogo from '../assets/profrota_logo.png';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');

  // Core State
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [trips, setTrips] = useState<TripLog[]>([]);
  const [maintenances, setMaintenances] = useState<Maintenance[]>([]);
  const [fines, setFines] = useState<Fine[]>([]);
  const [fuelLogs, setFuelLogs] = useState<FuelLog[]>([]);

  // Google Drive State
  const [isDriveConnected, setIsDriveConnected] = useState(false);
  const [driveSyncState, setDriveSyncState] = useState({
    status: 'unconfigured',
    lastSync: null,
    errorMessage: undefined,
    userEmail: undefined,
    userPicture: undefined
  });

  // User & Session State
  const [users, setUsers] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [currentRole, setCurrentRole] = useState<'Administrador' | 'Operador'>('Administrador');

  // Helper to retrieve current app data in unified JSON format
  const getCurrentAppData = () => {
    return {
      vehicles,
      drivers,
      trips,
      maintenances,
      fines,
      fuelLogs,
      company,
      users
    };
  };

  // Helper to overwrite current app data with sync data from cloud
  const handleApplyCloudData = (data: any) => {
    if (!data) return;
    if (data.vehicles) {
      setVehicles(data.vehicles);
      localStorage.setItem('cnpj_vehicles', JSON.stringify(data.vehicles));
    }
    if (data.drivers) {
      setDrivers(data.drivers);
      localStorage.setItem('cnpj_drivers', JSON.stringify(data.drivers));
    }
    if (data.trips) {
      setTrips(data.trips);
      localStorage.setItem('cnpj_trips', JSON.stringify(data.trips));
    }
    if (data.maintenances) {
      setMaintenances(data.maintenances);
      localStorage.setItem('cnpj_maintenances', JSON.stringify(data.maintenances));
    }
    if (data.fines) {
      setFines(data.fines);
      localStorage.setItem('cnpj_fines', JSON.stringify(data.fines));
    }
    if (data.fuelLogs) {
      setFuelLogs(data.fuelLogs);
      localStorage.setItem('cnpj_fuel_logs', JSON.stringify(data.fuelLogs));
    }
    if (data.company) {
      setCompany(data.company);
      localStorage.setItem('cnpj_company_info', JSON.stringify(data.company));
    }
    if (data.users) {
      setUsers(data.users);
      localStorage.setItem('cnpj_users', JSON.stringify(data.users));
    }
  };

  const handleLoginSuccess = (usr: string, r: 'Administrador' | 'Operador') => {
    setCurrentUser(usr);
    setCurrentRole(r);
    localStorage.setItem('cnpj_session_user', usr);
    localStorage.setItem('cnpj_session_role', r);
  };

  const handleLogoff = () => {
    setCurrentUser(null);
    localStorage.removeItem('cnpj_session_user');
    localStorage.removeItem('cnpj_session_role');
    alert('Logoff efetuado com sucesso.');
  };

  const handleRegisterUser = (
    usr: string, 
    passwordHash: string, 
    r: 'Administrador' | 'Operador',
    securityQuestion: string,
    securityAnswerHash: string
  ) => {
    const newUser = { username: usr, passwordHash, role: r, securityQuestion, securityAnswerHash };
    const updated = [...users, newUser];
    syncAndSave('cnpj_users', updated, setUsers);
  };

  const handleUpdateUserPassword = (username: string, newPasswordHash: string) => {
    const updatedUsers = users.map(u => 
      u.username.toLowerCase() === username.toLowerCase() 
        ? { ...u, passwordHash: newPasswordHash, password: undefined } 
        : u
    );
    syncAndSave('cnpj_users', updatedUsers, setUsers);
  };

  // Account Settings Modal State
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [newAccUsername, setNewAccUsername] = useState('');
  const [currAccPassword, setCurrAccPassword] = useState('');
  const [newAccPassword, setNewAccPassword] = useState('');
  const [confirmAccPassword, setConfirmAccPassword] = useState('');

  const handleOpenAccountModal = () => {
    setNewAccUsername(currentUser || '');
    setCurrAccPassword('');
    setNewAccPassword('');
    setConfirmAccPassword('');
    setShowAccountModal(true);
  };

  const handleChangeAccountInfo = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Find current user object
    const userIndex = users.findIndex(u => u.username.toLowerCase() === currentUser?.toLowerCase());
    if (userIndex === -1) return;

    const userObj = users[userIndex];
    
    // Verify password
    const currentHash = btoa(currAccPassword);
    if (userObj.passwordHash !== currentHash && userObj.password !== currAccPassword) {
      alert('Senha atual incorreta.');
      return;
    }

    let updatedUsername = currentUser || '';
    let updatedUsers = [...users];

    // 1. Change Username
    if (newAccUsername.trim() && newAccUsername.trim().toLowerCase() !== currentUser?.toLowerCase()) {
      const targetName = newAccUsername.trim().toLowerCase();
      const isTaken = users.some((u, idx) => idx !== userIndex && u.username.toLowerCase() === targetName);
      if (isTaken) {
        alert('Este nome de usuário já está em uso.');
        return;
      }
      updatedUsername = targetName;
      updatedUsers[userIndex].username = targetName;
    }

    // 2. Change Password
    if (newAccPassword) {
      if (newAccPassword !== confirmAccPassword) {
        alert('As novas senhas não coincidem.');
        return;
      }
      if (newAccPassword.length < 4) {
        alert('A nova senha deve conter no mínimo 4 caracteres.');
        return;
      }
      updatedUsers[userIndex].passwordHash = btoa(newAccPassword);
      // Remove legacy plain-text password if present
      delete updatedUsers[userIndex].password;
    }

    // Save states
    syncAndSave('cnpj_users', updatedUsers, setUsers);
    
    // Update session
    setCurrentUser(updatedUsername);
    localStorage.setItem('cnpj_session_user', updatedUsername);

    setCurrAccPassword('');
    setNewAccPassword('');
    setConfirmAccPassword('');
    setShowAccountModal(false);

    alert('Dados da conta atualizados com sucesso!');
  };

  // Company State Definition
  const [company, setCompany] = useState<CompanySettings>({
    razaoSocial: 'Transportes Silva LTDA',
    cnpj: '14.288.921/0001-44',
    nomeFantasia: 'Silva Transportes',
    inscricaoEstadual: '987.654.321.110',
    telefone: '(11) 98765-4321',
    email: 'contato@transportessilva.com.br',
    endereco: 'Av. Paulista, 1000 - Bela Vista, São Paulo - SP'
  });
  const [showCompanyModal, setShowCompanyModal] = useState(false);

  // Intermediate Company Modal Inputs For Editing / Registration
  const [compRazao, setCompRazao] = useState('');
  const [compCnpj, setCompCnpj] = useState('');
  const [compFantasia, setCompFantasia] = useState('');
  const [compInscEst, setCompInscEst] = useState('');
  const [compTel, setCompTel] = useState('');
  const [compEmail, setCompEmail] = useState('');
  const [compEnd, setCompEnd] = useState('');

  const handleOpenCompanyEdit = () => {
    setCompRazao(company.razaoSocial);
    setCompCnpj(company.cnpj);
    setCompFantasia(company.nomeFantasia || '');
    setCompInscEst(company.inscricaoEstadual || '');
    setCompTel(company.telefone || '');
    setCompEmail(company.email || '');
    setCompEnd(company.endereco || '');
    setShowCompanyModal(true);
  };

  const handleSaveCompanyInfo = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: CompanySettings = {
      razaoSocial: compRazao,
      cnpj: compCnpj,
      nomeFantasia: compFantasia,
      inscricaoEstadual: compInscEst,
      telefone: compTel,
      email: compEmail,
      endereco: compEnd,
    };
    syncAndSave('cnpj_company_info', updated, setCompany);
    setShowCompanyModal(false);
    alert('Dados cadastrais da empresa atualizados com sucesso!');
  };

  // Show import/export notification
  const [showDbNotice, setShowDbNotice] = useState(false);

  // Load state from localStorage on mount
  useEffect(() => {
    const savedVehicles = localStorage.getItem('cnpj_vehicles');
    const savedDrivers = localStorage.getItem('cnpj_drivers');
    const savedTrips = localStorage.getItem('cnpj_trips');
    const savedMaintenances = localStorage.getItem('cnpj_maintenances');
    const savedFines = localStorage.getItem('cnpj_fines');
    const savedFuel = localStorage.getItem('cnpj_fuel_logs');
    const savedCompanyInfo = localStorage.getItem('cnpj_company_info');

    if (savedVehicles) {
      setVehicles(JSON.parse(savedVehicles));
    } else {
      setVehicles(initialVehicles);
      localStorage.setItem('cnpj_vehicles', JSON.stringify(initialVehicles));
    }

    if (savedDrivers) {
      setDrivers(JSON.parse(savedDrivers));
    } else {
      setDrivers(initialDrivers);
      localStorage.setItem('cnpj_drivers', JSON.stringify(initialDrivers));
    }

    if (savedTrips) {
      setTrips(JSON.parse(savedTrips));
    } else {
      setTrips(initialTripLogs);
      localStorage.setItem('cnpj_trips', JSON.stringify(initialTripLogs));
    }

    if (savedMaintenances) {
      setMaintenances(JSON.parse(savedMaintenances));
    } else {
      setMaintenances(initialMaintenances);
      localStorage.setItem('cnpj_maintenances', JSON.stringify(initialMaintenances));
    }

    if (savedFines) {
      setFines(JSON.parse(savedFines));
    } else {
      setFines(initialFines);
      localStorage.setItem('cnpj_fines', JSON.stringify(initialFines));
    }

    if (savedFuel) {
      setFuelLogs(JSON.parse(savedFuel));
    } else {
      const initialFuelLogs: FuelLog[] = [
        { id: 'fl-1', vehicleId: 'v-1', date: '2026-05-18', liters: 45, cost: 250.20, odometer: 154300, fuelType: 'diesel' },
        { id: 'fl-2', vehicleId: 'v-2', date: '2026-05-20', liters: 32, cost: 185.60, odometer: 88400, fuelType: 'gasolina' },
        { id: 'fl-3', vehicleId: 'v-3', date: '2026-05-22', liters: 40, cost: 220.00, odometer: 124300, fuelType: 'etanol' },
      ];
      setFuelLogs(initialFuelLogs);
      localStorage.setItem('cnpj_fuel_logs', JSON.stringify(initialFuelLogs));
    }

    if (savedCompanyInfo) {
      setCompany(JSON.parse(savedCompanyInfo));
    }

    const savedUsers = localStorage.getItem('cnpj_users');
    const savedSessionUser = localStorage.getItem('cnpj_session_user');
    const savedSessionRole = localStorage.getItem('cnpj_session_role');

    if (savedUsers) {
      setUsers(JSON.parse(savedUsers));
    } else {
      // Seed default admin
      const initialUsers = [{ username: 'admin', passwordHash: btoa('admin'), role: 'Administrador' }];
      setUsers(initialUsers);
      localStorage.setItem('cnpj_users', JSON.stringify(initialUsers));
    }

    if (savedSessionUser && savedSessionRole) {
      setCurrentUser(savedSessionUser);
      setCurrentRole(savedSessionRole as 'Administrador' | 'Operador');
    }
  }, []);

  // Sync state to localstorage helper
  const syncAndSave = (key: string, data: any, setter: Function) => {
    setter(data);
    localStorage.setItem(key, JSON.stringify(data));
    
    // Se o Google Drive estiver conectado, envia as alterações
    if (localStorage.getItem('gdrive_access_token') && localStorage.getItem('gdrive_file_id')) {
      const latestPayload = {
        vehicles: key === 'cnpj_vehicles' ? data : vehicles,
        drivers: key === 'cnpj_drivers' ? data : drivers,
        trips: key === 'cnpj_trips' ? data : trips,
        maintenances: key === 'cnpj_maintenances' ? data : maintenances,
        fines: key === 'cnpj_fines' ? data : fines,
        fuelLogs: key === 'cnpj_fuel_logs' ? data : fuelLogs,
        company: key === 'cnpj_company_info' ? data : company,
        users: key === 'cnpj_users' ? data : users, // INCLUDE USERS!
      };
      
      // Envio em segundo plano
      const token = localStorage.getItem('gdrive_access_token');
      const fileId = localStorage.getItem('gdrive_file_id');
      if (token && fileId) {
        updateDriveFile(token, fileId, latestPayload).then(() => {
          setDriveSyncState((prev: any) => ({
            ...prev,
            status: 'connected',
            lastSync: new Date().toLocaleTimeString('pt-BR'),
            errorMessage: undefined
          }));
        }).catch((err: any) => {
          console.error('Erro na sincronização em background:', err);
        });
      }
    }
  };

  // 1. Vehicle Operations
  const handleAddVehicle = (newV: Omit<Vehicle, 'id'>) => {
    const vehicleWithId: Vehicle = {
      ...newV,
      id: `v-${Date.now()}`
    };
    const updated = [...vehicles, vehicleWithId];
    syncAndSave('cnpj_vehicles', updated, setVehicles);
  };

  const handleEditVehicle = (id: string, updatedFields: Partial<Vehicle>) => {
    const updated = vehicles.map(v => v.id === id ? { ...v, ...updatedFields } : v);
    syncAndSave('cnpj_vehicles', updated, setVehicles);
  };

  const handleDeleteVehicle = (id: string) => {
    const updated = vehicles.filter(v => v.id !== id);
    syncAndSave('cnpj_vehicles', updated, setVehicles);
    // Cascade remove logs for that vehicle
    const updatedTrips = trips.filter(t => t.vehicleId !== id);
    syncAndSave('cnpj_trips', updatedTrips, setTrips);
    const updatedMaint = maintenances.filter(m => m.vehicleId !== id);
    syncAndSave('cnpj_maintenances', updatedMaint, setMaintenances);
    const updatedFines = fines.filter(f => f.vehicleId !== id);
    syncAndSave('cnpj_fines', updatedFines, setFines);
  };

  // 2. Driver Operations
  const handleAddDriver = (newD: Omit<Driver, 'id'>) => {
    const driverWithId: Driver = {
      ...newD,
      id: `d-${Date.now()}`
    };
    const updated = [...drivers, driverWithId];
    syncAndSave('cnpj_drivers', updated, setDrivers);
  };

  const handleEditDriver = (id: string, updatedFields: Partial<Driver>) => {
    const updated = drivers.map(d => d.id === id ? { ...d, ...updatedFields } : d);
    syncAndSave('cnpj_drivers', updated, setDrivers);
  };

  const handleDeleteDriver = (id: string) => {
    const updated = drivers.filter(d => d.id !== id);
    syncAndSave('cnpj_drivers', updated, setDrivers);
  };

  // 3. Trip / Usage Operations
  const handleStartTrip = (newTrip: Omit<TripLog, 'id' | 'endDateTime' | 'endOdometer'>) => {
    const tripWithId: TripLog = {
      ...newTrip,
      id: `t-${Date.now()}`,
      endDateTime: null,
      endOdometer: null,
    };
    const updated = [tripWithId, ...trips];
    syncAndSave('cnpj_trips', updated, setTrips);
  };

  const handleEndTrip = (id: string, endOdometer: number, endDateTime?: string) => {
    const defaultEndTime = endDateTime || '2026-05-26T18:00';
    
    // Find vehicle corresponding to trip
    const trip = trips.find(t => t.id === id);
    if (trip) {
      // Create clone of trip logs
      const updatedTrips = trips.map(t => {
        if (t.id === id) {
          return {
            ...t,
            endDateTime: defaultEndTime,
            endOdometer: endOdometer,
          };
        }
        return t;
      });
      syncAndSave('cnpj_trips', updatedTrips, setTrips);

      // Increment Odometer on vehicle
      const updatedVehicles = vehicles.map(v => {
        if (v.id === trip.vehicleId && endOdometer > v.currentOdometer) {
          return {
            ...v,
            currentOdometer: endOdometer,
          };
        }
        return v;
      });
      syncAndSave('cnpj_vehicles', updatedVehicles, setVehicles);
    }
  };

  const handleDeleteTrip = (id: string) => {
    const updated = trips.filter(t => t.id !== id);
    syncAndSave('cnpj_trips', updated, setTrips);
  };

  // 4. Maintenance Operations
  const handleAddMaintenance = (newM: Omit<Maintenance, 'id'>) => {
    const maintWithId: Maintenance = {
      ...newM,
      id: `m-${Date.now()}`
    };
    const updated = [maintWithId, ...maintenances];
    syncAndSave('cnpj_maintenances', updated, setMaintenances);

    // If completed and odometer is higher than vehicle's current odometer, update vehicle current odometer
    if (newM.status === 'concluida') {
      const updatedVehicles = vehicles.map(v => {
        if (v.id === newM.vehicleId && newM.odometer > v.currentOdometer) {
          return {
            ...v,
            currentOdometer: newM.odometer,
          };
        }
        return v;
      });
      syncAndSave('cnpj_vehicles', updatedVehicles, setVehicles);
    }
  };

  const handleEditMaintenance = (id: string, updatedFields: Partial<Maintenance>) => {
    const targetM = maintenances.find(m => m.id === id);
    const updated = maintenances.map(m => m.id === id ? { ...m, ...updatedFields } : m);
    syncAndSave('cnpj_maintenances', updated, setMaintenances);

    // If marking as completed, update odometer of vehicle
    if (targetM && updatedFields.status === 'concluida') {
      const updatedVehicles = vehicles.map(v => {
        if (v.id === targetM.vehicleId && targetM.odometer > v.currentOdometer) {
          return {
            ...v,
            currentOdometer: targetM.odometer,
          };
        }
        return v;
      });
      syncAndSave('cnpj_vehicles', updatedVehicles, setVehicles);
    }
  };

  const handleDeleteMaintenance = (id: string) => {
    const updated = maintenances.filter(m => m.id !== id);
    syncAndSave('cnpj_maintenances', updated, setMaintenances);
  };

  // 5. Fine / Multas Operations
  const handleAddFine = (newF: Omit<Fine, 'id'>) => {
    const fineWithId: Fine = {
      ...newF,
      id: `f-${Date.now()}`
    };
    const updated = [fineWithId, ...fines];
    syncAndSave('cnpj_fines', updated, setFines);
  };

  const handleLinkDriverToFine = (fineId: string, driverId: string) => {
    const updated = fines.map(f => {
      if (f.id === fineId) {
        return {
          ...f,
          driverId: driverId || null,
          identificationStatus: driverId ? ('identificado' as const) : ('pendente' as const),
        };
      }
      return f;
    });
    syncAndSave('cnpj_fines', updated, setFines);
  };

  const handleDeleteFine = (id: string) => {
    const updated = fines.filter(f => f.id !== id);
    syncAndSave('cnpj_fines', updated, setFines);
  };

  const handleUpdateFineStatus = (id: string, status: 'pendente' | 'pago' | 'recorrendo') => {
    const updated = fines.map(f => f.id === id ? { ...f, status } : f);
    syncAndSave('cnpj_fines', updated, setFines);
  };

  // Fuel Logs handlers
  const handleAddFuelLog = (newLog: Omit<FuelLog, 'id'>) => {
    const logWithId: FuelLog = {
      ...newLog,
      id: `fl-${Date.now()}`
    };
    const updated = [logWithId, ...fuelLogs];
    syncAndSave('cnpj_fuel_logs', updated, setFuelLogs);

    // Auto-update vehicle odometer
    const targetVehicle = vehicles.find(v => v.id === newLog.vehicleId);
    if (targetVehicle && newLog.odometer > targetVehicle.currentOdometer) {
      const updatedVehicles = vehicles.map(v => 
        v.id === newLog.vehicleId ? { ...v, currentOdometer: newLog.odometer } : v
      );
      syncAndSave('cnpj_vehicles', updatedVehicles, setVehicles);
    }
  };

  const handleDeleteFuelLog = (id: string) => {
    const updated = fuelLogs.filter(f => f.id !== id);
    syncAndSave('cnpj_fuel_logs', updated, setFuelLogs);
  };

  // Database Backup Actions: Export and Import
  const handleExportDatabase = () => {
    const dbPayload = {
      vehicles,
      drivers,
      trips,
      maintenances,
      fines
    };
    
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(dbPayload, null, 2)
    )}`;
    
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', jsonString);
    downloadAnchor.setAttribute('download', `copia-seguranca-veiculos-cnpj-${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportDatabase = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    const targetFile = e.target.files?.[0];
    if (!targetFile) return;

    fileReader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.vehicles && parsed.drivers && parsed.trips && parsed.maintenances && parsed.fines) {
          syncAndSave('cnpj_vehicles', parsed.vehicles, setVehicles);
          syncAndSave('cnpj_drivers', parsed.drivers, setDrivers);
          syncAndSave('cnpj_trips', parsed.trips, setTrips);
          syncAndSave('cnpj_maintenances', parsed.maintenances, setMaintenances);
          syncAndSave('cnpj_fines', parsed.fines, setFines);
          alert('Base de dados restaurada com total sucesso!');
        } else {
          alert('Estrutura do arquivo JSON inválida. Certifique-se de usar um dump exportado do app.');
        }
      } catch (err) {
        alert('Erro ao processar o arquivo. Certifique-se de que é um JSON válido.');
      }
    };
    fileReader.readAsText(targetFile);
  };

  const handleResetToDefaults = () => {
    if (confirm('Atenção: Isso irá apagar any mudanças customizadas e restaurará o banco com as 3 placas de demonstração clássicas. Continuar?')) {
      syncAndSave('cnpj_vehicles', initialVehicles, setVehicles);
      syncAndSave('cnpj_drivers', initialDrivers, setDrivers);
      syncAndSave('cnpj_trips', initialTripLogs, setTrips);
      syncAndSave('cnpj_maintenances', initialMaintenances, setMaintenances);
      syncAndSave('cnpj_fines', initialFines, setFines);
      alert('Banco resetado para as demonstrações originais.');
    }
  };

  const navigateToTab = (tab: string) => {
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (!currentUser) {
    return (
      <LoginPortal 
        onLoginSuccess={handleLoginSuccess}
        existingUsers={users}
        onRegisterUser={handleRegisterUser}
        onUpdateUserPassword={handleUpdateUserPassword}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col lg:flex-row font-sans antialiased text-slate-800" id="main-app-root">
      
      {/* Desktop Sidebar Navigation */}
      <nav className="hidden lg:flex lg:w-64 bg-slate-900 text-slate-250 flex-col shrink-0 border-r border-slate-800" id="desktop-sidebar">
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-slate-800 flex items-center justify-center text-white shadow-md overflow-hidden shrink-0 border border-slate-700 shadow-blue-950/40">
              <img src={profrotaLogo} alt="ProFrota Logo" className="w-full h-full object-cover scale-110" />
            </div>
            <div>
              <span className="font-extrabold text-base tracking-tight text-white block uppercase">PROFROTA</span>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Gestão CNPJ</p>
            </div>
          </div>
        </div>
        
        <div className="flex-1 py-6 overflow-y-auto px-4 space-y-6">
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2.5 px-2">Geral</p>
            <div className="space-y-1">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-md justify-start transition-all cursor-pointer text-sm font-medium ${
                  activeTab === 'dashboard'
                    ? 'bg-blue-600 text-white font-semibold'
                    : 'text-slate-400 hover:text-white hover:bg-slate-850'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Dashboard</span>
              </button>
              
              <button
                onClick={() => setActiveTab('veiculos')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-md justify-start transition-all cursor-pointer text-sm font-medium ${
                  activeTab === 'veiculos'
                    ? 'bg-blue-600 text-white font-semibold'
                    : 'text-slate-400 hover:text-white hover:bg-slate-850'
                }`}
              >
                <Car className="w-4 h-4" />
                <span>Frota de Veículos</span>
              </button>
              
              <button
                onClick={() => setActiveTab('motoristas')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-md justify-start transition-all cursor-pointer text-sm font-medium ${
                  activeTab === 'motoristas'
                    ? 'bg-blue-600 text-white font-semibold'
                    : 'text-slate-400 hover:text-white hover:bg-slate-850'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>Escala Motoristas</span>
              </button>
              
              <button
                onClick={() => setActiveTab('viagens')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-md justify-start transition-all cursor-pointer text-sm font-medium ${
                  activeTab === 'viagens'
                    ? 'bg-blue-600 text-white font-semibold'
                    : 'text-slate-400 hover:text-white hover:bg-slate-850'
                }`}
              >
                <Clock className="w-4 h-4" />
                <span>Controle de Saídas</span>
              </button>
            </div>
          </div>
          
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2.5 px-2">Obrigações</p>
            <div className="space-y-1">
              <button
                onClick={() => setActiveTab('manutencoes')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-md justify-start transition-all cursor-pointer text-sm font-medium ${
                  activeTab === 'manutencoes'
                    ? 'bg-blue-600 text-white font-semibold'
                    : 'text-slate-400 hover:text-white hover:bg-slate-850'
                }`}
              >
                <Wrench className="w-4 h-4" />
                <span>Manutenção Preventiva</span>
              </button>
              
              <button
                onClick={() => setActiveTab('multas')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-md transition-all cursor-pointer text-sm font-medium ${
                  activeTab === 'multas'
                    ? 'bg-blue-600 text-white font-semibold'
                    : 'text-slate-400 hover:text-white hover:bg-slate-850'
                }`}
              >
                <div className="flex items-center gap-3">
                  <ShieldAlert className="w-4 h-4" />
                  <span>Multas e Condutores</span>
                </div>
                {fines.filter(f => !f.driverId).length > 0 && (
                  <span className="bg-red-500 text-white font-black text-[9px] px-1.5 py-0.5 rounded-full animate-pulse">
                    {fines.filter(f => !f.driverId).length}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
        
        {/* Operator Profile Card and Logoff button */}
        <div className="p-4 bg-slate-900 border-t border-slate-850 space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-black text-white uppercase border border-indigo-500 shrink-0">
              {currentUser ? currentUser[0].toUpperCase() : 'U'}
            </div>
            <div className="overflow-hidden flex-1">
              <span className="text-xs font-bold text-white block truncate leading-none">
                👤 {currentUser}
              </span>
              <span className="text-[9px] font-extrabold text-indigo-400 bg-indigo-950/40 px-1 py-0.5 rounded leading-none mt-1 inline-block border border-indigo-900/30 uppercase">
                🛡️ {currentRole}
              </span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleOpenAccountModal}
              className="flex items-center justify-center gap-1 py-2 px-1 bg-slate-800 hover:bg-slate-700 text-[10px] font-bold tracking-wide text-slate-200 border border-slate-700 rounded-lg cursor-pointer transition-all"
            >
              ⚙️ Minha Conta
            </button>
            
            <button
              onClick={handleLogoff}
              className="flex items-center justify-center gap-1 py-2 px-1 bg-rose-950/30 hover:bg-rose-900/40 text-[10px] font-bold tracking-wide text-rose-450 border border-rose-900/30 transition-all rounded-lg cursor-pointer"
            >
              🚪 Sair (Logoff)
            </button>
          </div>
        </div>

        <div className="p-4 bg-slate-950 border-t border-slate-850 flex flex-col gap-3">
          {currentRole === 'Administrador' && (
            <button
              onClick={() => setShowDbNotice(!showDbNotice)}
              className="w-full flex items-center justify-center gap-1.5 py-2 px-2 bg-slate-900 hover:bg-slate-850 text-[10px] font-bold tracking-wide text-slate-350 border border-slate-800 hover:border-slate-705 transition-all rounded-lg cursor-pointer"
            >
              <Database size={13} className="text-blue-500" />
              <span>Configurações DB</span>
            </button>
          )}
          
          <button
            onClick={handleOpenCompanyEdit}
            type="button"
            className="w-full flex items-center gap-3 px-1.5 py-1.5 rounded-lg hover:bg-slate-850/60 text-left transition-all cursor-pointer border border-transparent hover:border-slate-800 group"
            title="Clique para cadastrar ou editar os dados da empresa"
          >
            <div className="w-8 h-8 rounded bg-slate-800 flex items-center justify-center text-[10px] font-black text-blue-450 border border-slate-700 shrink-0 uppercase group-hover:text-blue-300">
              {company.razaoSocial ? company.razaoSocial.split(' ').map((w: string) => w[0]).slice(0, 2).join('') : 'EM'}
            </div>
            <div className="overflow-hidden flex-1">
              <div className="flex items-center justify-between gap-1">
                <span className="text-xs font-bold text-white truncate group-hover:text-blue-400 transition-colors">{company.razaoSocial}</span>
                <span className="text-[8px] font-extrabold text-slate-400 bg-slate-800 px-1 py-0.5 rounded leading-none shrink-0 uppercase">Editar</span>
              </div>
              <p className="text-[10px] text-slate-500 font-bold block mt-1 leading-none truncate font-mono">CNPJ: {company.cnpj}</p>
            </div>
          </button>
        </div>
      </nav>

      {/* Main content frame */}
      <div className="flex-1 flex flex-col min-w-0" id="main-content-flow">
        
        {/* Top bar header */}
        <header className="bg-white border-b border-slate-200 sticky top-0 z-30" id="app-header">
          {/* Brand/Identity top header row */}
          <div className="px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between flex-wrap gap-2">
            <div>
              {/* Mobile Branding block */}
              <div className="flex items-center gap-2 lg:hidden">
                <div className="w-7 h-7 rounded bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center">
                  <img src={profrotaLogo} alt="ProFrota Logo" className="w-full h-full object-cover scale-110" />
                </div>
                <div>
                  <span className="font-extrabold text-sm tracking-tight text-slate-900 uppercase">PROFROTA</span>
                  <p className="text-[8px] text-slate-405 font-bold uppercase tracking-wider">Gestão CNPJ</p>
                </div>
              </div>
              
              {/* Desktop Dashboard title group */}
              <div className="hidden lg:block">
                <h2 className="text-lg font-extrabold text-slate-900 tracking-tight leading-none">
                  {activeTab === 'dashboard' && 'Visão Geral / Painel de Frota'}
                  {activeTab === 'veiculos' && 'Gerenciamento de Veículos da Frota'}
                  {activeTab === 'motoristas' && 'Grade de Motoristas e Escala'}
                  {activeTab === 'viagens' && 'Controle de Saídas & Diário de Bordo'}
                  {activeTab === 'manutencoes' && 'Agendas de Manutenção Preventiva'}
                  {activeTab === 'multas' && 'Central de Identificação de Multas CNPJ'}
                </h2>
                <p className="text-[11px] text-slate-500 font-medium mt-1">Controle e rastreabilidade total de infrações, quilometragem e auditoria</p>
              </div>
            </div>

            {/* Topbar badges */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-100 rounded-lg text-[11px] text-slate-600 font-bold font-mono border border-slate-200">
                <Calendar size={13} className="text-blue-600" />
                <span>26/05/2026 (Auditoria)</span>
              </div>
              
              <button
                onClick={() => setShowDbNotice(!showDbNotice)}
                className="p-1.5 border border-slate-200 hover:border-blue-550 hover:bg-slate-50 text-slate-600 hover:text-blue-600 transition-all rounded-lg cursor-pointer lg:hidden"
                title="Configurações DB"
              >
                <Database size={15} />
              </button>
            </div>
          </div>

          {/* Horizontally scrolling tab navigation on Mobile/Tablets */}
          <div className="lg:hidden border-t border-slate-100 px-4 py-2 bg-slate-50 overflow-x-auto scrollbar-none flex gap-1">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'dashboard'
                  ? 'bg-blue-600 text-white font-extrabold shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <LayoutDashboard size={13} />
              <span>Geral</span>
            </button>
            
            <button
              onClick={() => setActiveTab('veiculos')}
              className={`flex items-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'veiculos'
                  ? 'bg-blue-600 text-white font-extrabold shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Car size={13} />
              <span>Frota</span>
            </button>

            <button
              onClick={() => setActiveTab('motoristas')}
              className={`flex items-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'motoristas'
                  ? 'bg-blue-600 text-white font-extrabold shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Users size={13} />
              <span>Condutores</span>
            </button>

            <button
              onClick={() => setActiveTab('viagens')}
              className={`flex items-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'viagens'
                  ? 'bg-blue-600 text-white font-extrabold shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Clock size={13} />
              <span>Saídas</span>
            </button>

            <button
              onClick={() => setActiveTab('manutencoes')}
              className={`flex items-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'manutencoes'
                  ? 'bg-blue-600 text-white font-extrabold shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Wrench size={13} />
              <span>Oficina</span>
            </button>

            <button
              onClick={() => setActiveTab('multas')}
              className={`flex items-center gap-1.5 py-1.5 px-3 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === 'multas'
                  ? 'bg-blue-600 text-white font-extrabold shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <ShieldAlert size={13} />
              <span>Multas CNPJ</span>
              {fines.filter(f => !f.driverId).length > 0 && (
                <span className="bg-red-500 text-white font-black text-[8px] px-1 py-0.5 rounded-full">
                  {fines.filter(f => !f.driverId).length}
                </span>
              )}
            </button>
          </div>
        </header>

        {/* Database notice / Settings Bar */}
        {showDbNotice && (
          <div className="bg-slate-950 text-white border-b border-slate-850 py-3 px-4 sm:px-6 lg:px-8 animate-fade-in md:flex md:items-center md:justify-between gap-4" id="db-panel">
            <p className="flex items-center gap-2 text-xs md:text-[13px] text-slate-300 font-medium mb-3 md:mb-0">
              <Info size={15} className="text-blue-500 shrink-0" />
              <span>Gravação offline ativa. Suas informações são guardadas com segurança no navegador.</span>
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleExportDatabase}
                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg flex items-center gap-1 text-xs transition-all cursor-pointer font-bold border border-slate-800"
              >
                <ArrowDownToLine size={13} /> Exportar Banco (JSON)
              </button>

              <button
                onClick={handleOpenCompanyEdit}
                type="button"
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-1 text-xs transition-all cursor-pointer font-bold border border-blue-705 shrink-0"
              >
                <Building2 size={13} /> Dados da Empresa
              </button>
              
              <label 
                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg flex items-center gap-1 text-xs transition-all cursor-pointer font-bold border border-slate-800"
              >
                <ArrowUpToLine size={13} /> Importar Banco
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportDatabase}
                  className="hidden"
                />
              </label>

              <button
                onClick={handleResetToDefaults}
                className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg flex items-center gap-1 text-xs transition-all cursor-pointer font-bold"
              >
                <RefreshCw size={12} /> Resetar Padrão
              </button>
            </div>
          </div>
        )}

        {/* Primary Page Work Area */}
        <main className="flex-1 bg-slate-100 p-4 sm:p-6 lg:p-8" id="primary-main-view">
          <div className="mx-auto max-w-7xl">
            
            <GoogleDriveSync 
              onSyncComplete={handleApplyCloudData}
              getCurrentData={getCurrentAppData}
              isConnected={isDriveConnected}
              setIsConnected={setIsDriveConnected}
              syncState={driveSyncState}
              setSyncState={setDriveSyncState}
            />

            {activeTab === 'dashboard' && (
              <Dashboard 
                vehicles={vehicles}
                drivers={drivers}
                trips={trips}
                maintenances={maintenances}
                fines={fines}
                fuelLogs={fuelLogs}
                company={company}
                onNavigate={navigateToTab}
                onEndTrip={handleEndTrip}
                onEditCompany={handleOpenCompanyEdit}
              />
            )}

            {activeTab === 'veiculos' && (
              <VehiclesTab 
                vehicles={vehicles}
                fuelLogs={fuelLogs}
                fines={fines}
                onAddVehicle={handleAddVehicle}
                onEditVehicle={handleEditVehicle}
                onDeleteVehicle={handleDeleteVehicle}
                onNavigateToTab={navigateToTab}
                onAddFuelLog={handleAddFuelLog}
                onDeleteFuelLog={handleDeleteFuelLog}
                onAddFine={handleAddFine}
                companyCnpj={company.cnpj}
              />
            )}

            {activeTab === 'motoristas' && (
              <DriversTab 
                drivers={drivers}
                trips={trips}
                onAddDriver={handleAddDriver}
                onEditDriver={handleEditDriver}
                onDeleteDriver={handleDeleteDriver}
              />
            )}

            {activeTab === 'viagens' && (
              <TripsTab 
                trips={trips}
                vehicles={vehicles}
                drivers={drivers}
                onStartTrip={handleStartTrip}
                onEndTrip={handleEndTrip}
                onDeleteTrip={handleDeleteTrip}
              />
            )}

            {activeTab === 'manutencoes' && (
              <MaintenanceTab 
                maintenances={maintenances}
                vehicles={vehicles}
                onAddMaintenance={handleAddMaintenance}
                onDeleteMaintenance={handleDeleteMaintenance}
                onEditMaintenance={handleEditMaintenance}
              />
            )}

            {activeTab === 'multas' && (
              <FinesTab 
                fines={fines}
                vehicles={vehicles}
                drivers={drivers}
                trips={trips}
                company={company}
                onAddFine={handleAddFine}
                onLinkDriver={handleLinkDriverToFine}
                onDeleteFine={handleDeleteFine}
                onUpdateFineStatus={handleUpdateFineStatus}
              />
            )}
          </div>
        </main>

        {/* Core system footer */}
        <footer className="bg-white border-t border-slate-200 py-6 text-center text-slate-400 text-xs font-normal" id="app-footer">
          <p>© 2026 FROTAMASTER - Controle de Veículos e Condutores CNPJ. Todos os direitos reservados.</p>
          <p className="text-[10px] mt-1 text-slate-350">Linha corporativa de privacidade máxima • Armazenamento local autogestão</p>
        </footer>

      </div>

      {showCompanyModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in" id="company-settings-modal">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                  <Building2 size={20} />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 leading-tight">Cadastrar e Editar Dados da Empresa</h3>
                  <p className="text-xs text-slate-500 font-medium">Os dados informados serão usados em relatórios e impressos de frota.</p>
                </div>
              </div>
              <button 
                onClick={() => setShowCompanyModal(false)}
                className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                type="button"
              >
                ✕
              </button>
            </div>

            {/* Form body */}
            <form onSubmit={handleSaveCompanyInfo} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Razão Social *</label>
                <input
                  type="text"
                  required
                  placeholder="Nome legal / Razão social da empresa"
                  value={compRazao}
                  onChange={(e) => setCompRazao(e.target.value)}
                  className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">CNPJ *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: 00.000.000/0001-00"
                    value={compCnpj}
                    onChange={(e) => setCompCnpj(e.target.value)}
                    className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Inscrição Estadual</label>
                  <input
                    type="text"
                    placeholder="Inscrição Estadual (IE)"
                    value={compInscEst}
                    onChange={(e) => setCompInscEst(e.target.value)}
                    className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Nome Fantasia</label>
                <input
                  type="text"
                  placeholder="Nome comercial (Opcional)"
                  value={compFantasia}
                  onChange={(e) => setCompFantasia(e.target.value)}
                  className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Telefone de Contato</label>
                  <input
                    type="text"
                    placeholder="Ex: (11) 98765-4321"
                    value={compTel}
                    onChange={(e) => setCompTel(e.target.value)}
                    className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">E-mail Corporativo</label>
                  <input
                    type="email"
                    placeholder="Ex: contato@empresa.com"
                    value={compEmail}
                    onChange={(e) => setCompEmail(e.target.value)}
                    className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Endereço Sede</label>
                <input
                  type="text"
                  placeholder="Rua, número, bairro, cidade - UF"
                  value={compEnd}
                  onChange={(e) => setCompEnd(e.target.value)}
                  className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              {/* Botões do rodapé */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowCompanyModal(false)}
                  className="h-10 px-4 bg-slate-100 hover:bg-slate-200 hover:text-slate-900 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="h-10 px-5 bg-indigo-650 hover:bg-slate-900 text-white text-xs font-black rounded-xl transition-all cursor-pointer"
                >
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAccountModal && (
        <div className="fixed inset-0 bg-slate-900/65 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in" id="account-settings-modal">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-md text-slate-100 overflow-hidden relative">
            <div className="p-6 border-b border-slate-850 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg">
                  <User size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white leading-tight">Configurações da Conta</h3>
                  <p className="text-[10px] text-slate-400 font-medium font-sans">Altere seu nome de usuário ou senha de acesso.</p>
                </div>
              </div>
              <button 
                onClick={() => setShowAccountModal(false)}
                className="text-slate-400 hover:text-white transition"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleChangeAccountInfo} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Nome de Usuário</label>
                <input
                  type="text"
                  required
                  value={newAccUsername}
                  onChange={(e) => setNewAccUsername(e.target.value)}
                  className="w-full h-10 px-3 bg-slate-950 border border-slate-800 rounded-xl text-xs font-semibold focus:outline-none focus:border-indigo-500 text-slate-200"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Nova Senha (Opcional)</label>
                <input
                  type="password"
                  placeholder="Deixe em branco para não alterar"
                  value={newAccPassword}
                  onChange={(e) => setNewAccPassword(e.target.value)}
                  className="w-full h-10 px-3 bg-slate-950 border border-slate-800 rounded-xl text-xs font-semibold focus:outline-none focus:border-indigo-500 text-slate-200"
                />
              </div>

              {newAccPassword && (
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Confirmar Nova Senha</label>
                  <input
                    type="password"
                    placeholder="Repita a nova senha"
                    value={confirmAccPassword}
                    onChange={(e) => setConfirmAccPassword(e.target.value)}
                    className="w-full h-10 px-3 bg-slate-950 border border-slate-800 rounded-xl text-xs font-semibold focus:outline-none focus:border-indigo-500 text-slate-200"
                  />
                </div>
              )}

              <div className="space-y-1 border-t border-slate-850 pt-3 mt-2">
                <label className="text-[10px] font-bold text-rose-400 uppercase tracking-wide">Senha Atual (Confirmação) *</label>
                <input
                  type="password"
                  required
                  placeholder="Confirme sua senha atual para salvar"
                  value={currAccPassword}
                  onChange={(e) => setCurrAccPassword(e.target.value)}
                  className="w-full h-10 px-3 bg-slate-950 border border-rose-900/40 rounded-xl text-xs font-semibold focus:outline-none focus:border-rose-500 text-slate-250"
                />
              </div>

              <div className="pt-4 border-t border-slate-850 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowAccountModal(false)}
                  className="h-10 px-4 bg-slate-800 hover:bg-slate-700 text-slate-350 text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="h-10 px-5 bg-indigo-650 hover:bg-slate-900 text-white text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
