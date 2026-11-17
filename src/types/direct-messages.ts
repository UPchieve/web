import type { ISODateString, Uuid } from './shared'

export type DirectMessage = {
  id: Uuid
  conversationId: Uuid
  senderId: Uuid
  contents: string
  createdAt: ISODateString
}

export type DirectMessagesResponse = {
  messages: DirectMessage[]
}

export type ReportDirectMessagePayload = {
  reportReason: string
  reportMessage?: string
}

export type ReportDirectMessageResponse = {
  reportId: Uuid
}

export type SendDirectMessagePayload = {
  conversationId: Uuid
  contents: string
  clientMessageId?: string
}

export type NewDirectMessageEvent = DirectMessage & {
  clientMessageId?: string
}

export type DirectMessageErrorEvent = {
  conversationId?: Uuid
  clientMessageId?: string
}

export type GetOrCreateConversationRequest = {
  partnerId: Uuid
}

export type GetOrCreateConversationResponse = {
  conversationId: Uuid
}

export type UnreadDirectMessagesResponse = {
  senderIds: Uuid[]
}

export type MessageFilterOption = 'new' | 'none'

export type DirectMessageReviewConversation = {
  id: Uuid
  studentId: Uuid
  volunteerId: Uuid
  studentName: string
  volunteerName: string
}

export type DirectMessageReviewSummary = DirectMessageReviewConversation & {
  oldestFlagAt: ISODateString
  pendingFlags: number
  reasons: string[]
}

export type DirectMessageReviewFlag = {
  id: Uuid
  category: string
  createdAt: ISODateString
  censoredMessage?: string
  senderId?: Uuid
  blocked?: boolean
  censoredBy?: string
  reasons?: string[]
  reportMessage?: string
  reportReason?: string
  reportingUserId?: Uuid
  reportedUserId?: Uuid
}

export type DirectMessageReviewMessage = {
  id: Uuid
  senderId: Uuid
  contents: string
  createdAt: ISODateString
}

export type DirectMessageReviewHistory = {
  messages: DirectMessageReviewMessage[]
  hasMore: boolean
}

export type DirectMessageReview = DirectMessageReviewHistory & {
  conversation: DirectMessageReviewConversation
  flags: DirectMessageReviewFlag[]
}
