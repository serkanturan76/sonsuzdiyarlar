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

// Window augmentation for aistudio
declare global {
  // We define the AIStudio interface to match the existing global declaration's type.
  // We do not redeclare 'aistudio' on Window to avoid "Subsequent property declarations" conflict.
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }
}