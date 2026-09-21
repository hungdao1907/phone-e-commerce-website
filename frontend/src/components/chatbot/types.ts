export type ChatRole = 'user' | 'assistant';

export interface ChatbotProduct {
  id?: string;
  name?: string;
  brand?: string;
  description?: string;
  image_url?: string;
  price?: number;
  original_price?: number;
  stock?: number;
  availability?: string;
  storage_gb?: number;
  ram_gb?: number;
  color?: string;
}

export interface QuickPrompt {
  label: string;
  query: string;
  icon?: string;
}

export interface ChatMessage {
  id: string;
  role: ChatRole;
  text?: string;
  createdAt: number;
  timeString?: string;
  resultType?: string;
  products?: ChatbotProduct[];
  quotation?: {
    responseType?: 'text' | 'file';
    success?: boolean;
    quoteStatus?: string;
    quoteNumber?: string;
    fileName?: string;
    mimeType?: string;
    downloadUrl?: string;
    totalDisplay?: string;
  };
  isLoading?: boolean;
  isError?: boolean;
}
