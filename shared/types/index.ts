export type MedicineForm = 'tablet' | 'capsule' | 'liquid' | 'injection' | 'patch' | 'other';
export type FrequencyUnit = 'daily' | 'weekly' | 'as_needed';
export type DoseStatus = 'pending' | 'taken' | 'missed' | 'skipped' | 'snoozed';
export type Theme = 'light' | 'dark' | 'system';
export type BridgeEventType =
  | 'READY'
  | 'AUTH_REQUEST' | 'AUTH_RESULT'
  | 'AUTH_SETUP'
  | 'PROFILE_SAVE' | 'PROFILE_LOAD' | 'PROFILE_LOAD_RESULT'
  | 'SCHEDULE_SAVE' | 'SCHEDULE_LOAD' | 'SCHEDULE_LOAD_RESULT'
  | 'DOSE_LOG_SAVE' | 'DOSE_LOG_SAVE_RESULT'
  | 'NOTIFICATION_SCHEDULE' | 'NOTIFICATION_CANCEL' | 'NOTIFICATION_RESULT'
  | 'OFFLINE_SYNC' | 'OFFLINE_SYNC_RESULT'
  | 'THEME_SET'
  | 'SEND_MESSAGE' | 'SEND_MESSAGE_RESULT';

export interface BridgeMessage<T = unknown> {
  event: BridgeEventType;
  requestId: string;
  payload: T;
  timestamp: string;
}

export interface UserProfile {
  id: string;
  name: string;
  dateOfBirth: string;
  photoUri?: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  caregiverName?: string;
  caregiverPhone?: string;
  biometricEnabled: boolean;
  theme: Theme;
  createdAt: string;
  updatedAt: string;
}

export interface Medicine {
  id: string;
  userId: string;
  name: string;
  brandName?: string;
  strength: number;
  unit: string;
  form: MedicineForm;
  color?: string;
  instructions?: string;
  prescribedBy?: string;
  totalPills?: number;
  remainingPills?: number;
  refillThreshold?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DoseSchedule {
  id: string;
  medicineId: string;
  userId: string;
  frequency: FrequencyUnit;
  timesPerDay: number;
  scheduledTimes: string[];
  daysOfWeek?: number[];
  startDate: string;
  endDate?: string;
  notificationIds: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DoseLog {
  id: string;
  scheduleId: string;
  medicineId: string;
  userId: string;
  scheduledAt: string;
  loggedAt?: string;
  status: DoseStatus;
  aiSuggested: boolean;
  aiReasoning?: string;
  notes?: string;
  createdAt: string;
}

export interface CaregiverSettings {
  id: string;
  userId: string;
  caregiverName: string;
  caregiverPhone: string;
  caregiverEmail?: string;
  notifyOnMissed: boolean;
  notifyOnRefillNeeded: boolean;
  summaryFrequency: 'daily' | 'weekly' | 'never';
}

export interface AIResponse {
  reasoning: string;
  suggestion: string;
  confidence: 'low' | 'medium' | 'high';
  disclaimer: string;
}
