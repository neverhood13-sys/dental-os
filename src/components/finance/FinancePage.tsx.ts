import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import type { Clinic } from '../../types';

export default function FinancePage({ clinic }: { clinic: Clinic }) {
  const [income, setIncome] = useState(0);
  const [planned, setPlanned] = useState(0);
  const [patientsCount, setPatientsCount] = useState(0);
  const [balance, setBalance] = useState(0);

  useEffect(() => {
    (async () => {
      const { data: plans } = await supabase
        .from('treatment_plans')
        .select('id')
        .eq('clinic_id', clinic.id);
      const planIds = (plans || []).map((p: any) => p.id);

      const [{ data: items }, { count }, { data: pats }] = await Promise.all([
        planIds.length
          ? supabase
              .from('plan_items')
              .select('service_id, quantity, status')
              .in('plan_id', planIds)
          : Promise.resolve({ data: [] }),
        supabase
          .from('patients')
          .select('id', { count: 'exact', head: true })
          .eq('clinic_id', clinic.id),
        supabase.from('patients').select('balance').eq('clinic_id', clinic.id),
      ]);

      const { data: services } = await supabase
        .from('services')
        .select('id, price')
        .eq('clinic_id', clinic.id);
      const priceMap: Record<string, number> = {};
      (services || []).forEach((s: any) => (priceMap[s.id] = Number(s.price) || 0));

      let doneSum = 0;
      let plannedSum = 0;
      (items || []).forEach((it: any) => {
        const sum = (priceMap[it.service_id] || 0) * it.quantity;
        if (it.status === 'done') doneSum += sum;
        else if (it.status !== 'cancelled') plannedSum += sum;
      });

      const totalBalance = (pats || []).reduce(
        (acc: number, p: any) => acc + (Number(p.balance) || 0),
        0
      );

      setIncome(doneSum);
      setPlanned(plannedSum);
      setPatientsCount(count || 0);
      setBalance(totalBalance);
    })();
    // eslint-disable-next-line
  }, [clinic.id]);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-800 mb-6">Финансы</h1>
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card label="Выполнено услуг" value={income} accent="text-green-600" />
        <Card label="Запланировано" value={planned} accent="text-yellow-600" />
        <Card label="Баланс пациентов" value={balance} accent="text-gray-800" />
        <Card label="Пациентов" value={patientsCount} accent="text-gray-800" isMoney={false} />
      </div>
    </div>
  );
}

function Card({
  label,
  value,
  accent,
  isMoney = true,
}: {
  label: string;
  value: number;
  accent: string;
  isMoney?: boolean;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6">
      <div className="text-xs text-gray-500 mb-1">{label}</div>
      <div className={`text-2xl font-semibold ${accent}`}>
        {isMoney ? `${value.toFixed(0)} ₽` : value}
      </div>
    </div>
  );
}