/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Cloud, 
  CloudLightning, 
  CloudOff, 
  CloudRain, 
  RefreshCw, 
  Settings, 
  LogOut, 
  HelpCircle, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Google Drive API Functions
export const searchDriveFile = async (token: string): Promise<{ id: string; parents?: string[] } | null> => {
  const resp = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=name='controle_frota_db.json' and trashed=false&fields=files(id,parents)`,
    {
      headers: { Authorization: `Bearer ${token}` }
    }
  );
  if (!resp.ok) throw new Error('Falha ao buscar arquivo no Google Drive.');
  const data = await resp.json();
  if (data.files && data.files.length > 0) {
    return {
      id: data.files[0].id,
      parents: data.files[0].parents
    };
  }
  return null;
};

export const searchDriveFolder = async (token: string): Promise<string | null> => {
  const resp = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=name='ProFrota-DB' and mimeType='application/vnd.google-apps.folder' and trashed=false&fields=files(id)`,
    {
      headers: { Authorization: `Bearer ${token}` }
    }
  );
  if (!resp.ok) throw new Error('Falha ao buscar pasta no Google Drive.');
  const data = await resp.json();
  if (data.files && data.files.length > 0) {
    return data.files[0].id;
  }
  return null;
};

export const createDriveFolder = async (token: string): Promise<string> => {
  const metadata = {
    name: 'ProFrota-DB',
    mimeType: 'application/vnd.google-apps.folder',
  };
  const resp = await fetch('https://www.googleapis.com/drive/v3/files?fields=id', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(metadata),
  });
  if (!resp.ok) throw new Error('Falha ao criar pasta no Google Drive.');
  const result = await resp.json();
  return result.id;
};

export const moveDriveFileToFolder = async (
  token: string,
  fileId: string,
  folderId: string,
  currentParents: string[] = []
): Promise<void> => {
  const removeParentsQuery = currentParents.length > 0 ? `&removeParents=${currentParents.join(',')}` : '';
  const resp = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}?addParents=${folderId}${removeParentsQuery}`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  if (!resp.ok) throw new Error('Falha ao mover arquivo para a pasta no Google Drive.');
};

export const getDriveFileContent = async (token: string, fileId: string): Promise<any> => {
  const resp = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
    {
      headers: { Authorization: `Bearer ${token}` }
    }
  );
  if (!resp.ok) throw new Error('Falha ao baixar os dados do Google Drive.');
  return await resp.json();
};

export const createDriveFile = async (token: string, content: any, folderId?: string): Promise<string> => {
  const metadata = {
    name: 'controle_frota_db.json',
    mimeType: 'application/json',
    ...(folderId ? { parents: [folderId] } : {})
  };
  
  const form = new FormData();
  form.append(
    'metadata',
    new Blob([JSON.stringify(metadata)], { type: 'application/json' })
  );
  form.append(
    'file',
    new Blob([JSON.stringify(content, null, 2)], { type: 'application/json' })
  );

  const resp = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id',
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    }
  );
  if (!resp.ok) throw new Error('Falha ao criar o arquivo de banco de dados no Drive.');
  const result = await resp.json();
  return result.id;
};

export const updateDriveFile = async (token: string, fileId: string, content: any): Promise<void> => {
  const resp = await fetch(
    `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(content, null, 2),
    }
  );
  if (!resp.ok) throw new Error('Falha ao atualizar o banco de dados no Google Drive.');
};

export const getGoogleUserInfo = async (token: string): Promise<{ email: string; picture?: string; name?: string }> => {
  const resp = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!resp.ok) throw new Error('Falha ao obter informações do usuário.');
  return await resp.json();
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
    userPicture?: string;
  };
  setSyncState: React.Dispatch<React.SetStateAction<any>>;
}

