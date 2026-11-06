export interface User {
  id: string;
  name: string;
  email: string;
  cpf_masked: string;
  phone: string;
  birth_date: string;
  sus_card: string;
  dyslexia_mode: boolean;
  colorblind_mode: string;
  font_scale: string;
  lgpd_consent: boolean;
  created_at: string;
}

export interface UBSUnit {
  id: string;
  name: string;
  code: string;
  address: string;
  neighborhood: string;
  city: string;
  phone: string;
  opening_hours: string;
  specialties: string[];
  accessible_facilities: string[];
}

export interface Doctor {
  id: string;
  ubs_id: string;
  name: string;
  crm: string;
  specialty: string;
  bio: string;
}

export interface TimeSlot {
  time: string;
  available: boolean;
  shift: 'Manhã' | 'Tarde';
}

export interface Appointment {
  id: string;
  user_id: string;
  ubs_id: string;
  ubs_name: string;
  doctor_id: string;
  doctor_name: string;
  appointment_date: string;
  appointment_time: string;
  specialty: string;
  reason: string;
  status: 'agendada' | 'confirmada' | 'realizada' | 'cancelada';
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface MedicalHistoryItem {
  id: string;
  user_id: string;
  ubs_name: string;
  doctor_name: string;
  specialty: string;
  appointment_date: string;
  appointment_time: string;
  diagnosis: string;
  prescription: string;
  recommendations: string;
  status: string;
}

export type ColorblindMode = 'default' | 'protan-deutan' | 'tritan' | 'high-contrast';
export type FontScale = 'normal' | 'medium' | 'large';
