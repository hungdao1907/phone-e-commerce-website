export type FooterSectionType = 'column' | 'bottom';

export interface FooterLink {
  id: string;
  label: string;
  url: string;
  sortOrder: number;
  isActive: boolean;
}

export interface FooterSection {
  id: string;
  type: FooterSectionType;
  title?: string;
  copyrightText?: string;
  sortOrder: number;
  isActive: boolean;
  links: FooterLink[];
  createdAt?: string;
  updatedAt?: string;
}

export type FooterLinkFormState = {
  id: string;
  label: string;
  url: string;
  sortOrder: number;
  isActive: boolean;
};

export interface FooterSectionFormState {
  type: FooterSectionType;
  title: string;
  copyrightText: string;
  sortOrder: number;
  isActive: boolean;
  links: FooterLinkFormState[];
}
