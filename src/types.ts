export type Platform = 'Instagram' | 'WhatsApp' | 'Twitter' | 'Facebook';

export interface SocialMessage {
  id: string;
  sender: string;
  avatar: string;
  message: string;
  platform: Platform;
  timestamp: Date;
  status: 'pending' | 'responded' | 'ignored';
  aiResponse?: string;
}

export interface AIConfig {
  personality: string;
  language: string;
  autoReplyEnabled: boolean;
  ignoredKeywords: string[];
  whatsappPhoneId?: string;
  whatsappAccessToken?: string;
  displayPhoneNumber?: string;
  instagramAccountId?: string;
  instagramAccessToken?: string;
  userName?: string;
  userAvatar?: string;
  theme?: 'light' | 'dark';
  meliUserId?: string;
  meliAccessToken?: string;
  meliSyncEnabled?: boolean;
}

export interface PlatformStatus {
  platform: Platform;
  connected: boolean;
  activeResponses: number;
}
