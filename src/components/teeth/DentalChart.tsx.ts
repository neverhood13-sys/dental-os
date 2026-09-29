import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import {
  toothPaths,
  toothTypeOf,
  upperPermanent,
  lowerPermanent,
  upperDeciduous,
  lowerDeciduous,
} from './toothShapes';

export type ToothState = 'present' | 'missing' | 'deciduous' | 'supernumerary' | 'implant';

interface Props {
  patientId?: string;
  mode: 'permanent' | 'deciduous';
  serviceIcons?: Record<number, string[]>;
  onToothClick?: (toothNumber: number) => void;
  onToothStateChange?: (toothNumber: number, state: ToothState) => void;
  onDropService?: (toothNumber: number, serviceId: string) => void;
}

const stateOrder: ToothState[] = ['present', 'missing', 'deciduous', 'supernumerary', 'implant'];

export default function DentalChart({
  patientId,
  mode,
  serviceIcons = {},
  onToothClick,
  onToothStateChange,
  onDropService,
}: Props) {
  const [states, setStates] = useState<Record<number, ToothState>>({});
  const [activeTooth, setActiveTooth] = useState<number | null>(null);

  useEffect(() => {
    if (!patientId) return;
    (async () => {
      const { data } = await supabase
        .from('patient_teeth')
        .select('tooth_number, state')
        .eq('patient_id', patientId);
      const map: Record<number, ToothState> = {};
      (data || []).forEach((r: any) => (map[r.tooth_number] = r.state));
      setStates(map);
    })();
  }, [patientId]);

  const upper = mode === 'permanent' ? upperPermanent : upperDeciduous;
  const lower = mode === 'permanent' ? lowerPermanent : lowerDeciduous;

  const cycleState = (num: number) => {
    const cur = states[num] || 'present';
    const next = stateOrder[(stateOrder.indexOf(cur) + 1) % stateOrder.length];
    setStates({ ...states, [num]: next });
    onToothStateChange?.(num, next);
  };

  const renderTooth = (num: number, isUpper: boolean) => {
    const type = toothTypeOf(num);
    const state = states[num] || 'present';
    const fill =
      state === 'missing'
        ? '#d1d5db'
        : state === 'deciduous'
        ? '#bfdbfe'
        : state === 'supernumerary'
        ? '#fde68a'
        : state === 'implant'
        ? '#c7d2fe'
        : '#f9fafb';

    return (
      <g
        key={num}
        className="cursor-pointer select-none"
        onClick={() => onToothClick?.(num)}
        onContextMenu={(e) => {
          e.preventDefault();
          cycleState(num);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setActiveTooth(num);
        }}
        onDragLeave={() => setActiveTooth(null)}
        onDrop={(e) => {
          const sid = e.dataTransfer.getData('serviceId');
          setActiveTooth(null);
          if (sid && onDropService) onDropService(num, sid);
        }}
      >
        <path
          d={toothPaths[type]}
          fill={activeTooth === num ? '#e0e7ff' : fill}
          stroke="#6b7280"
          strokeWidth={1.4}
          strokeDasharray={state === 'missing' ? '4 2' : undefined}
        />
        <text
          x={14}
          y={isUpper ? 68 : -8}
          textAnchor="middle"
          fontSize={9}
          fill="#6b7280"
        >
          {num}
        </text>
        {(serviceIcons[num] || []).slice(0, 3).map((_, i) => (
          <circle
            key={i}
            cx={8 + i * 8}
            cy={isUpper ? 8 : 44}
            r={3}
            fill="#111827"
            className="pointer-events-none"
          />
        ))}
      </g>
    );
  };

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox="0 0 500 190" className="w-full max-w-4xl mx-auto min-w-[600px]">
        {upper.map((num, i) => (
          <g key={num} transform={`translate(${20 + i * 30}, 10)`}>
            {renderTooth(num, true)}
          </g>
        ))}
        {lower.map((num, i) => (
          <g key={num} transform={`translate(${20 + i * 30}, 110)`}>
            {renderTooth(num, false)}
          </g>
        ))}
      </svg>
      <p className="text-center text-xs text-gray-400 mt-2">
        ЛКМ — добавить услугу · ПКМ — сменить состояние (отсутствует, молочный, сверхкомплектный, имплантат) · Drag-and-drop услуги на зуб
      </p>
    </div>
  );
}