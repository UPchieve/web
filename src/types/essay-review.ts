export type EssayReviewStatus = 'pending' | 'reviewed'

export type EssayReviewSubmission = {
  id: string
  userId: string
  studentEmail: string
  studentFirstName?: string
  essay: string
  essayPurpose?: string
  essayPrompt?: string
  additionalContext?: string
  reviewReasons: string[]
  reviewEmail?: string
  wordCount: number
  characterCount: number
  status: EssayReviewStatus
  submittedAt: string
  reviewedAt?: string
  reviewedBy?: string
}
