export interface StorySegment {
  id: string;
  text: string;
  imagePrompt: string;
  imageUrl?: string;
  options: string[];
  userChoice?: string;
}

export interface GameState {
  history: StorySegment[];
  inventory: string[];
  quest: string;
  isLoading: boolean;
  characterName: string;
}

export interface AdventureResponse {
  text: string;
  options: string[];
  imagePrompt: string;
  inventoryUpdate: {
    add: string[];
    remove: string[];
  };
  questUpdate: string | null;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
}

declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }
}