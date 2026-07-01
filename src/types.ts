export interface Contact {
  _id?: string;
  name: string;
  phone: string;
  ip: string;
  country: string;
  browser: string;
  device: string;
  createdAt: Date | string;
}

export interface Visit {
  _id?: string;
  timestamp: Date | string;
  ip: string;
  country: string;
  browser: string;
  device: string;
}

export interface VcfBatch {
  _id?: string;
  batchNumber: number;
  filename: string;
  contactsCount: number;
  vcfData: string;
  createdAt: Date | string;
}

export interface AppSettings {
  downloadThreshold: number;
  whatsappGroupUrl: string;
  whatsappChannelUrl: string;
  adminPin: string; // Stored securely
  currentCounter: number;
}

export interface DashboardStats {
  totalContacts: number;
  contactsToday: number;
  totalVisits: number;
  onlineVisitors: number;
  downloadHistory: VcfBatch[];
  recentContacts: Contact[];
  failedSubmissions?: FailedSubmission[];
  totalFailedSubmissions?: number;
  threshold: number;
  currentCounter: number;
  whatsappGroupUrl: string;
  whatsappChannelUrl: string;
}

export interface FailedSubmission {
  _id?: string;
  name: string;
  phone: string;
  ip: string;
  country: string;
  browser: string;
  device: string;
  reason: string;
  createdAt: Date | string;
}

export interface SubmissionStats {
  date: string;
  count: number;
}

export interface AnalyticsData {
  totalVisits: number;
  uniqueVisitors: number;
  dailyVisits: { date: string; count: number }[];
  submissionsByDay: SubmissionStats[];
  browsers: { name: string; value: number }[];
  devices: { name: string; value: number }[];
  countries: { name: string; value: number }[];
}
