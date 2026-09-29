import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import type { Clinic, Service } from '../../types';

export default function PricePage({ clinic }: { clinic: Clinic }) {
  const [services, setServices] = useState<Service[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [editing, setEditing] = useState<Partial<Service> | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  const load = async () => {
    const { data } = await supabase
      .from('services')
      .select('*')
      .eq('clinic_id', clinic.id)
      .order('code');
    setServices((data as Service[]) || []);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line
  }, [clinic.id]);

  const save = async () => {
    if (!editing || !editing.name?.trim()) return;
    const payload: any = {
      clinic_id: clinic.id,
      code: editing.code || '',
      name: editing.name,
      price: Number(editing.price) || 0,
      discount_percent: Number(editing.discount_percent) || 0,
      discount_absolute: Number(editing.discount_absolute) || 0,
      icon: editing.icon || '',
    };
    const { error } = editing.id
      ? await supabase.from('services').update(payload).eq('id', editing.id)
      : await supabase.from('services').insert(payload);
    if (error) return alert(error.message);
    setEditing(null);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm('Удалить услугу?')) return;
    await supabase.from('services').delete().eq('id', id);
    load();
  };

  const loadHistory = async () => {
    const { data } = await supabase
      .from('price_history')
      .select('*, services(name, code)')
      .order('changed_at', { ascending: false })
      .limit(100);
    setHistory(data || []);
    setShowHistory(true);
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">Прайс-лист</h1>
        <div className="flex gap-2">
          <button
            onClick={loadHistory}
            className="px-4 py-2 rounded-xl border border-gray-300 text-sm text-gray-700 hover:bg-white"
          >
            История цен
          </button>
          <button
            onClick={() =>
              setEditing({
                code: '',
                name: '',
                price: 0,
                discount_percent: 0,
                discount_absolute: 0,
                icon: '',
              })
            }
            className="px-4 py-2 rounded-xl bg-gray-900 text-white text-sm font-medium hover:bg-gray-800"
          >
            + Услуга
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl overflow-hidden border border-gray-100">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500">
            <tr>
              <th className="px-4 py-3 text-left">Иконка</th>
              <th className="px-4 py-3 text-left">Код</th>
              <th className="px-4 py-3 text-left">Название</th>
              <th className="px-4 py-3 text-right">Цена</th>
              <th className="px-4 py-3 text-right">Скидка %</th>
              <th className="px-4 py-3 text-right">Скидка ₽</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {services.map((s) => (
              <tr key={s.id} className="border-t border-gray-100">
                <td className="px-4 py-3 text-lg">{s.icon || '—'}</td>
                <td className="px-4 py-3 text-gray-500">{s.code}</td>
                <td className="px-4 py-3 text-gray-800">{s.name}</td>
                <td className="px-4 py-3 text-right">{s.price.toFixed(0)}</td>
                <td className="px-4 py-3 text-right">{s.discount_percent}</td>
                <td className="px-4 py-3 text-right">{s.discount_absolute}</td>
                <td className="px-4 py-3 text-right whitespace-nowrap">
                  <button
                    onClick={() => setEditing(s)}
                    className="text-gray-500 hover:text-gray-800 mr-3"
                  >
                    ✎
                  </button>
                  <button
                    onClick={() => remove(s.id)}
                    className="text-gray-400 hover:text-red-500"
                  >
                    ✕
                  </button>
                </td>
              </tr>
            ))}
            {services.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                  Добавьте первую услугу
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {editing && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6">
            <h3 className="text-lg font-medium mb-4">
              {editing.id ? 'Редактировать услугу' : 'Новая услуга'}
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <input
                placeholder="Код"
                value={editing.code || ''}
                onChange={(e) => setEditing({ ...editing, code: e.target.value })}
                className="px-3 py-2 rounded-xl bg-gray-50 border border-gray-200"
              />
              <input
                placeholder="Иконка (эмодзи)"
                value={editing.icon || ''}
                onChange={(e) => setEditing({ ...editing, icon: e.target.value })}
                className="px-3 py-2 rounded-xl bg-gray-50 border border-gray-200"
              />
              <input
                placeholder="Название"
                value={editing.name || ''}
                onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                className="col-span-2 px-3 py-2 rounded-xl bg-gray-50 border border-gray-200"
              />
              <input
                type="number"
                placeholder="Цена"
                value={editing.price ?? 0}
                onChange={(e) => setEditing({ ...editing, price: +e.target.value })}
                className="px-3 py-2 rounded-xl bg-gray-50 border border-gray-200"
              />
              <input
                type="number"
                placeholder="Скидка %"
                value={editing.discount_percent ?? 0}
                onChange={(e) =>
                  setEditing({ ...editing, discount_percent: +e.target.value })
                }
                className="px-3 py-2 rounded-xl bg-gray-50 border border-gray-200"
              />
              <input
                type="number"
                placeholder="Скидка ₽"
                value={editing.discount_absolute ?? 0}
                onChange={(e) =>
                  setEditing({ ...editing, discount_absolute: +e.target.value })
                }
                className="col-span-2 px-3 py-2 rounded-xl bg-gray-50 border border-gray-200"
              />
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

      {showHistory && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">История изменения цен</h3>
              <button onClick={() => setShowHistory(false)} className="text-gray-400">
                ✕
              </button>
            </div>
            <table className="w-full text-sm">
              <thead className="text-gray-500">
                <tr>
                  <th className="text-left py-2">Услуга</th>
                  <th className="text-right py-2">Было</th>
                  <th className="text-right py-2">Стало</th>
                  <th className="text-right py-2">Дата</th>
                </tr>
              </thead>
              <tbody>
                {history.map((h) => (
                  <tr key={h.id} className="border-t border-gray-100">
                    <td className="py-2">{h.services?.name || '—'}</td>
                    <td className="py-2 text-right text-gray-500">{h.old_price}</td>
                    <td className="py-2 text-right font-medium">{h.new_price}</td>
                    <td className="py-2 text-right text-gray-500">
                      {new Date(h.changed_at).toLocaleString('ru')}
                    </td>
                  </tr>
                ))}
                {history.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-gray-400">
                      Пока нет записей
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}