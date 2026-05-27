/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  Cloud, 
  CloudLightning, 
  CloudOff, 
  RefreshCw, 
  Database,
  CheckCircle2, 
  AlertCircle
} from 'lucide-react';
import { motion } from 'motion/react';

// Mantém export dummy de updateDriveFile para compatibilidade de imports no App.tsx
export const updateDriveFile = async (token: string, fileId: string, content: any): Promise<void> => {
  return Promise.resolve();
};

interface GoogleDriveSyncProps {
  onSyncComplete: (data: any) => void;
  getCurrentData: () => any;
  isConnected: boolean;
  setIsConnected: (val: boolean) => void;
  syncState: {
    status: 'unconfigured' | 'disconnected' | 'connecting' | 'connected' | 'error';
    lastSync: string | null;
    errorMessage?: string;
    userEmail?: string;
  };
  setSyncState: React.Dispatch<React.SetStateAction<any>>;
  compact?: boolean;
  isAdmin?: boolean;
}

export const GoogleDriveSync: React.FC<GoogleDriveSyncProps> = ({
  onSyncComplete,
  getCurrentData,
  isConnected,
  setIsConnected,
  syncState,
  setSyncState,
  compact = false,
  isAdmin = true,
}) => {

  // Força a sincronização lendo os dados da nuvem
  const handleForceSync = async () => {
    setSyncState((prev: any) => ({ ...prev, status: 'connecting' }));
    try {
      const response = await fetch('/api/db');
      if (response.ok) {
        const data = await response.json();
        if (data && (data.vehicles || data.drivers || data.trips)) {
          onSyncComplete(data);
          setSyncState({
            status: 'connected',
            lastSync: new Date().toLocaleTimeString('pt-BR'),
            errorMessage: undefined,
            userEmail: 'Conexão Cloud Ativa'
          });
          setIsConnected(true);
          alert('Dados atualizados da nuvem com sucesso! 🚀');
        } else {
          // Se estiver vazio, envia os dados atuais locais
          const localData = getCurrentData();
          await fetch('/api/db', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(localData)
          });
          setSyncState({
            status: 'connected',
            lastSync: new Date().toLocaleTimeString('pt-BR'),
            errorMessage: undefined,
            userEmail: 'Conexão Cloud Ativa'
          });
          setIsConnected(true);
          alert('Banco centralizado na nuvem inicializado com sucesso!');
        }
      } else {
        throw new Error('Falha na resposta do servidor');
      }
    } catch (err: any) {
      console.error('Erro na sincronização manual:', err);
      setSyncState((prev: any) => ({
        ...prev,
        status: 'error',
        errorMessage: 'Banco de dados KV não conectado no Vercel. Por favor, ative a aba Storage no painel.'
      }));
    }
  };

  return (
    <div className="bg-slate-950/60 border border-slate-850 rounded-xl p-3 text-slate-100 shadow-md">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-1.5 bg-slate-900 rounded-lg border border-slate-800 shrink-0">
            {syncState.status === 'connected' && (
              <motion.div animate={{ scale: [1, 1.08, 1] }} transition={{ duration: 3, repeat: Infinity }}>
                <Cloud className="w-4 h-4 text-emerald-400" />
              </motion.div>
            )}
            {syncState.status === 'connecting' && (
              <RefreshCw className="w-4 h-4 text-indigo-400 animate-spin" />
            )}
            {syncState.status === 'error' && (
              <CloudOff className="w-4 h-4 text-rose-500" />
            )}
            {(syncState.status === 'unconfigured' || syncState.status === 'disconnected') && (
              <CloudLightning className="w-4 h-4 text-amber-500 animate-pulse" />
            )}
          </div>
          <div className="min-w-0">
            <span className="text-[9px] font-bold text-slate-500 block leading-none uppercase">Banco Cloud</span>
            <span className="text-xs font-semibold text-white truncate block mt-0.5">
              {syncState.status === 'connected' && 'Nuvem Conectada'}
              {syncState.status === 'connecting' && 'Sincronizando...'}
              {syncState.status === 'error' && 'Erro de Conexão'}
              {(syncState.status === 'unconfigured' || syncState.status === 'disconnected') && 'Aguardando Banco'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={handleForceSync}
            disabled={syncState.status === 'connecting'}
            className="p-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-lg transition cursor-pointer disabled:opacity-40"
            title="Sincronizar dados agora"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncState.status === 'connecting' ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {syncState.status === 'connected' && (
        <div className="mt-2 text-[9px] text-slate-400 bg-slate-950/40 p-1.5 rounded-lg border border-slate-900/60 leading-normal flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
          <span>Centralizado e autônomo • Atualizado: {syncState.lastSync || 'agora'}</span>
        </div>
      )}

      {syncState.status === 'error' && (
        <div className="mt-2 p-1.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[9px] rounded-lg leading-normal flex items-start gap-1">
          <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold block">Conexão Pendente:</span>
            <span className="block text-slate-350">
              Entre no painel da **Vercel** &gt; aba **Storage** &gt; crie um **KV (Redis)** e vincule a este projeto. É super rápido e automático!
            </span>
          </div>
        </div>
      )}

      {(syncState.status === 'unconfigured' || syncState.status === 'disconnected') && (
        <div className="mt-2 p-1.5 bg-amber-500/5 border border-amber-500/15 text-amber-450 text-[9px] rounded-lg leading-normal flex items-start gap-1">
          <Database className="w-3 h-3 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-semibold block">Conectando ao Vercel KV...</span>
            <span className="text-slate-400 block">Os dados serão salvos no banco central automaticamente.</span>
          </div>
        </div>
      )}
    </div>
  );
};
