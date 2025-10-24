//TODO: Migrate this file to a composable once all Vue components use the composition api

export const IMAGE_UPLOAD_EVENTS = {
  MODERATING_IMAGE: 'moderatingImage',
  IMAGE_UPLOAD_FAILED: 'imageUploadFailed',
  IMAGE_UPLOAD_SUCCESS: 'imageUploadSuccess',
  PARTNER_UPLOADING_IMAGE: 'partnerUploadingImage',
  PARTNER_IMAGE_UPLOAD_FAILED: 'partnerImageUploadFailed',
  PARTNER_IMAGE_UPLOAD_SUCCESS: 'partnerImageUploadSuccess',
}

export const PARTNER_IMAGE_UPLOAD_STATUS = {
  MODERATION_FAILURE: 'moderation_failure',
  GENERAL_ERROR: 'general_failure',
  PARTNER_UPLOADING: 'partner_uploading',
  SUCCESS: 'success',
}

export const IMAGE_UPLOADING_STATE_MESSAGES = {
  SENDER: {
    [IMAGE_UPLOAD_EVENTS.MODERATING_IMAGE]: 'Processing Image',
    [IMAGE_UPLOAD_EVENTS.IMAGE_UPLOAD_FAILED]:
      'There was an issue uploading the image. Please try a different image, or reach out to support@upchieve.org for assistance.',
  },
  PARTNER: {
    [IMAGE_UPLOAD_EVENTS.PARTNER_UPLOADING_IMAGE]: {
      student: 'Hang tight — Your coach is sharing an image with you!',
      coach: 'The student is sharing an image with you!',
    },
    [IMAGE_UPLOAD_EVENTS.PARTNER_IMAGE_UPLOAD_FAILED]: {
      student: "The coach's image could not be uploaded.",
      coach: "The student's image could not be uploaded.",
    },
  },
}

export function getPartnerUploadingMsg(isStudent: boolean) {
  const messages =
    IMAGE_UPLOADING_STATE_MESSAGES.PARTNER[
      IMAGE_UPLOAD_EVENTS.PARTNER_UPLOADING_IMAGE
    ]
  return isStudent ? messages.student : messages.coach
}

export function getPartnerUploadFailedMsg(isStudent: boolean) {
  const messages =
    IMAGE_UPLOADING_STATE_MESSAGES.PARTNER[
      IMAGE_UPLOAD_EVENTS.PARTNER_IMAGE_UPLOAD_FAILED
    ]
  return isStudent ? messages.student : messages.coach
}
