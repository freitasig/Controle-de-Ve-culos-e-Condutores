/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Shield, User, Lock, KeyRound, UserPlus, AlertCircle, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface LoginPortalProps {
  onLoginSuccess: (username: string, role: 'Administrador' | 'Operador') => void;
  existingUsers: any[];
  onRegisterUser: (username: string, passwordHash: string, role: 'Administrador' | 'Operador') => void;
}

export const LoginPortal: React.FC<LoginPortalProps> = ({
  onLoginSuccess,
  existingUsers,
  onRegisterUser,
}) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<'Administrador' | 'Operador'>('Operador');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedUser = username.trim().toLowerCase();
    if (!trimmedUser || !password) {
      setError('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    if (isRegistering) {
      // Registration Flow
      if (password !== confirmPassword) {
        setError('As senhas digitadas não coincidem.');
        return;
      }
      if (password.length < 4) {
        setError('A senha deve conter no mínimo 4 caracteres.');
        return;
      }

      // Check if user already exists
      const userExists = existingUsers.some(u => u.username.toLowerCase() === trimmedUser);
      if (userExists) {
        setError('Este nome de usuário já está sendo utilizado.');
        return;
      }

      // Save user (we hash simplificadamente por questões estáticas front-end)
      const mockHash = btoa(password); // Simple base64 encoding for client-side hashing
      onRegisterUser(trimmedUser, mockHash, role);
      
      alert(`Operador "${trimmedUser}" cadastrado com sucesso como ${role}! Agora você já pode fazer login.`);
      setIsRegistering(false);
      setPassword('');
      setConfirmPassword('');
    } else {
      // Login Flow
      const foundUser = existingUsers.find(u => u.username.toLowerCase() === trimmedUser);
      const inputHash = btoa(password);

      if (foundUser && (foundUser.passwordHash === inputHash || foundUser.password === password)) {
        onLoginSuccess(foundUser.username, foundUser.role);
      } else {
        setError('Usuário ou senha incorretos. Tente novamente.');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950 p-4 overflow-y-auto">
      
      {/* Visual background decoration */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(37,99,235,0.15),transparent_40%),radial-gradient(circle_at_bottom_left,rgba(99,102,241,0.1),transparent_40%)] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl relative"
      >
        
        {/* Glow effect */}
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Branding Area */}
        <div className="flex flex-col items-center text-center mb-8 relative">
          <motion.div
            animate={{ rotate: [0, 2, -2, 0] }}
            transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
            className="w-20 h-20 mb-3 bg-slate-800/80 p-2.5 rounded-2xl border border-slate-700 shadow-inner flex items-center justify-center overflow-hidden"
          >
            {/* Displaying our high-quality logo asset */}
            <img 
              src="/assets/profrota_logo.png" 
              alt="Logo ProFrota" 
              className="w-full h-full object-cover scale-110"
              onError={(e) => {
                // Fallback to Icon if image fails to render
                e.currentTarget.style.display = 'none';
              }}
            />
          </motion.div>
          
          <h2 className="text-2xl font-black text-white tracking-tight uppercase">
            {isRegistering ? 'Novo Operador' : 'Acesso Restrito'}
          </h2>
          <p className="text-xs text-slate-400 font-medium mt-1">
            {isRegistering 
              ? 'Cadastre credenciais para acessar o painel de frota' 
              : 'Entre com usuário e senha corporativos para iniciar'}
          </p>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Error Banner */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl flex items-start gap-2.5 text-xs"
              >
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Username Field */}
          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Nome de Usuário *
            </label>
            <div className="relative">
              <User className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Ex: c.souza"
                className="w-full pl-9 pr-4 py-2.5 bg-slate-950/70 border border-slate-800 focus:border-indigo-500 rounded-xl text-sm text-slate-100 placeholder-slate-650 focus:outline-none transition"
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Senha de Acesso *
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-4 py-2.5 bg-slate-950/70 border border-slate-800 focus:border-indigo-500 rounded-xl text-sm text-slate-100 placeholder-slate-650 focus:outline-none transition"
              />
            </div>
          </div>

          {/* Confirm Password Field (Register Only) */}
          <AnimatePresence>
            {isRegistering && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-1 overflow-hidden"
              >
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Confirmar Senha *
                </label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-4 py-2.5 bg-slate-950/70 border border-slate-800 focus:border-indigo-500 rounded-xl text-sm text-slate-100 placeholder-slate-650 focus:outline-none transition"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Role selector (Register Only) */}
          <AnimatePresence>
            {isRegistering && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-1 overflow-hidden"
              >
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Nível de Acesso (Perfil)*
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRole('Operador')}
                    className={`py-2 px-3 rounded-lg text-xs font-semibold border transition ${
                      role === 'Operador'
                        ? 'bg-slate-800 border-indigo-500 text-white'
                        : 'bg-slate-950/50 border-slate-850 text-slate-450 hover:border-slate-800'
                    }`}
                  >
                    👷 Operador (Uso Geral)
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('Administrador')}
                    className={`py-2 px-3 rounded-lg text-xs font-semibold border transition ${
                      role === 'Administrador'
                        ? 'bg-slate-800 border-indigo-500 text-white'
                        : 'bg-slate-950/50 border-slate-850 text-slate-450 hover:border-slate-800'
                    }`}
                  >
                    🛡️ Administrador (Full)
                  </button>
                </div>
                <p className="text-[10px] text-slate-500 mt-1 leading-normal">
                  * <strong>Administradores</strong> têm controle de configurações de banco de dados e reset. <strong>Operadores</strong> realizam apenas saídas, abastecimentos e manutenções.
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Action buttons */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-sm transition shadow-lg shadow-indigo-600/15 flex items-center justify-center gap-2 cursor-pointer"
            >
              {isRegistering ? <UserPlus className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
              {isRegistering ? 'Finalizar Cadastro' : 'Entrar no Sistema'}
            </button>
          </div>
        </form>

        {/* Toggle Form type links */}
        <div className="mt-6 pt-6 border-t border-slate-850/80 text-center">
          <button
            onClick={() => {
              setIsRegistering(!isRegistering);
              setError(null);
            }}
            className="text-xs text-slate-400 hover:text-indigo-400 font-semibold transition"
          >
            {isRegistering 
              ? '← Voltar para a tela de acesso' 
              : 'Novo por aqui? Criar conta de operador →'}
          </button>
        </div>

        {/* Default login hint (Login Only) */}
        {!isRegistering && (
          <div className="mt-4 p-3 bg-slate-950/40 rounded-xl border border-slate-850/60 flex items-start gap-2 text-[10px] text-slate-500">
            <Sparkles className="w-3.5 h-3.5 text-indigo-500 mt-0.5 shrink-0" />
            <div>
              <strong>Acesso de Administrador de fábrica:</strong><br />
              Use o usuário <span className="font-semibold text-slate-400 font-mono">admin</span> e a senha <span className="font-semibold text-slate-400 font-mono">admin</span> para o primeiro acesso à frota.
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};
