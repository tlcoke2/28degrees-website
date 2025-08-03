export interface SiteSettings {
  id: string;
  siteTitle: string;
  siteDescription: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  socialMedia: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
    linkedin?: string;
    youtube?: string;
  };
  seo: {
    metaTitle: string;
    metaDescription: string;
    metaKeywords: string[];
  };
  maintenanceMode: boolean;
  allowRegistrations: boolean;
  defaultUserRole: 'user' | 'guide' | 'admin';
  currency: string;
  timezone: string;
  dateFormat: string;
  timeFormat: string;
  itemsPerPage: number;
  enableAnalytics: boolean;
  googleAnalyticsId?: string;
  enableEmailNotifications: boolean;
  emailSender: string;
  emailTemplates: {
    welcomeEmail: string;
    bookingConfirmation: string;
    passwordReset: string;
    contactForm: string;
  };
  updatedAt: string;
  updatedBy: string;
}

export interface UpdateSettingsDto extends Partial<Omit<SiteSettings, 'id' | 'updatedAt' | 'updatedBy'>> {}

export interface SettingsFormData {
  siteTitle: string;
  siteDescription: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  socialMedia: {
    facebook: string;
    twitter: string;
    instagram: string;
    linkedin: string;
    youtube: string;
  };
  seo: {
    metaTitle: string;
    metaDescription: string;
    metaKeywords: string;
  };
  maintenanceMode: boolean;
  allowRegistrations: boolean;
  defaultUserRole: 'user' | 'guide' | 'admin';
  currency: string;
  timezone: string;
  dateFormat: string;
  timeFormat: string;
  itemsPerPage: number;
  enableAnalytics: boolean;
  googleAnalyticsId: string;
  enableEmailNotifications: boolean;
  emailSender: string;
}
