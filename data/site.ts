import type { IconName } from "@/components/LineIcon";
import content from "@/data/site-content.json";

export type PhotoItem = {
  label: string;
  src?: string;
};

export type SiteContent = {
  navItems: Array<{ href: string; label: string }>;
  hero: {
    eyebrow: string;
    title: string;
    description: string;
  };
  heroTags: string[];
  heroCards: Array<{
    title: string;
    subtitle: string;
    detail: string;
    icon: IconName;
    className: string;
    tone: string;
  }>;
  activitySpotlights: Array<{
    title: string;
    status: string;
    summary: string;
    icon: IconName;
    tone: string;
    notes: string[];
    photos: PhotoItem[];
  }>;
  statusItems: Array<{
    title: string;
    english: string;
    detail: string;
    icon: IconName;
    tone: string;
  }>;
  interests: Array<{
    title: string;
    english: string;
    description: string;
    icon: IconName;
    tone: string;
    className: string;
  }>;
  journalPosts: Array<{
    date: string;
    category: string;
    title: string;
    summary: string;
    body: string;
    icon: IconName;
  }>;
  galleryItems: Array<{
    category: string;
    caption: string;
    detail: string;
    tone: string;
    className: string;
    photos: PhotoItem[];
  }>;
  projects: Array<{
    title: string;
    description: string;
    status: string;
    tags: string[];
  }>;
  contacts: Array<{ label: string; icon: IconName }>;
  contactProfile: {
    eyebrow: string;
    description: string;
    email: string;
    wechat: string;
    wechatQr: string;
    footer: string;
  };
};

export const siteContent = content as SiteContent;

export const navItems = siteContent.navItems;
export const hero = siteContent.hero;
export const heroTags = siteContent.heroTags;
export const heroCards = siteContent.heroCards;
export const activitySpotlights = siteContent.activitySpotlights;
export const statusItems = siteContent.statusItems;
export const interests = siteContent.interests;
export const journalPosts = siteContent.journalPosts;
export const galleryItems = siteContent.galleryItems;
export const projects = siteContent.projects;
export const contacts = siteContent.contacts;
export const contactProfile = siteContent.contactProfile;
