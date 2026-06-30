import { Contact, DashboardStats, AnalyticsData, AppSettings } from '../types';

// Helper to get authorization headers if logged in
function getAuthHeaders() {
  const pin = localStorage.getItem('sila_vcf_admin_token') || '';
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${pin}`
  };
}

export const ApiService = {
  // Public APIs
  async getSettings(): Promise<{
    downloadThreshold: number;
    whatsappGroupUrl: string;
    whatsappChannelUrl: string;
    currentCounter: number;
  }> {
    const res = await fetch('/api/settings');
    if (!res.ok) throw new Error('Failed to load settings');
    return res.json();
  },

  async submitContact(name: string, phone: string): Promise<{
    success: boolean;
    contact: Contact;
    triggerDownload: boolean;
    vcfFilename: string;
    vcfData: string;
    batchNumber: number;
    currentCounter: number;
    threshold: number;
    error?: string;
  }> {
    const res = await fetch('/api/contacts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, phone })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to save contact');
    return data;
  },

  async trackVisit(): Promise<void> {
    try {
      await fetch('/api/visits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (e) {
      console.error('Failed to track visit:', e);
    }
  },

  // Admin APIs
  async login(pin: string): Promise<{ success: boolean; token: string }> {
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed');
    return data;
  },

  async getDashboard(): Promise<DashboardStats> {
    const res = await fetch('/api/admin/dashboard', {
      headers: getAuthHeaders()
    });
    if (!res.ok) {
      if (res.status === 401 || res.status === 403) {
        localStorage.removeItem('sila_vcf_admin_token');
      }
      throw new Error('Unauthorized or session expired');
    }
    return res.json();
  },

  async getAnalytics(): Promise<AnalyticsData> {
    const res = await fetch('/api/admin/analytics', {
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error('Failed to load analytics data');
    return res.json();
  },

  async searchContacts(search: string, limit = 100): Promise<Contact[]> {
    const res = await fetch(`/api/admin/contacts?search=${encodeURIComponent(search)}&limit=${limit}`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error('Failed to fetch contacts');
    return res.json();
  },

  async deleteContact(id: string): Promise<void> {
    const res = await fetch(`/api/admin/contacts/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error('Failed to delete contact');
  },

  async updateSettings(settings: Partial<AppSettings>): Promise<void> {
    const res = await fetch('/api/admin/settings', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(settings)
    });
    if (!res.ok) throw new Error('Failed to update settings');
  },

  async manualGenerateVcf(): Promise<{
    success: boolean;
    message: string;
    batch: any;
    currentCounter: number;
  }> {
    const res = await fetch('/api/admin/generate-vcf', {
      method: 'POST',
      headers: getAuthHeaders()
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to generate manual VCF');
    return data;
  },

  async resetCounter(): Promise<void> {
    const res = await fetch('/api/admin/reset', {
      method: 'POST',
      headers: getAuthHeaders()
    });
    if (!res.ok) throw new Error('Failed to reset counter');
  }
};
