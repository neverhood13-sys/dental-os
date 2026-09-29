export type Role = 'chief_doctor' | 'doctor' | 'admin';

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  role: Role;
  clinic_id: string | null;
  permissions: Record<string, boolean>;
}

export interface Clinic {
  id: string;
  name: string;
  address?: string;
  phone?: string;
}

export interface CloudLink {
  title: string;
  url: string;
  provider: 'yandex' | 'google' | 'other';
}

export interface Patient {
  id: string;
  clinic_id: string;
  full_name: string;
  gender?: 'male' | 'female';
  birth_date?: string;
  phone?: string;
  anamnesis?: string;
  balance: number;
  cloud_links: CloudLink[];
}

export interface Service {
  id: string;
  clinic_id: string;
  code: string;
  name: string;
  price: number;
  discount_percent: number;
  discount_absolute: number;
  icon?: string;
  status?: string;
}

export interface PlanItem {
  id: string;
  plan_id: string;
  service_id: string;
  tooth_number?: number;
  quantity: number;
  status: 'planned' | 'in_progress' | 'done' | 'cancelled';
  notes?: string;
}

export interface Appointment {
  id: string;
  clinic_id: string;
  patient_id?: string;
  doctor_id?: string;
  title?: string;
  start_time: string;
  end_time: string;
  comment?: string;
  cloud_link?: string;
  color?: string;
}