export const GoogleDriveSync: React.FC<GoogleDriveSyncProps> = ({
  onSyncComplete,
  getCurrentData,
  isConnected,
  setIsConnected,
  syncState,
  setSyncState,
}) => {
  const [clientId, setClientId] = useState<string>(() => localStorage.getItem('gdrive_client_id') || '');
  const [fileId, setFileId] = useState<string>(() => localStorage.getItem('gdrive_file_id') || '');
  const [showConfig, setShowConfig] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [cloudData, setCloudData] = useState<any>(null);
  const [accessToken, setAccessToken] = useState<string>(() => localStorage.getItem('gdrive_access_token') || '');

  // Handle Client ID Save
  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId.trim()) {
      alert('Por favor, informe um Client ID válido do Google Cloud Console.');
      return;
    }
    localStorage.setItem('gdrive_client_id', clientId.trim());
    setSyncState((prev: any) => ({
      ...prev,
      status: prev.status === 'unconfigured' ? 'disconnected' : prev.status
    }));
    setShowConfig(false);
    alert('Configuração salva com sucesso! Você já pode conectar ao Google Drive.');
  };

  // Perform Google Sign-in and Sync
  const handleConnect = () => {
    if (!clientId.trim()) {
      setShowConfig(true);
      return;
    }

    setSyncState((prev: any) => ({ ...prev, status: 'connecting', errorMessage: undefined }));

    try {
      // @ts-ignore
      if (!window.google || !window.google.accounts || !window.google.accounts.oauth2) {
        throw new Error('O SDK do Google ainda não foi totalmente carregado no navegador. Aguarde alguns instantes e tente novamente.');
      }

      // @ts-ignore
      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: 'https://www.googleapis.com/auth/drive.file email profile',
        callback: async (response: any) => {
          if (response.error) {
            setSyncState((prev: any) => ({
              ...prev,
              status: 'error',
              errorMessage: `Erro de autorização: ${response.error_description || response.error}`
            }));
            return;
          }

          const token = response.access_token;
          setAccessToken(token);
          localStorage.setItem('gdrive_access_token', token);
          setIsConnected(true);

          try {
            // Fetch User info
            const user = await getGoogleUserInfo(token);
            setSyncState((prev: any) => ({
              ...prev,
              userEmail: user.email,
              userPicture: user.picture,
            }));

            // Sync database
            await performSync(token);
          } catch (err: any) {
            setSyncState((prev: any) => ({
              ...prev,
              status: 'error',
              errorMessage: err.message || 'Erro durante a sincronização inicial.'
            }));
          }
        },
      });

      client.requestAccessToken();
    } catch (err: any) {
      setSyncState((prev: any) => ({
        ...prev,
        status: 'error',
        errorMessage: err.message || 'Falha ao iniciar o fluxo OAuth do Google.'
      }));
    }
  };

  // Main Sync Engine
  const performSync = async (tokenToUse: string) => {
    const activeToken = tokenToUse || accessToken;
    if (!activeToken) return;

    setSyncState((prev: any) => ({ ...prev, status: 'connecting' }));

    try {
      // 1. Garante que a pasta "ProFrota-DB" existe
      let folderId = await searchDriveFolder(activeToken);
      if (!folderId) {
        folderId = await createDriveFolder(activeToken);
      }

      // 2. Busca o arquivo controle_frota_db.json
      let fileSearchResult = await searchDriveFile(activeToken);
      let currentFileId = fileSearchResult ? fileSearchResult.id : '';

      const localData = getCurrentData();

      if (currentFileId) {
        setFileId(currentFileId);
        localStorage.setItem('gdrive_file_id', currentFileId);

        // Auto-migração: Se o arquivo não estiver na pasta correta, move-o para lá silenciosamente!
        const fileParents = fileSearchResult?.parents || [];
        if (!fileParents.includes(folderId)) {
          await moveDriveFileToFolder(activeToken, currentFileId, folderId, fileParents);
        }

        const cloudContent = await getDriveFileContent(activeToken, currentFileId);
        
        // Simple conflict resolution / data validation
        if (JSON.stringify(cloudContent) !== JSON.stringify(localData)) {
          setCloudData(cloudContent);
          setShowConflictModal(true);
        } else {
          // Exactly synchronized!
          setSyncState((prev: any) => ({
            ...prev,
            status: 'connected',
            lastSync: new Date().toLocaleTimeString('pt-BR')
          }));
        }
      } else {
        // File does not exist on Drive! Let's create it inside the dedicated folder
        const newFileId = await createDriveFile(activeToken, localData, folderId);
        setFileId(newFileId);
        localStorage.setItem('gdrive_file_id', newFileId);
        
        setSyncState((prev: any) => ({
          ...prev,
          status: 'connected',
          lastSync: new Date().toLocaleTimeString('pt-BR')
        }));
      }
    } catch (err: any) {
      setSyncState((prev: any) => ({
        ...prev,
        status: 'error',
        errorMessage: err.message || 'Erro durante a sincronização de arquivos.'
      }));
    }
  };

  // Conflict Resolution Choices
  const resolveConflict = async (choice: 'use_cloud' | 'use_local') => {
    setShowConflictModal(false);
    setSyncState((prev: any) => ({ ...prev, status: 'connecting' }));

    try {
      if (choice === 'use_cloud') {
        onSyncComplete(cloudData);
        alert('Dados sincronizados da nuvem aplicados localmente com sucesso!');
      } else {
        const localData = getCurrentData();
        await updateDriveFile(accessToken, fileId, localData);
        alert('Nuvem atualizada com os dados locais deste navegador!');
      }
      setSyncState((prev: any) => ({
        ...prev,
        status: 'connected',
        lastSync: new Date().toLocaleTimeString('pt-BR')
      }));
    } catch (err: any) {
      setSyncState((prev: any) => ({
        ...prev,
        status: 'error',
        errorMessage: err.message || 'Erro ao resolver conflito.'
      }));
    }
  };

  // Disconnect / Log out
  const handleDisconnect = () => {
    localStorage.removeItem('gdrive_access_token');
    localStorage.removeItem('gdrive_file_id');
    setAccessToken('');
    setFileId('');
    setIsConnected(false);
    setSyncState({
      status: clientId ? 'disconnected' : 'unconfigured',
      lastSync: null,
      userEmail: undefined,
      userPicture: undefined
    });
    alert('Desconectado do Google Drive. O app continuará operando localmente no navegador.');
  };

  // Check state on mount
  useEffect(() => {
    if (!clientId) {
      setSyncState((prev: any) => ({ ...prev, status: 'unconfigured' }));
    } else if (!accessToken) {
      setSyncState((prev: any) => ({ ...prev, status: 'disconnected' }));
    } else {
      setSyncState((prev: any) => ({ ...prev, status: 'connected' }));
      setIsConnected(true);
    }
  }, [clientId, accessToken]);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 mb-6 text-slate-100 shadow-xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        
        {/* Sync Status Badge */}
        <div className="flex items-center gap-4">
          <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700">
            {syncState.status === 'connected' && (
              <motion.div
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                <Cloud className="w-8 height-8 text-emerald-400" />
              </motion.div>
            )}
            {syncState.status === 'connecting' && (
              <RefreshCw className="w-8 height-8 text-indigo-400 animate-spin" />
            )}
            {syncState.status === 'disconnected' && (
              <CloudOff className="w-8 height-8 text-amber-500" />
            )}
            {syncState.status === 'error' && (
              <CloudRain className="w-8 height-8 text-rose-500" />
            )}
            {syncState.status === 'unconfigured' && (
              <CloudLightning className="w-8 height-8 text-slate-400" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-lg text-white">Sincronização em Nuvem</h3>
              
              {/* Connected User details */}
              {syncState.userPicture && (
                <img 
                  src={syncState.userPicture} 
                  alt="Avatar" 
                  className="w-5 h-5 rounded-full border border-slate-700"
                />
              )}
            </div>
            
            <div className="flex items-center gap-2 mt-1">
              {syncState.status === 'connected' && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                  Sincronizado
                </span>
              )}
              {syncState.status === 'connecting' && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-medium animate-pulse">
                  Conectando...
                </span>
              )}
              {syncState.status === 'disconnected' && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-medium">
                  Desconectado (Apenas Local)
                </span>
              )}
              {syncState.status === 'error' && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 font-medium">
                  Falha ao Sincronizar
                </span>
              )}
              {syncState.status === 'unconfigured' && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-500/10 text-slate-400 border border-slate-500/20 font-medium">
                  Não Configurado
                </span>
              )}

              {syncState.lastSync && (
                <span className="text-xs text-slate-400">
                  • Última sincronização: {syncState.lastSync}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Sync Controls Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {syncState.status === 'unconfigured' ? (
            <button
              onClick={() => setShowConfig(true)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium transition text-sm shadow-lg shadow-indigo-600/15"
            >
              <Settings className="w-4 h-4" />
              Configurar Google Drive
            </button>
          ) : isConnected ? (
            <>
              <button
                onClick={() => performSync('')}
                disabled={syncState.status === 'connecting'}
                className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg font-medium transition text-sm disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${syncState.status === 'connecting' ? 'animate-spin' : ''}`} />
                Forçar Sincronização
              </button>
              <button
                onClick={handleDisconnect}
                className="flex items-center gap-2 px-4 py-2 bg-rose-950/40 hover:bg-rose-900/60 text-rose-400 border border-rose-900/35 rounded-lg font-medium transition text-sm"
              >
                <LogOut className="w-4 h-4" />
                Desconectar
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleConnect}
                disabled={syncState.status === 'connecting'}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium transition text-sm shadow-lg shadow-indigo-600/15"
              >
                <Cloud className="w-4 h-4" />
                Conectar ao Google Drive
              </button>
              <button
                onClick={() => setShowConfig(true)}
                className="p-2 text-slate-400 hover:text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition"
              >
                <Settings className="w-4 h-4" />
              </button>
            </>
          )}

          <button
            onClick={() => setShowHelp(!showHelp)}
            className="p-2 text-slate-400 hover:text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition"
            title="Como configurar e-CNPJ / Drive API"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Error Message banner */}
      {syncState.errorMessage && (
        <div className="mt-4 flex items-start gap-2.5 p-3 rounded-lg bg-rose-500/10 border border-rose-500/25 text-rose-400 text-xs">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <div>
            <span className="font-semibold">Erro de Conectividade:</span> {syncState.errorMessage}
          </div>
        </div>
      )}

      {/* Connection Info Detail */}
      {isConnected && syncState.userEmail && (
        <div className="mt-3 text-xs text-slate-400 flex items-center gap-1 bg-slate-950/40 p-2 rounded-lg border border-slate-800/60 max-w-max">
          <Info className="w-3.5 h-3.5 text-slate-500" />
          Conectado com a conta Google: <span className="font-semibold text-slate-300">{syncState.userEmail}</span>
        </div>
      )}

      {/* 🛠️ STEP-BY-STEP CREDENTIALS CONFIGURATION BOX */}
      <AnimatePresence>
        {showConfig && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <form onSubmit={handleSaveConfig} className="mt-6 pt-6 border-t border-slate-850 space-y-4">
              <div>
                <h4 className="font-medium text-white flex items-center gap-2 text-sm">
                  <Settings className="w-4 h-4 text-indigo-400" />
                  Configurar Credencial do Google Cloud Console
                </h4>
                <p className="text-xs text-slate-400 mt-1 max-w-2xl">
                  Para utilizar o Google Drive como seu banco de dados na Vercel ou localmente, é necessário registrar o sistema no Google Cloud para obter um Client ID.
                </p>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-300">
                  Google Client ID (ID do cliente OAuth 2.0)*
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={clientId}
                    onChange={(e) => setClientId(e.target.value)}
                    placeholder="xxxxxxxxxxxx-xxxxxxxxxxxxxxxxxxxxxxxx.apps.googleusercontent.com"
                    className="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-semibold transition"
                  >
                    Salvar
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowConfig(false)}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm transition"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 📖 HELP & HOW-TO GUIDE */}
      <AnimatePresence>
        {showHelp && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-6 pt-6 border-t border-slate-850 space-y-4 text-xs text-slate-300">
              <h4 className="font-semibold text-white text-sm flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4 text-indigo-400" />
                Guia Passo a Passo: Criando suas Credenciais no Google Cloud Console
              </h4>
              <p>
                Para habilitar o Google Drive como banco de dados em nuvem, você precisa criar um ID de Cliente no console de desenvolvedores do Google. Siga o roteiro abaixo:
              </p>
              <ol className="list-decimal pl-5 space-y-2.5 max-w-3xl">
                <li>
                  Acesse o <a href="https://console.cloud.google.com" target="_blank" rel="noreferrer" className="text-indigo-400 hover:underline font-medium">Google Cloud Console</a> e faça login com sua conta do Google.
                </li>
                <li>
                  Crie um novo projeto clicando na seleção de projetos no topo da tela e selecione <span className="font-semibold text-white">"Novo Projeto"</span> (ex: <i>"ProFrota-DB"</i>).
                </li>
                <li>
                  No menu lateral, vá em <span className="font-semibold text-white">"APIs e Serviços" &gt; "Biblioteca"</span>. Procure por <span className="font-semibold text-white">"Google Drive API"</span> e clique em <span className="font-semibold text-white">"Ativar"</span>.
                </li>
                <li>
                  No menu lateral, clique em <span className="font-semibold text-white">"Tela de consentimento OAuth"</span>:
                  <ul className="list-disc pl-5 mt-1 space-y-1">
                    <li>Escolha o tipo de usuário <span className="font-semibold text-white">"Externo"</span> e clique em Criar.</li>
                    <li>Preencha o nome do app (ex: <i>"ProFrota"</i>) e seu e-mail de suporte.</li>
                    <li>Na seção "Escopos", clique em adicionar escopo e marque: <code className="bg-slate-950 px-1 py-0.5 rounded text-indigo-300">.../auth/drive.file</code> (Criar e editar apenas arquivos abertos ou criados pelo app) e <code className="bg-slate-950 px-1 py-0.5 rounded text-indigo-300">.../auth/userinfo.email</code>.</li>
                    <li>Na aba "Usuários de teste", certifique-se de adicionar o seu próprio e-mail e e-mails corporativos da sua empresa que usarão o sistema em homologação.</li>
                  </ul>
                </li>
                <li>
                  Vá na aba <span className="font-semibold text-white">"Credenciais"</span> no menu lateral:
                  <ul className="list-disc pl-5 mt-1 space-y-1">
                    <li>Clique em <span className="font-semibold text-white">"+ Criar Credenciais"</span> e selecione <span className="font-semibold text-white">"ID do cliente OAuth"</span>.</li>
                    <li>Em Tipo de Aplicativo, escolha <span className="font-semibold text-white">"Aplicativo da Web"</span>.</li>
                    <li>Em <span className="font-semibold text-white">"Origens JavaScript autorizadas"</span>, adicione:
                      <br /><code className="bg-slate-950 px-1 py-0.5 rounded text-slate-400">http://localhost:3000</code> (desenvolvimento)
                      <br /><code className="bg-slate-950 px-1 py-0.5 rounded text-slate-400">https://seu-subdominio.vercel.app</code> (sua URL gerada após subir para a Vercel)
                    </li>
                  </ul>
                </li>
                <li>
                  Clique em salvar! O Google exibirá seu <span className="font-semibold text-white">ID do cliente (Client ID)</span>. Copie-o, cole no campo de configuração acima e clique em "Salvar". Prontinho! 🎉
                </li>
              </ol>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ⚠️ CONFLICT RESOLUTION MODAL */}
      <AnimatePresence>
        {showConflictModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 text-slate-100 shadow-2xl relative"
            >
              <div className="flex items-center gap-3 mb-4 text-amber-400">
                <AlertCircle className="w-8 h-8 flex-shrink-0" />
                <h3 className="font-bold text-xl text-white">Conflito de Sincronização Encontrado</h3>
              </div>

              <p className="text-sm text-slate-300 leading-relaxed mb-4">
                Identificamos uma discrepância entre o banco de dados armazenado localmente neste navegador e o arquivo de backup disponível em sua conta do Google Drive.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
                
                {/* Option A: Use Cloud */}
                <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-xl flex flex-col justify-between">
                  <div>
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Arquivo da Nuvem</span>
                    <span className="font-bold text-white text-base block mt-1">Google Drive</span>
                    <p className="text-xs text-slate-400 mt-2">
                      Carrega as informações salvas no Drive substituindo os dados do navegador atual. Recomendado se você usou o app de outro computador recentemente.
                    </p>
                  </div>
                  <button
                    onClick={() => resolveConflict('use_cloud')}
                    className="w-full mt-4 py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-lg transition"
                  >
                    Usar Versão do Drive
                  </button>
                </div>

                {/* Option B: Use Local */}
                <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-xl flex flex-col justify-between">
                  <div>
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Versão Deste Dispositivo</span>
                    <span className="font-bold text-white text-base block mt-1">Este Computador</span>
                    <p className="text-xs text-slate-400 mt-2">
                      Usa os dados do seu navegador local e sobrescreve o arquivo no Google Drive. Recomendado se as suas alterações locais são as mais recentes.
                    </p>
                  </div>
                  <button
                    onClick={() => resolveConflict('use_local')}
                    className="w-full mt-4 py-2 px-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-lg transition animate-pulse"
                  >
                    Subir Dados Deste Aparelho
                  </button>
                </div>

              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => {
                    setShowConflictModal(false);
                    setSyncState((prev: any) => ({ ...prev, status: 'disconnected' }));
                    setIsConnected(false);
                  }}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-slate-200 transition"
                >
                  Cancelar Sincronização
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
