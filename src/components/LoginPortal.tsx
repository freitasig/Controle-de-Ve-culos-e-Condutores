/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Shield, User, Lock, KeyRound, UserPlus, AlertCircle, Sparkles, HelpCircle, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface LoginPortalProps {
  onLoginSuccess: (username: string, role: 'Administrador' | 'Operador') => void;
  existingUsers: any[];
  onRegisterUser: (
    username: string, 
    passwordHash: string, 
    role: 'Administrador' | 'Operador',
    securityQuestion: string,
    securityAnswerHash: string
  ) => void;
  onUpdateUserPassword: (username: string, newPasswordHash: string) => void;
}

const SECURITY_QUESTIONS_TEMPLATES = [
  "Qual a sua cidade natal?",
  "Qual o nome do seu primeiro animal de estimação?",
  "Qual o modelo do seu primeiro carro?",
  "Qual o nome da sua mãe?",
  "Qual a sua comida favorita?",
  "Qual o nome da sua primeira escola?"
];

export const LoginPortal: React.FC<LoginPortalProps> = ({
  onLoginSuccess,
  existingUsers,
  onRegisterUser,
  onUpdateUserPassword,
}) => {
  // Modes: 'login' | 'register' | 'recover'
  const [mode, setMode] = useState<'login' | 'register' | 'recover'>('login');
  
  // Recovery steps: 1 (input user) | 2 (answer question) | 3 (reset password)
  const [recoveryStep, setRecoveryStep] = useState<1 | 2 | 3>(1);
  const [recoveryUser, setRecoveryUser] = useState<any>(null);
  const [securityAnswer, setSecurityAnswer] = useState('');
  
  // Fields state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<'Administrador' | 'Operador'>('Operador');
  const [securityQuestion, setSecurityQuestion] = useState(SECURITY_QUESTIONS_TEMPLATES[0]);
  const [securityQuestionAnswer, setSecurityQuestionAnswer] = useState('');
  
  const [error, setError] = useState<string | null>(null);

  const resetForm = () => {
    setUsername('');
    setPassword('');
    setConfirmPassword('');
    setSecurityQuestionAnswer('');
    setSecurityAnswer('');
    setError(null);
    setRecoveryStep(1);
    setRecoveryUser(null);
  };

  const handleModeSwitch = (newMode: 'login' | 'register' | 'recover') => {
    resetForm();
    setMode(newMode);
  };

  // Start Password Recovery Workflow
  const handleStartRecovery = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const trimmedUser = username.trim().toLowerCase();
    
    if (!trimmedUser) {
      setError('Por favor, informe o seu nome de usuário.');
      return;
    }

    const found = existingUsers.find(u => u.username.toLowerCase() === trimmedUser);
    if (!found) {
      setError('Nome de usuário não encontrado no sistema.');
      return;
    }

    // Se o usuário seeded original (admin antigo) não tiver pergunta de segurança cadastrada
    if (!found.securityQuestion) {
      // Cria uma pergunta de segurança padrão para o admin de fábrica
      found.securityQuestion = "Qual o nome da aplicação?";
      found.securityAnswerHash = btoa("profrota");
    }

    setRecoveryUser(found);
    setRecoveryStep(2);
    setSecurityAnswer('');
  };

  // Validate Security Answer
  const handleVerifyAnswer = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const inputHash = btoa(securityAnswer.trim().toLowerCase());
    const dbHash = recoveryUser.securityAnswerHash;

    if (inputHash === dbHash || securityAnswer.trim().toLowerCase() === atob(dbHash || '')) {
      setRecoveryStep(3);
      setPassword('');
      setConfirmPassword('');
    } else {
      setError('Resposta de segurança incorreta. Tente novamente.');
    }
  };

  // Save new password from recovery
  const handleSaveRecoveredPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('As novas senhas digitadas não coincidem.');
      return;
    }
    if (password.length < 4) {
      setError('A nova senha deve conter no mínimo 4 caracteres.');
      return;
    }

    const newHash = btoa(password);
    onUpdateUserPassword(recoveryUser.username, newHash);
    
    alert('Sua senha foi redefinida com sucesso! Agora você já pode fazer login.');
    handleModeSwitch('login');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedUser = username.trim().toLowerCase();
    if (!trimmedUser || !password) {
      setError('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    if (mode === 'register') {
      if (password !== confirmPassword) {
        setError('As senhas digitadas não coincidem.');
        return;
      }
      if (password.length < 4) {
        setError('A senha deve conter no mínimo 4 caracteres.');
        return;
      }
      if (!securityQuestionAnswer.trim()) {
        setError('Por favor, preencha a resposta para a pergunta de segurança.');
        return;
      }

      // Check if user already exists
      const userExists = existingUsers.some(u => u.username.toLowerCase() === trimmedUser);
      if (userExists) {
        setError('Este nome de usuário já está sendo utilizado.');
        return;
      }

      const mockHash = btoa(password);
      const answerHash = btoa(securityQuestionAnswer.trim().toLowerCase());

      onRegisterUser(trimmedUser, mockHash, role, securityQuestion, answerHash);
      
      alert(`Operador "${trimmedUser}" cadastrado com sucesso como ${role}! Agora você já pode fazer login.`);
      handleModeSwitch('login');
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
            <img 
              src="/assets/profrota_logo.png" 
              alt="Logo ProFrota" 
              className="w-full h-full object-cover scale-110"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          </motion.div>
          
          <h2 className="text-2xl font-black text-white tracking-tight uppercase">
            {mode === 'register' && 'Novo Operador'}
            {mode === 'login' && 'Acesso Restrito'}
            {mode === 'recover' && 'Recuperar Senha'}
          </h2>
          <p className="text-xs text-slate-400 font-medium mt-1">
            {mode === 'register' && 'Cadastre credenciais para acessar o painel de frota'}
            {mode === 'login' && 'Entre com usuário e senha corporativos para iniciar'}
            {mode === 'recover' && `Passo ${recoveryStep} de 3: Autenticação de Segurança`}
          </p>
        </div>

        {/* 1. LOGIN & REGISTER FORM CONTAINER */}
        {mode !== 'recover' ? (
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
              <div className="flex justify-between items-center">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Senha de Acesso *
                </label>
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => handleModeSwitch('recover')}
                    className="text-[10px] text-indigo-400 hover:text-indigo-350 hover:underline font-semibold"
                  >
                    Esqueceu a senha?
                  </button>
                )}
              </div>
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
              {mode === 'register' && (
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

            {/* Security Question Section (Register Only) */}
            <AnimatePresence>
              {mode === 'register' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-3 overflow-hidden border-t border-slate-850/80 pt-3 mt-1"
                >
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Pergunta de Segurança (Para Recuperação) *
                    </label>
                    <select
                      value={securityQuestion}
                      onChange={(e) => setSecurityQuestion(e.target.value)}
                      className="w-full h-10 px-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                    >
                      {SECURITY_QUESTIONS_TEMPLATES.map((q, idx) => (
                        <option key={idx} value={q}>{q}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Sua Resposta *
                    </label>
                    <div className="relative">
                      <HelpCircle className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                      <input
                        type="text"
                        required
                        value={securityQuestionAnswer}
                        onChange={(e) => setSecurityQuestionAnswer(e.target.value)}
                        placeholder="Ex: São Paulo"
                        className="w-full pl-9 pr-4 py-2.5 bg-slate-950/70 border border-slate-800 focus:border-indigo-500 rounded-xl text-sm text-slate-100 placeholder-slate-650 focus:outline-none transition"
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Role selector (Register Only) */}
            <AnimatePresence>
              {mode === 'register' && (
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
                </motion.div>
              )}
            </AnimatePresence>

            {/* Action buttons */}
            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-sm transition shadow-lg shadow-indigo-600/15 flex items-center justify-center gap-2 cursor-pointer"
              >
                {mode === 'register' ? <UserPlus className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
                {mode === 'register' ? 'Finalizar Cadastro' : 'Entrar no Sistema'}
              </button>
            </div>
          </form>
        ) : (
          
          /* 2. PASSWORD RECOVERY SCREEN (mode === 'recover') */
          <div className="space-y-4">
            
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

            {/* STEP 1: USERNAME INPUT */}
            {recoveryStep === 1 && (
              <form onSubmit={handleStartRecovery} className="space-y-4">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Informe seu Nome de Usuário
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
                <button
                  type="submit"
                  className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-sm transition"
                >
                  Verificar Usuário
                </button>
              </form>
            )}

            {/* STEP 2: VERIFY ANSWER */}
            {recoveryStep === 2 && recoveryUser && (
              <form onSubmit={handleVerifyAnswer} className="space-y-4">
                <div className="p-3 bg-slate-950/40 border border-slate-850 rounded-xl">
                  <span className="text-[10px] text-indigo-400 font-bold block uppercase">Pergunta de Segurança Cadastrada:</span>
                  <span className="text-sm text-white font-semibold mt-1 block">
                    {recoveryUser.securityQuestion || "Qual a pergunta de segurança?"}
                  </span>
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Sua Resposta
                  </label>
                  <div className="relative">
                    <HelpCircle className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      required
                      value={securityAnswer}
                      onChange={(e) => setSecurityAnswer(e.target.value)}
                      placeholder="Digite a resposta que você cadastrou"
                      className="w-full pl-9 pr-4 py-2.5 bg-slate-950/70 border border-slate-800 focus:border-indigo-500 rounded-xl text-sm text-slate-100 focus:outline-none transition"
                    />
                  </div>
                </div>
                
                <button
                  type="submit"
                  className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-sm transition"
                >
                  Validar Resposta
                </button>
              </form>
            )}

            {/* STEP 3: RESET PASSWORD */}
            {recoveryStep === 3 && recoveryUser && (
              <form onSubmit={handleSaveRecoveredPassword} className="space-y-4">
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs flex gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                  Identidade verificada! Defina sua nova senha de acesso abaixo.
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Nova Senha *
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Mínimo 4 caracteres"
                      className="w-full pl-9 pr-4 py-2.5 bg-slate-950/70 border border-slate-800 focus:border-indigo-500 rounded-xl text-sm text-slate-100 focus:outline-none transition"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Confirmar Nova Senha *
                  </label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repita a nova senha"
                      className="w-full pl-9 pr-4 py-2.5 bg-slate-950/70 border border-slate-800 focus:border-indigo-500 rounded-xl text-sm text-slate-100 focus:outline-none transition"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-sm transition shadow-lg shadow-emerald-600/15"
                >
                  Salvar Nova Senha
                </button>
              </form>
            )}

            <div className="pt-2 text-center">
              <button
                onClick={() => handleModeSwitch('login')}
                className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-white transition"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Voltar para o Login
              </button>
            </div>
          </div>
        )}

        {/* Toggle Form type links */}
        {mode !== 'recover' && (
          <div className="mt-6 pt-6 border-t border-slate-850/80 text-center">
            <button
              onClick={() => handleModeSwitch(mode === 'login' ? 'register' : 'login')}
              className="text-xs text-slate-400 hover:text-indigo-400 font-semibold transition"
            >
              {mode === 'login' 
                ? 'Novo por aqui? Criar conta de operador →' 
                : '← Já possui uma conta? Fazer login'}
            </button>
          </div>
        )}

        {/* Default login hint (Login Only) */}
        {mode === 'login' && (
          <div className="mt-4 p-3 bg-slate-950/40 rounded-xl border border-slate-850/60 flex items-start gap-2 text-[10px] text-slate-500">
            <Sparkles className="w-3.5 h-3.5 text-indigo-500 mt-0.5 shrink-0" />
            <div>
              <strong>Acesso de Administrador de fábrica:</strong><br />
              Use o usuário <span className="font-semibold text-slate-400 font-mono">admin</span> e a senha <span className="font-semibold text-slate-400 font-mono">admin</span> para o primeiro acesso.
              <br />A pergunta padrão é <i>Qual o nome da aplicação?</i> e a resposta é <i>profrota</i>.
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};
