import { useState } from 'react';
import { supabase } from '../../lib/supabase';

export default function AuthPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<'doctor' | 'admin' | 'chief_doctor'>('doctor');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setMsg('');
    setLoading(true);
    try {
      if (mode === 'register') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName || email.split('@')[0], role },
          },
        });
        setMsg(error ? error.message : 'Проверьте почту для подтверждения.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) setMsg(error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleTest = async () => {
    setMsg('');
    const { error } = await supabase.auth.signInAnonymously({
      options: { data: { full_name: 'Тестовый врач', role: 'doctor' } },
    });
    if (error) {
      setMsg('Включите Anonymous Sign-ins в Supabase: ' + error.message);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f5f7] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white/70 backdrop-blur-2xl rounded-3xl shadow-2xl p-8 border border-white/60">
        <h1 className="text-3xl font-semibold text-gray-800 mb-1">DentalOS</h1>
        <p className="text-gray-500 text-sm mb-8">Учёт стоматологической клиники</p>

        <div className="flex gap-1 mb-6 bg-gray-100 rounded-2xl p-1">
          {(['login', 'register'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition ${
                mode === m ? 'bg-white shadow text-gray-800' : 'text-gray-500'
              }`}
            >
              {m === 'login' ? 'Вход' : 'Регистрация'}
            </button>
          ))}
        </div>

        {mode === 'register' && (
          <>
            <input
              placeholder="ФИО"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full mb-3 px-4 py-3 rounded-2xl bg-gray-50 border border-gray-200 outline-none focus:ring-2 focus:ring-gray-300"
            />
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as any)}
              className="w-full mb-3 px-4 py-3 rounded-2xl bg-gray-50 border border-gray-200 outline-none"
            >
              <option value="doctor">Врач</option>
              <option value="admin">Администратор</option>
              <option value="chief_doctor">Главный врач</option>
            </select>
          </>
        )}

        <input
          type="email"
          placeholder="Электронная почта"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full mb-3 px-4 py-3 rounded-2xl bg-gray-50 border border-gray-200 outline-none focus:ring-2 focus:ring-gray-300"
        />
        <input
          type="password"
          placeholder="Пароль"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full mb-5 px-4 py-3 rounded-2xl bg-gray-50 border border-gray-200 outline-none focus:ring-2 focus:ring-gray-300"
        />

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full py-3 rounded-2xl bg-gray-900 text-white font-medium hover:bg-gray-800 transition disabled:opacity-60"
        >
          {loading ? '...' : mode === 'login' ? 'Войти' : 'Зарегистрироваться'}
        </button>

        <button
          onClick={handleTest}
          className="w-full mt-3 py-3 rounded-2xl border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50"
        >
          Тестовый вход
        </button>

        {msg && <p className="mt-4 text-sm text-center text-gray-500">{msg}</p>}
      </div>
    </div>
  );
}