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
  staffReviewedAt?: string
  staffReviewerId?: string
  reviews: TutorEssayReview[]
  finalReviews?: string[]
  emailSentAt?: string
}

export type TutorEssayReview = {
  id: string
  reviewerId: string
  reviewerFirstName?: string
  review: string
  submittedAt: string
}

export type EssayReviewSubmissionForVolunteer = Omit<
  EssayReviewSubmission,
  'userId' | 'studentEmail' | 'studentFirstName' | 'reviews'
> & {
  reviewCount: number
  hasReviewed: boolean
}
