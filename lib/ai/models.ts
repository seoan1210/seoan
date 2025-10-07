export const DEFAULT_CHAT_MODEL: string = 'chat-model';

export interface ChatModel {
  id: string;
  name: string;
  description: string;
}

export const chatModels: Array<ChatModel> = [
  {
    id: 'chat-model',
    name: 'Seoan 2',
    description: '모든 종류의 대화에 최적화된 기본 모델',
  },
  {
    id: 'chat-model-reasoning',
    name: 'Seoan 2 PRO',
    description: '복잡한 문제 해석 및 논리적 사고에 특화된 모델',
  },
];
