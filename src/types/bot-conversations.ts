import type { Uuid } from './shared'

export type TutorBotSenderType = 'student' | 'volunteer' | 'bot'
export type TutorBotHumanSenderType = Exclude<TutorBotSenderType, 'bot'>

export type TutorBotMessagePublic = {
  tutorBotConversationId: Uuid
  userId: Uuid
  senderUserType: TutorBotSenderType
  message: string
  createdAt: string
}

export type TutorBotTranscriptPublic = {
  conversationId: Uuid
  subjectId: number
  sessionId?: Uuid
  messages: TutorBotMessagePublic[]
}

export type TutorBotGeneratedMessagePublic = TutorBotMessagePublic & {
  traceId: string
  observationId: string | null
  status: string
}

export type TutorBotAddMessageResponsePublic = {
  userMessage: TutorBotMessagePublic
  botResponse: TutorBotGeneratedMessagePublic
}

export type TutorBotNewConversationPublic = {
  conversationId: Uuid
  userId: Uuid
  sessionId?: Uuid
  subjectId: number
  messages: [TutorBotMessagePublic, TutorBotGeneratedMessagePublic]
}

export type TutorBotAddMessagePayload = {
  userId: Uuid
  conversationId: Uuid
  message: string
  senderUserType: TutorBotHumanSenderType
  sessionId?: Uuid
  subjectName: string
  snapshotBlob?: Blob
}

export type TutorBotSystemMessage = {
  senderUserType: 'system'
  message: string
}

export type TutorBotCreateConvoPayload = {
  userId: Uuid
  sessionId?: Uuid
  message: string
  senderUserType: TutorBotHumanSenderType
  subjectId: number
}
