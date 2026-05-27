import type { IconName } from "@/components/LineIcon";
import content from "@/data/site-content.json";

export type PhotoItem = {
  label: string;
  src?: string;
  date?: string;
  month?: string;
  project?: string;
  city?: string;
  note?: string;
  tags?: string[];
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
    uploadDir?: string;
    bookCoverDir?: string;
    notes: string[];
    photos: PhotoItem[];
    records?: Array<{
      date: string;
      title: string;
      summary: string;
      tags: string[];
    }>;
    plans?: Array<{
      title: string;
      focus: string;
      items: string[];
    }>;
    workouts?: Array<{
      date: string;
      title: string;
      parts: string[];
      duration: string;
      intensity: string;
      summary: string;
    }>;
    phrases?: Array<{
      text: string;
      jyutping?: string;
      meaning: string;
      scene: string;
      note?: string;
    }>;
    inputs?: Array<{
      type: string;
      title: string;
      date: string;
      note: string;
    }>;
    learningLogs?: Array<{
      date: string;
      type: string;
      title: string;
      summary: string;
      tags?: string[];
    }>;
    checkins?: Array<{
      date: string;
      label: string;
      content?: string;
      duration?: string;
      note?: string;
      src?: string;
    }>;
    essays?: Array<{
      date: string;
      title: string;
      type: string;
      summary: string;
      tags: string[];
    }>;
    books?: Array<{
      title: string;
      author: string;
      status: string;
      cover?: string;
      coverTone: string;
      notes: Array<{
        type: string;
        text: string;
      }>;
    }>;
    shows?: Array<{
      title: string;
      creator: string;
      kind: string;
      status: string;
      poster?: string;
      posterTone: string;
      meta: string;
      characters: Array<{
        name: string;
        note: string;
      }>;
      notes: Array<{
        type: string;
        text: string;
      }>;
    }>;
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
  contactProfile: {
    eyebrow: string;
    description: string;
    email: string;
    wechat: string;
    wechatQr: string;
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
export const contactProfile = siteContent.contactProfile;
