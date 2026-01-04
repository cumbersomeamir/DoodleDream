
export type ImageSize = '1K' | '2K' | '4K';

export interface ColoringPage {
  id: string;
  url: string;
  status: 'pending' | 'generating' | 'completed' | 'error';
  prompt: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface BookConfig {
  theme: string;
  childName: string;
  imageSize: ImageSize;
}
