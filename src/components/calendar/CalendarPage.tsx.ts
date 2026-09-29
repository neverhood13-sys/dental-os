import { useEffect, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import ruLocale from '@fullcalendar/core/locales/ru';
import { supabase } from '../../lib/supabase';
import type { Appointment, Clinic } from '../../types';
import { downloadICS, googleCalendarLink } from '../../lib/ics';

export default function CalendarPage({ clinic }: { clinic: Clinic }) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selected, setSelected] = useState<Appointment | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Partial<Appointment>>({});

  const load = async () => {
    const { data } = await supabase
      .from('appointments')
      .select('*')
      .eq('clinic_id', clinic.id)
      .order('start_time');
    setAppointments((data as Appointment[]) || []);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line
  }, [clinic.id]);

  const events = appointments.map((a) => ({
    id: a.id,
    title: a.title || 'Приём',
    start: a.start_time,
    end: a.end_time,
    backgroundColor: a.color || '#6b7280',
    borderColor: a.color || '#6b7280',
    extendedProps: { appointment: a },
  }));

  const createAppointment = async () => {
    if (!form.title || !form.start_time || !form.end_time) return;
    const { error } = await supabase.from('appointments').insert({
      clinic_id: clinic.id,
      title: form.title,
      start_time: form.start_time,
      end_time: form.end_time,
      comment: form.comment || '',
      cloud_link: form.cloud_link || '',
      color: form.color || '#6b7280',
    });
    if (error) return alert(error.message);
    setShowForm(false);
    setForm({});
    load();
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">Календарь</h1>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 rounded-xl bg-gray-900 text-white text-sm font-medium hover:bg-gray-800"
          >
            + Запись
          </button>
          <button
            onClick={() => downloadICS(appointments, clinic.name)}
            className="px-4 py-2 rounded-xl border border-gray-300 text-sm text-gray-700 hover:bg-white"
            title="Экспорт в Google Calendar или Yandex Calendar"
          >
            Экспорт .ics
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-4">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="timeGridWeek"
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay',
          }}
          locale={ruLocale}
          slotMinTime="08:00:00"
          slotMaxTime="21:00:00"
          allDaySlot={false}
          nowIndicator
          events={events}
          eventClick={(info) => {
            setSelected(info.event.extendedProps.appointment as Appointment);
          }}
          height="auto"
        />
      </div>

      {selected && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h3 className="text-lg font-medium mb-3">{selected.title || 'Приём'}</h3>
            <p className="text-sm text-gray-500 mb-2">
              {new Date(selected.start_time).toLocaleString('ru')} —{' '}
              {new Date(selected.end_time).toLocaleTimeString('ru')}
            </p>
            {selected.comment && (
              <p className="text-sm text-gray-700 mb-3">{selected.comment}</p>
            )}
            {selected.cloud_link && (
              <a
                href={selected.cloud_link}
                target="_blank"
                rel="noreferrer"
                className="text-sm text-blue-600 hover:underline block mb-3 truncate"
              >
                {selected.cloud_link}
              </a>
            )}
            <div className="flex flex-wrap gap-2 mt-4">
              <a
                href={googleCalendarLink(selected)}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-2 rounded-xl border border-gray-300 text-xs"
              >
                + Google Calendar
              </a>
              <button
                onClick={() => downloadICS([selected], clinic.name)}
                className="px-3 py-2 rounded-xl border border-gray-300 text-xs"
              >
                Скачать .ics
              </button>
              <button
                onClick={() => setSelected(null)}
                className="ml-auto px-3 py-2 rounded-xl bg-gray-900 text-white text-xs"
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h3 className="text-lg font-medium mb-4">Новая запись</h3>
            <input
              placeholder="Название (например, ФИО пациента)"
              value={form.title || ''}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full mb-3 px-3 py-2 rounded-xl bg-gray-50 border border-gray-200"
            />
            <label className="text-xs text-gray-500">Начало</label>
            <input
              type="datetime-local"
              value={form.start_time || ''}
              onChange={(e) => setForm({ ...form, start_time: e.target.value })}
              className="w-full mb-3 px-3 py-2 rounded-xl bg-gray-50 border border-gray-200"
            />
            <label className="text-xs text-gray-500">Окончание</label>
            <input
              type="datetime-local"
              value={form.end_time || ''}
              onChange={(e) => setForm({ ...form, end_time: e.target.value })}
              className="w-full mb-3 px-3 py-2 rounded-xl bg-gray-50 border border-gray-200"
            />
            <input
              placeholder="Ссылка на облако (Яндекс.Диск, Google Drive)"
              value={form.cloud_link || ''}
              onChange={(e) => setForm({ ...form, cloud_link: e.target.value })}
              className="w-full mb-3 px-3 py-2 rounded-xl bg-gray-50 border border-gray-200"
            />
            <textarea
              placeholder="Комментарий"
              value={form.comment || ''}
              onChange={(e) => setForm({ ...form, comment: e.target.value })}
              className="w-full mb-3 px-3 py-2 rounded-xl bg-gray-50 border border-gray-200 h-20 resize-none"
            />
            <div className="flex justify-end gap-2 mt-2">
              <button
                onClick={() => setShowForm(false)}
                className="px-4 py-2 rounded-xl border border-gray-200 text-gray-700"
              >
                Отмена
              </button>
              <button
                onClick={createAppointment}
                className="px-4 py-2 rounded-xl bg-gray-900 text-white"
              >
                Создать
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}