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
