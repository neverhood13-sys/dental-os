import type { Appointment } from '../types';

const pad = (n: number) => String(n).padStart(2, '0');

const fmt = (d: string) => {
  const dt = new Date(d);
  return (
    dt.getUTCFullYear() +
    pad(dt.getUTCMonth() + 1) +
    pad(dt.getUTCDate()) +
    'T' +
    pad(dt.getUTCHours()) +
    pad(dt.getUTCMinutes()) +
    pad(dt.getUTCSeconds()) +
    'Z'
  );
};

export function buildICS(appointments: Appointment[], clinicName: string) {
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//DentalOS//RU',
    `X-WR-CALNAME:${clinicName}`,
  ];

  for (const a of appointments) {
    lines.push(
      'BEGIN:VEVENT',
      `UID:${a.id}@dentalos`,
      `DTSTAMP:${fmt(new Date().toISOString())}`,
      `DTSTART:${fmt(a.start_time)}`,
      `DTEND:${fmt(a.end_time)}`,
      `SUMMARY:${a.title || 'Приём'}`,
      a.comment ? `DESCRIPTION:${a.comment.replace(/\n/g, '\\n')}` : '',
      a.cloud_link ? `URL:${a.cloud_link}` : '',
      'END:VEVENT'
    );
  }

  lines.push('END:VCALENDAR');
  return lines.filter(Boolean).join('\r\n');
}

export function downloadICS(appointments: Appointment[], clinicName: string) {
  const ics = buildICS(appointments, clinicName);
  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'dentalos-calendar.ics';
  a.click();
  URL.revokeObjectURL(url);
}

export function googleCalendarLink(a: Appointment) {
  const fmtG = (d: string) =>
    new Date(d).toISOString().replace(/[-:]|\.\d{3}/g, '');
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: a.title || 'Приём',
    dates: `${fmtG(a.start_time)}/${fmtG(a.end_time)}`,
    details: a.comment || '',
    location: a.cloud_link || '',
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}