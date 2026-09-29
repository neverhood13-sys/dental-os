import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import type { Clinic, Patient } from '../../types';

export default function PatientsPage({ clinic }: { clinic: Clinic }) {
  const [items, setItems] = useState<Patient[]>([]);
  const [q, setQ] = useState('');
  const [editing, setEditing] = useState<Partial<Patient> | null>(null);

  const load = async () => {
    const { data } = await supabase
      .from('patients')
      .select('*')
      .eq('clinic_id', clinic.id)
      .order('full_name');
    setItems((data as Patient[]) || []);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line
  }, [clinic.id]);

  const save = async () => {
    if (!editing || !editing.full_name?.trim()) return;
    const payload: any = {
      clinic_id: clinic.id,
      full_name: editing.full_name,
      gender: editing.gender || null,
      birth_date: editing.birth_date || null,
      phone: editing.phone || null,
      anamnesis: editing.anamnesis || null,
      balance: Number(editing.balance) || 0,
      cloud_links: editing.cloud_links || [],
    };
    const { error } = editing.id
      ? await supabase.from('patients').update(payload).eq('id', editing.id)
      : await supabase.from('patients').insert(payload);
    if (error) return alert(error.message);
    setEditing(null);
    load();
  };

  const filtered = items.filter((p) =>
    p.full_name.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">Пациенты</h1>
        <div className="flex gap-2 w-full md:w-auto">
          <input
            placeholder="Поиск по ФИО"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="px-4 py-2 rounded-xl bg-white border border-gray-200 text-sm flex-1 md:w-72"
          />
          <button
            onClick={() => setEditing({ full_name: '', balance: 0, cloud_links: [] })}
            className="px-4 py-2 rounded-xl bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 whitespace-nowrap"
          >
            + Пациент
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">
        {filtered.map((p) => (
          <div key={p.id} className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className="flex items-start justify-between">
              <div>
                <div className="font-medium text-gray-800">{p.full_name}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {p.birth_date ? new Date(p.birth_date).toLocaleDateString('ru') : '—'}
                  {' · '}
                  {p.gender === 'male' ? 'М' : p.gender === 'female' ? 'Ж' : '—'}
                </div>
              </div>
              <button
                onClick={() => setEditing(p)}
                className="text-gray-400 hover:text-gray-700 text-sm"
              >
                ✎
              </button>
            </div>
            <div className="mt-3 text-sm">
              Баланс:{' '}
              <span className={p.balance >= 0 ? 'text-green-600' : 'text-red-600'}>
                {p.balance.toFixed(0)} ₽
              </span>
            </div>
            {p.cloud_links?.length > 0 && (
              <div className="mt-3 space-y-1">
                {p.cloud_links.map((l, i) => (
                  <a
                    key={i}
                    href={l.url}
                    target="_blank"
                    rel="noreferrer"
                    className="block text-xs text-blue-600 hover:underline truncate"
                  >
                    {l.provider === 'yandex' ? '🟡' : l.provider === 'google' ? '🔵' : '☁️'}{' '}
                    {l.title}
                  </a>
                ))}
              </div>
            )}
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="text-sm text-gray-400 col-span-full">
            Нет пациентов. Нажмите «+ Пациент», чтобы добавить.
          </p>
        )}
      </div>

      {editing && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-medium mb-4">
              {editing.id ? 'Редактировать пациента' : 'Новый пациент'}
            </h3>
            <input
              placeholder="ФИО"
              value={editing.full_name || ''}
              onChange={(e) => setEditing({ ...editing, full_name: e.target.value })}
              className="w-full mb-3 px-3 py-2 rounded-xl bg-gray-50 border border-gray-200"
            />
            <div className="grid grid-cols-2 gap-3 mb-3">
              <select
                value={editing.gender || ''}
                onChange={(e) =>
                  setEditing({ ...editing, gender: (e.target.value || undefined) as any })
                }
                className="px-3 py-2 rounded-xl bg-gray-50 border border-gray-200"
              >
                <option value="">Пол</option>
                <option value="male">Мужской</option>
                <option value="female">Женский</option>
              </select>
              <input
                type="date"
                value={editing.birth_date || ''}
                onChange={(e) => setEditing({ ...editing, birth_date: e.target.value })}
                className="px-3 py-2 rounded-xl bg-gray-50 border border-gray-200"
              />
            </div>
            <input
              placeholder="Телефон"
              value={editing.phone || ''}
              onChange={(e) => setEditing({ ...editing, phone: e.target.value })}
              className="w-full mb-3 px-3 py-2 rounded-xl bg-gray-50 border border-gray-200"
            />
            <input
              type="number"
              placeholder="Баланс, ₽"
              value={editing.balance ?? 0}
              onChange={(e) => setEditing({ ...editing, balance: Number(e.target.value) })}
              className="w-full mb-3 px-3 py-2 rounded-xl bg-gray-50 border border-gray-200"
            />
            <textarea
              placeholder="Анамнез"
              value={editing.anamnesis || ''}
              onChange={(e) => setEditing({ ...editing, anamnesis: e.target.value })}
              className="w-full mb-3 px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 h-24 resize-none"
            />

            <div className="mb-4">
              <div className="text-xs text-gray-500 mb-2">Ссылки на облачные хранилища</div>
              {(editing.cloud_links || []).map((l, i) => (
                <div key={i} className="flex gap-2 mb-2">
                  <input
                    placeholder="Название"
                    value={l.title}
                    onChange={(e) => {
                      const arr = [...(editing.cloud_links || [])];
                      arr[i] = { ...arr[i], title: e.target.value };
                      setEditing({ ...editing, cloud_links: arr });
                    }}
                    className="flex-1 px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-sm"
                  />
                  <input
                    placeholder="URL"
                    value={l.url}
                    onChange={(e) => {
                      const arr = [...(editing.cloud_links || [])];
                      arr[i] = { ...arr[i], url: e.target.value };
                      setEditing({ ...editing, cloud_links: arr });
                    }}
                    className="flex-1 px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-sm"
                  />
                  <select
                    value={l.provider}
                    onChange={(e) => {
                      const arr = [...(editing.cloud_links || [])];
                      arr[i] = { ...arr[i], provider: e.target.value as any };
                      setEditing({ ...editing, cloud_links: arr });
                    }}
                    className="px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-sm"
                  >
                    <option value="yandex">Яндекс.Диск</option>
                    <option value="google">Google Drive</option>
                    <option value="other">Другое</option>
                  </select>
                  <button
                    onClick={() => {
                      const arr = (editing.cloud_links || []).filter((_, j) => j !== i);
                      setEditing({ ...editing, cloud_links: arr });
                    }}
                    className="text-gray-400 hover:text-red-500 px-2"
                  >
                    ✕
                  </button>
                </div>
              ))}
              <button
                onClick={() =>
                  setEditing({
                    ...editing,
                    cloud_links: [
                      ...(editing.cloud_links || []),
                      { title: '', url: '', provider: 'yandex' },
                    ],
                  })
                }
                className="text-xs text-gray-500 hover:text-gray-800"
              >
                + Добавить ссылку
              </button>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setEditing(null)}
                className="px-4 py-2 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50"
              >
                Отмена
              </button>
              <button
                onClick={save}
                className="px-4 py-2 rounded-xl bg-gray-900 text-white hover:bg-gray-800"
              >
                Сохранить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}