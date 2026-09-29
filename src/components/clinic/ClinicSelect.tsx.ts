import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import type { Clinic } from '../../types';

export default function ClinicSelect({ onSelect }: { onSelect: (c: Clinic) => void }) {
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  const load = async () => {
    const { data } = await supabase.from('clinics').select('*').order('created_at');
    setClinics((data as Clinic[]) || []);
  };

  useEffect(() => {
    load();
  }, []);

  const create = async () => {
    if (!name.trim()) return;
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from('clinics')
      .insert({ name, address, phone, created_by: user?.id })
      .select()
      .single();
    setLoading(false);
    if (error) return alert(error.message);
    setName('');
    setAddress('');
    setPhone('');
    await load();
    if (data) onSelect(data as Clinic);
  };

  return (
    <div className="min-h-screen bg-[#f5f5f7] p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-semibold text-gray-800 mb-6">Выберите клинику</h1>

        <div className="grid gap-3 mb-8">
          {clinics.map((c) => (
            <button
              key={c.id}
              onClick={() => onSelect(c)}
              className="text-left px-5 py-4 rounded-2xl bg-white hover:shadow-md transition border border-gray-100"
            >
              <div className="font-medium text-gray-800">{c.name}</div>
              {c.address && <div className="text-sm text-gray-500">{c.address}</div>}
            </button>
          ))}
          {clinics.length === 0 && (
            <p className="text-sm text-gray-400">
              Пока нет ни одной клиники — создайте первую.
            </p>
          )}
        </div>

        <div className="bg-white rounded-2xl p-6 border border-gray-100">
          <h2 className="text-lg font-medium text-gray-800 mb-4">Новая клиника / филиал</h2>
          <input
            placeholder="Название"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full mb-3 px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 outline-none"
          />
          <input
            placeholder="Адрес"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full mb-3 px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 outline-none"
          />
          <input
            placeholder="Телефон"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full mb-4 px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 outline-none"
          />
          <button
            onClick={create}
            disabled={loading}
            className="px-5 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 disabled:opacity-60"
          >
            {loading ? '...' : 'Создать'}
          </button>
        </div>
      </div>
    </div>
  );
}