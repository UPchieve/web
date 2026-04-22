import type { DateString, Uuid } from './shared'

export type SessionMessageType = 'audio-transcription'

export type SessionUserInfoPublic = {
  // TODO: migrate all uses of `_id` to `id`
  _id: Uuid
  id: Uuid
  // TODO: remove `firstname` in favor of `firstName`. The frontend must be refactored first
  firstname: string
  firstName: string
  gradeLevel?: number
}

export type SessionMessagePublic = {
  user: Uuid
  contents: string
  createdAt: Date
}

export type ToolTypes = 'whiteboard' | 'documenteditor'

export type CurrentSessionPublic = {
  _id: Uuid
  id: Uuid
  studentId: Uuid
  volunteerId?: Uuid
  student: SessionUserInfoPublic
  volunteer?: SessionUserInfoPublic
  volunteerJoinedAt?: Date
  messages: SessionMessagePublic[]
  toolType: ToolTypes
  docEditorVersion?: number
  studentBannedFromLiveMedia?: boolean
  volunteerBannedFromLiveMedia?: boolean
  volunteerLanguages?: string[]
  // TODO: Rename this property, this refers to a topic's name
  type: string
  subTopic: string
  createdAt: Date
  endedAt?: Date
  endedBy?: Uuid
}

type Message = {
  sessionId: Uuid
  contents: string
  createdAt: DateString | Date
}

type ChatBotMessage = Message & {
  user: null
  hasHtml: boolean
}

type SystemMessage = Message & {
  user: null
  isSystemMessage: boolean
}

export type UserMessage = Message & {
  isVolunteer: boolean
  userType: string
  user: Uuid
  type?: SessionMessageType
  transcript?: string
  zoomMessageId?: string
  msgId?: string
}

export type PendingMessage = Message & {
  user: Uuid
  userType: string
  type: 'audio-transcription'
  msgId: string
  transcript?: string
}

export type SessionMessage =
  | UserMessage
  | SystemMessage
  | ChatBotMessage
  | PendingMessage
