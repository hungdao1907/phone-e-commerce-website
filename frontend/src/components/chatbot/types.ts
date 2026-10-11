export type ChatRole = 'user' | 'assistant';

export interface ChatbotVariant {
  id: string;
  sku?: string;
  attributes: Record<string, string | number | boolean>;
  stock: number;
  price: number | null;
  original_price: number | null;
  availability: 'in_stock' | 'out_of_stock';
}

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
  variants?: ChatbotVariant[];
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
    quoteStatus?: string;
  };
  isLoading?: boolean;
  isError?: boolean;
}
