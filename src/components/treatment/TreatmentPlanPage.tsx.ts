import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../lib/supabase';
import DentalChart from '../teeth/DentalChart';
import type { ToothState } from '../teeth/DentalChart';
import { exportPlanToPDF, getShareLinks } from '../../lib/pdf';
import type { Clinic, Patient, Service, PlanItem } from '../../types';

const statusColors: Record<string, string> = {
  planned: 'bg-gray-100 text-gray-600',
  in_progress: 'bg-yellow-100 text-yellow-700',
  done: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-600',
};

export default function TreatmentPlanPage({ clinic }: { clinic: Clinic }) {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [planId, setPlanId] = useState<string | null>(null);
  const [items, setItems] = useState<PlanItem[]>([]);
  const [recommendations, setRecommendations] = useState('');
  const [chartMode, setChartMode] = useState<'permanent' | 'deciduous'>('permanent');

  // Загрузка справочников
  useEffect(() => {
    (async () => {
      const [{ data: p }, { data: s }] = await Promise.all([
        supabase.from('patients').select('*').eq('clinic_id', clinic.id).order('full_name'),
        supabase.from('services').select('*').eq('clinic_id', clinic.id).order('code'),
      ]);
      setPatients((p as Patient[]) || []);
      setServices((s as Service[]) || []);
      if (p && p.length) setPatient(p[0] as Patient);
    })();
    // eslint-disable-next-line
  }, [clinic.id]);

  // Загрузка/создание плана
  useEffect(() => {
    if (!patient) return;
    (async () => {
      const { data: plans } = await supabase
        .from('treatment_plans')
        .select('*')
        .eq('patient_id', patient.id)
        .order('created_at', { ascending: false })
        .limit(1);
      let plan = plans?.[0];
      if (!plan) {
        const { data: newPlan } = await supabase
          .from('treatment_plans')
          .insert({ patient_id: patient.id, clinic_id: clinic.id })
          .select()
          .single();
        plan = newPlan;
      }
      setPlanId(plan?.id || null);
      setRecommendations(plan?.recommendations || '');

      if (plan?.id) {
        const { data: its } = await supabase
          .from('plan_items')
          .select('*')
          .eq('plan_id', plan.id);
        setItems((its as PlanItem[]) || []);
      } else {
        setItems([]);
      }
    })();
  }, [patient, clinic.id]);

  const totals = useMemo(() => {
    let total = 0;
    for (const it of items) {
      const svc = services.find((s) => s.id === it.service_id);
      if (!svc) continue;
      const discounted =
        svc.price * (1 - svc.discount_percent / 100) - svc.discount_absolute;
      total += discounted * it.quantity;
    }
    return total;
  }, [items, services]);

  const serviceIconsMap = useMemo(() => {
    const map: Record<number, string[]> = {};
    for (const it of items) {
      if (!it.tooth_number) continue;
      map[it.tooth_number] = map[it.tooth_number] || [];
      map[it.tooth_number].push(it.service_id);
    }
    return map;
  }, [items]);

  const addServiceToTooth = async (toothNumber: number, serviceId: string) => {
    if (!planId) return;
    const { data, error } = await supabase
      .from('plan_items')
      .insert({
        plan_id: planId,
        service_id: serviceId,
        tooth_number: toothNumber,
        quantity: 1,
      })
      .select()
      .single();
    if (error) return alert(error.message);
    setItems((prev) => [...prev, data as PlanItem]);
  };

  const changeItemStatus = async (id: string, status: PlanItem['status']) => {
    await supabase.from('plan_items').update({ status }).eq('id', id);
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, status } : i)));
  };

  const removeItem = async (id: string) => {
    await supabase.from('plan_items').delete().eq('id', id);
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const save = async () => {
    if (!planId) return;
    await supabase
      .from('treatment_plans')
      .update({ recommendations, updated_at: new Date().toISOString() })
      .eq('id', planId);
    alert('План сохранён');
  };

  if (!patient) {
    return (
      <div className="text-gray-400">
        Нет пациентов — добавьте первого на вкладке «Пациенты».
      </div>
    );
  }

  const share = getShareLinks(
    `План лечения: ${patient.full_name}`,
    window.location.href
  );

  return (
    <div className="grid lg:grid-cols-[280px_1fr] gap-6">
      {/* Слева — пациент и услуги */}
      <div className="space-y-4">
        <div>
          <label className="text-xs text-gray-500">Пациент</label>
          <select
            value={patient.id}
            onChange={(e) =>
              setPatient(patients.find((p) => p.id === e.target.value) || null)
            }
            className="w-full mt-1 px-3 py-2 rounded-xl bg-white border border-gray-200 text-sm"
          >
            {patients.map((p) => (
              <option key={p.id} value={p.id}>
                {p.full_name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <div className="text-xs text-gray-500 mb-2">
            Услуги — перетащите на зуб или кликните по зубу
          </div>
          <div className="space-y-1 max-h-[60vh] overflow-y-auto pr-1">
            {services.map((s) => (
              <div
                key={s.id}
                draggable
                onDragStart={(e) => e.dataTransfer.setData('serviceId', s.id)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-gray-100 cursor-grab hover:shadow-sm text-sm"
              >
                <span className="text-base">{s.icon || '•'}</span>
                <span className="text-gray-500 text-xs">{s.code}</span>
                <span className="flex-1 truncate text-gray-800">{s.name}</span>
                <span className="font-medium text-gray-800">{s.price.toFixed(0)}</span>
              </div>
            ))}
            {services.length === 0 && (
              <p className="text-xs text-gray-400">
                Добавьте услуги в разделе «Прайс-лист»
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Справа — план */}
      <div className="min-w-0">
        <div id="treatment-plan" className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="text-center mb-6">
            <h1 className="text-xl font-semibold text-gray-800">{clinic.name}</h1>
            <p className="text-xs text-gray-500">
              {clinic.address} {clinic.phone ? `· ${clinic.phone}` : ''}
            </p>
          </div>

          <div className="flex justify-center gap-2 mb-3">
            {(['permanent', 'deciduous'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setChartMode(m)}
                className={`px-3 py-1.5 rounded-lg text-xs ${
                  chartMode === m ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600'
                }`}
              >
                {m === 'permanent' ? 'Постоянные' : 'Молочные'}
              </button>
            ))}
          </div>

          <DentalChart
            patientId={patient.id}
            mode={chartMode}
            serviceIcons={serviceIconsMap}
            onToothClick={(num) => {
              const svc = services[0];
              if (svc) addServiceToTooth(num, svc.id);
            }}
            onToothStateChange={async (num: number, state: ToothState) => {
              await supabase.from('patient_teeth').upsert(
                { patient_id: patient.id, tooth_number: num, state },
                { onConflict: 'patient_id,tooth_number' }
              );
            }}
            onDropService={addServiceToTooth}
          />

          <div className="mt-6 overflow-x-auto">
            <table className="w-full text-sm min-w-[640px]">
              <thead className="text-gray-500">
                <tr>
                  <th className="text-left py-2">Код</th>
                  <th className="text-left py-2">Услуга</th>
                  <th className="text-center py-2">Зуб</th>
                  <th className="text-center py-2">Кол-во</th>
                  <th className="text-right py-2">Цена</th>
                  <th className="text-center py-2">Статус</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {items.map((it) => {
                  const svc = services.find((s) => s.id === it.service_id);
                  if (!svc) return null;
                  return (
                    <tr key={it.id} className="border-t border-gray-100">
                      <td className="py-2 text-gray-500">{svc.code}</td>
                      <td className="py-2 text-gray-800">{svc.name}</td>
                      <td className="py-2 text-center">{it.tooth_number || '—'}</td>
                      <td className="py-2 text-center">{it.quantity}</td>
                      <td className="py-2 text-right">{svc.price.toFixed(0)}</td>
                      <td className="py-2 text-center">
                        <select
                          value={it.status}
                          onChange={(e) =>
                            changeItemStatus(it.id, e.target.value as any)
                          }
                          className={`px-2 py-1 rounded-full text-xs font-medium border-0 ${statusColors[it.status]}`}
                        >
                          <option value="planned">Запланировано</option>
                          <option value="in_progress">В процессе</option>
                          <option value="done">Выполнено</option>
                          <option value="cancelled">Отменено</option>
                        </select>
                      </td>
                      <td className="py-2 text-right">
                        <button
                          onClick={() => removeItem(it.id)}
                          className="text-gray-400 hover:text-red-500"
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {items.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-6 text-center text-gray-400">
                      Перетащите услугу на зуб или кликните по зубу
                    </td>
                  </tr>
                )}
              </tbody>
              <tfoot>
                <tr className="border-t border-gray-200">
                  <td colSpan={4} className="py-3 text-right text-gray-500">
                    Итого:
                  </td>
                  <td className="py-3 text-right font-semibold text-gray-800">
                    {totals.toFixed(0)} ₽
                  </td>
                  <td colSpan={2}></td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="grid md:grid-cols-2 gap-4 mt-6">
            <textarea
              placeholder="Рекомендации врача"
              value={recommendations}
              onChange={(e) => setRecommendations(e.target.value)}
              className="px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-sm h-24 resize-none"
            />
            <textarea
              placeholder="Рекомендации для пациента"
              className="px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 text-sm h-24 resize-none"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-6 mt-6 text-xs text-gray-400">
            <div className="border-b border-gray-300 pb-8">Подпись врача</div>
            <div className="border-b border-gray-300 pb-8">Подпись пациента</div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mt-4">
          <button
            onClick={save}
            className="px-5 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-medium hover:bg-gray-800"
          >
            Сохранить
          </button>
          <button
            onClick={() => exportPlanToPDF('treatment-plan', `plan-${patient.full_name}.pdf`)}
            className="px-5 py-2.5 rounded-xl border border-gray-300 text-gray-700 text-sm hover:bg-white"
          >
            Печать / PDF
          </button>
          <a
            href={share.telegram}
            target="_blank"
            rel="noreferrer"
            className="px-5 py-2.5 rounded-xl border border-gray-300 text-gray-700 text-sm hover:bg-white"
          >
            Telegram
          </a>
          <a
            href={share.whatsapp}
            target="_blank"
            rel="noreferrer"
            className="px-5 py-2.5 rounded-xl border border-gray-300 text-gray-700 text-sm hover:bg-white"
          >
            WhatsApp
          </a>
          <a
            href={share.email}
            className="px-5 py-2.5 rounded-xl border border-gray-300 text-gray-700 text-sm hover:bg-white"
          >
            Email
          </a>
        </div>
      </div>
    </div>
  );
}