import errcode from 'err-code'
import promiseRetry from 'promise-retry'
import config from '../config'
import axios from 'axios'
import type { AxiosError, AxiosRequestConfig } from 'axios'
import type { ImpactStudyCampaign } from '@/types'
import type { NTHSActionName } from './NTHSGroupService'
import type { AdvisorInfo } from '@/components/NTHS/SchoolAffiliation/school-affiliation-machine'
import type { CurrentSessionPublic } from '@/types/sessions'
import type { Uuid } from '@/types/shared'
import type {
  TutorBotAddMessagePayload,
  TutorBotAddMessageResponsePublic,
  TutorBotCreateConvoPayload,
  TutorBotNewConversationPublic,
  TutorBotTranscriptPublic,
} from '@/types/bot-conversations'

const AUTH_ROOT = `${config.serverRoot}/auth`
const API_ROOT = `${config.serverRoot}/api`
const API_PUBLIC_ROOT = `${config.serverRoot}/api-public`
const ADMIN_ROOT = `${API_ROOT}/admin`
const ELIGIBILITY_API_ROOT = `${config.serverRoot}/api-public/eligibility`
const CONTACT_API_ROOT = `${config.serverRoot}/api-public/contact`
const REFERENCE_API_ROOT = `${config.serverRoot}/api-public/reference`
const REFERRAL_API_ROOT = `${config.serverRoot}/api-public/referral`
const VERSION_ROOT = config.appRoot

const FAULT_TOLERANT_HTTP_TIMEOUT = 10000
const FAULT_TOLERANT_HTTP_MAX_RETRY_TIMEOUT = 100000
const FAULT_TOLERANT_HTTP_MAX_RETRIES = 10

export class NetworkError extends Error {
  status?: number

  constructor(message: string, status?: number) {
    super(message)
    this.name = 'NetworkError'
    this.status = status
  }
}

export function isNetworkError(err: unknown): err is NetworkError {
  return err instanceof NetworkError
}

export const axiosInstance = axios.create({
  withCredentials: true,
  baseURL: config.serverRoot,
})
const axiosFetchInstance = axios.create({
  adapter: 'fetch',
  withCredentials: true,
  baseURL: config.serverRoot,
})

async function getRecaptchaToken(action: string): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    window.grecaptcha.ready(() => {
      window.grecaptcha.execute(config.googleRecaptchaKey, { action }).then(
        (token: string) => resolve(token),
        () => reject()
      )
    })
  })
}

async function getAdditionalConfig(action: string) {
  const token = await getRecaptchaToken(action)
  return { headers: { 'g-recaptcha-response': token } }
}

export async function httpGet<T>(path: string, config?: object) {
  return axiosInstance.get<T>(path, config)
}

// TODO: Use generics instead of Object.
// TODO: Move NetworkError conversion into these helpers instead of
// the handling the error through `_errorHandler` and `_axiosErrorHandler`
export async function httpPost<T>(
  path: string,
  data: object,
  config?: AxiosRequestConfig
) {
  return axiosInstance.post<T>(path, data, config)
}

export async function httpPut<T>(
  path: string,
  data: object,
  config?: AxiosRequestConfig
) {
  return axiosInstance.put<T>(path, data, config)
}

export async function httpPatch<T>(
  path: string,
  data: object,
  config?: AxiosRequestConfig
) {
  return axiosInstance.patch<T>(path, data, config)
}

export async function httpDelete<T>(path: string, config?: AxiosRequestConfig) {
  return axiosInstance.delete<T>(path, config)
}

/*
 * Axios uses xhr by default (rather than fetch).
 * We need to use their fetch adapter to take advantage of the new-ish `keepalive`
 * flag. `keepalive` works like `navigator.sendBeacon` in that it is guaranteed to send
 * even after the page `unload` event fires. Unlike `sendBeacon`, it allows us to use a
 * regular post (with headers, etc...)
 *
 * see https://developer.mozilla.org/en-US/docs/Web/API/Request/keepalive
 *
 * we could switch our default axios instance to use the `fetch` adapter but
 * it seems a little risky and out of scope for this current change.
 */
export async function httpPostKeepAlive<T>(path: string, data: object) {
  return axiosFetchInstance.post<T>(path, data, {
    headers: axiosInstance.defaults.headers.common,
    fetchOptions: {
      credentials: 'include',
      keepalive: true,
    },
  })
}

export default {
  _successHandler(res) {
    return Promise.resolve(res)
  },
  _errorHandler(res) {
    return Promise.reject(res)
  },
  _axiosErrorHandler(res: AxiosError): never {
    const message =
      (res.response?.data as { err?: string })?.err ??
      res.message ??
      'An unexpected network error occurred.'
    const status = res.response?.status
    throw new NetworkError(message, status)
  },
  _faultTolerantHttp<T>(
    method: 'get' | 'post',
    onRetry: (res: any, fn: () => void) => void,
    url: string,
    data?: T & AxiosRequestConfig<T>
  ) {
    const promiseToRetry = () => {
      return (
        ['get', 'delete', 'head', 'jsonp'].indexOf(method) !== -1
          ? axiosInstance[method](url, {
              timeout: FAULT_TOLERANT_HTTP_TIMEOUT,
            })
          : axiosInstance[method](url, data, {
              timeout: FAULT_TOLERANT_HTTP_TIMEOUT,
            })
      ).then(this._successHandler, this._errorHandler)
    }

    // object property specifying whether this function is aborted
    const requestState = { isAborted: false }

    return promiseRetry(
      async (retry: () => void) => {
        if (requestState.isAborted) {
          // early exit
          throw errcode(new Error('Aborted by user'), 'EUSERABORTED')
        }

        // TODO: This method isn't actually fault tolerant.
        // afaik, we don't ever send status of 0 (not that we should),
        // so the retry never runs, instead we immediately throw the error.
        return promiseToRetry().catch((res) => {
          if (res.status === 0) {
            if (onRetry) {
              onRetry(res, () => {
                requestState.isAborted = true
              })
            }
            retry(res)
          }

          throw res
        })
      },
      {
        retries: FAULT_TOLERANT_HTTP_MAX_RETRIES,
        maxTimeout: FAULT_TOLERANT_HTTP_MAX_RETRY_TIMEOUT,
      }
    )
  },

  // Server route defintions
  async getBootstrappedFeatureFlags() {
    return httpGet(`${API_PUBLIC_ROOT}/feature-flags`).then(
      this._successHandler,
      this._errorHandler
    )
  },
  authStatus() {
    return httpGet(`${AUTH_ROOT}/status`).then(
      this._successHandler,
      this._errorHandler
    )
  },
  login(data) {
    return httpPost(`${AUTH_ROOT}/login`, data).then(
      this._successHandler,
      this._errorHandler
    )
  },
  logout() {
    return httpGet(`${AUTH_ROOT}/logout`).then(
      this._successHandler,
      this._errorHandler
    )
  },
  checkRegister(data) {
    return httpPost(`${AUTH_ROOT}/register/checkcred`, data).then(
      this._successHandler,
      this._errorHandler
    )
  },
  checkStudentPartnerSignupCode(partnerSignupCode) {
    return httpGet(
      `${AUTH_ROOT}/partner/student/code?partnerSignupCode=${encodeURIComponent(
        partnerSignupCode
      )}`
    ).then(this._successHandler, this._errorHandler)
  },
  getVolunteerPartner(partnerId) {
    return httpGet(
      `${AUTH_ROOT}/partner/volunteer?partnerId=${encodeURIComponent(
        partnerId
      )}`
    ).then(this._successHandler, this._errorHandler)
  },
  getStudentPartner(partnerKey: string) {
    return httpGet(
      `${AUTH_ROOT}/partner/student?partnerId=${encodeURIComponent(partnerKey)}`
    ).then(this._successHandler, this._axiosErrorHandler)
  },
  checkHealth() {
    return httpGet(`${VERSION_ROOT}/version.json`).then(
      this._successHandler,
      this._errorHandler
    )
  },
  async registerOpenVolunteer(data: any) {
    const config = await getAdditionalConfig('registerVolunteer')
    return httpPost(`${AUTH_ROOT}/register/volunteer/open`, data, config).then(
      this._successHandler,
      this._errorHandler
    )
  },
  async registerPartnerVolunteer(data: any) {
    const config = await getAdditionalConfig('registerVolunteer')
    return httpPost(
      `${AUTH_ROOT}/register/volunteer/partner`,
      data,
      config
    ).then(this._successHandler, this._errorHandler)
  },
  async registerStudent(data: any) {
    const config = await getAdditionalConfig('registerStudent')
    return httpPost(`${AUTH_ROOT}/register/student`, data, config).then(
      this._successHandler,
      this._errorHandler
    )
  },
  async registerTeacher(data: any) {
    const config = await getAdditionalConfig('registerTeacher')
    return httpPost(`${AUTH_ROOT}/register/teacher`, data, config).then(
      this._successHandler,
      this._errorHandler
    )
  },
  async sendReset(data: any) {
    const config = await getAdditionalConfig('sendReset')
    return httpPost(`${AUTH_ROOT}/reset/send`, data, config).then(
      this._successHandler,
      this._errorHandler
    )
  },
  async confirmReset(data) {
    const config = await getAdditionalConfig('resetPassword')
    return httpPost(`${AUTH_ROOT}/reset/confirm`, data, config).then(
      this._successHandler,
      this._errorHandler
    )
  },
  user() {
    return httpGet(`${API_ROOT}/user`).then(
      this._successHandler,
      this._errorHandler
    )
  },
  userGlobal() {
    return httpGet(`${API_ROOT}/user`).then(
      this._successHandler,
      this._errorHandler
    )
  },
  async sendVerification(data) {
    const config = await getAdditionalConfig('sendVerification')
    return httpPost(`${API_ROOT}/verify/v2/send`, data, config).then(
      this._successHandler,
      this._errorHandler
    )
  },
  confirmVerification(data) {
    return httpPost(`${API_ROOT}/verify/confirm`, data).then(
      this._successHandler,
      this._errorHandler
    )
  },
  sendContact(data) {
    return httpPost(`${CONTACT_API_ROOT}/send`, data).then(
      this._successHandler,
      this._errorHandler
    )
  },
  setProfile(data) {
    return httpPut(`${API_ROOT}/user`, data).then(
      this._successHandler,
      this._errorHandler
    )
  },
  deletePhone() {
    return httpDelete(`${API_ROOT}/user/phone`)
  },
  deleteAccount() {
    return httpDelete(`${API_ROOT}/user`)
  },
  getVolunteersAvailability(data) {
    return httpGet(`${API_ROOT}/volunteers/availability/${data}`).then(
      this._successHandler,
      this._errorHandler
    )
  },
  getVolunteers() {
    return httpGet(`${API_ROOT}/volunteers`).then(
      this._successHandler,
      this._errorHandler
    )
  },
  getVolunteerLastUpdated() {
    return httpGet(`${API_ROOT}/volunteers/hours-last-updated`).then(
      this._successHandler,
      this._errorHandler
    )
  },
  getReferredFriends() {
    return httpGet(`${API_ROOT}/user/referred-friends`).then(
      this._successHandler,
      this._errorHandler
    )
  },
  getReferredBy(referralCode) {
    return httpGet(`${REFERRAL_API_ROOT}/${referralCode}`).then(
      this._successHandler,
      this._errorHandler
    )
  },
  async newSession(data: {
    sessionType: string // topic
    sessionSubTopic: string // subject
    docEditorVersion: number
    assignmentId?: string
    requestedVolunteerId?: string
    presessionSurvey?: {
      surveyId: number
      surveyTypeId: number
      submissions: Array<{
        questionId: number
        responseChoiceId: number
        openResponse: string
      }>
    }
  }) {
    try {
      return await httpPost<{
        sessionId: Uuid
        session: CurrentSessionPublic
        isZwibserveSession: boolean
      }>(`${API_ROOT}/session/new`, data)
    } catch (err) {
      return this._axiosErrorHandler(err as AxiosError)
    }
  },
  async breakoutSession(sessionId: string) {
    try {
      return await httpPost<{
        sessionId: Uuid
        session: CurrentSessionPublic
      }>(`${API_ROOT}/session/${sessionId}/breakout`, {})
    } catch (err) {
      return this._axiosErrorHandler(err as AxiosError)
    }
  },
  async joinSession(data: { sessionId: string; joinedFrom?: string }) {
    try {
      return await httpPost<{
        session: CurrentSessionPublic
        isZwibserveSession: boolean
        exclusiveVolunteerId?: string
      }>(`${API_ROOT}/session/join`, data)
    } catch (err) {
      return this._axiosErrorHandler(err as AxiosError)
    }
  },
  async endSession(data) {
    try {
      return await httpPost<{
        sessionId: Uuid
        session: CurrentSessionPublic
      }>(`${API_ROOT}/session/end`, data)
    } catch (err) {
      return this._axiosErrorHandler(err as AxiosError)
    }
  },
  checkSession(data, onRetry) {
    return this._faultTolerantHttp(
      'post',
      onRetry,
      `${API_ROOT}/session/check`,
      data
    )
  },
  async currentSession() {
    try {
      return await httpPost<{
        sessionId: Uuid
        data: CurrentSessionPublic
      }>(`${API_ROOT}/session/current`, {})
    } catch (err) {
      return this._axiosErrorHandler(err as AxiosError)
    }
  },
  getRecapSessionForDms(data) {
    return httpPost(`${API_ROOT}/session/recap-dms`, data).then(
      this._successHandler,
      this._errorHandler
    )
  },
  latestSession() {
    return httpPost(`${API_ROOT}/session/latest`).then(
      this._successHandler,
      this._errorHandler
    )
  },
  getSession(sessionId) {
    return httpGet(`${API_ROOT}/session/${sessionId}`).then(
      this._successHandler,
      this._errorHandler
    )
  },
  reportSession({ sessionId, reportReason, reportMessage, source }) {
    return httpPost(`${API_ROOT}/session/${sessionId}/report`, {
      reportReason,
      reportMessage,
      source,
    }).then(this._successHandler, this._errorHandler)
  },
  getSessionPhotoUploadUrl(sessionId) {
    return httpGet(`${API_ROOT}/session/${sessionId}/photo-url`).then(
      this._successHandler,
      this._errorHandler
    )
  },
  uploadFiles({ assignmentId, files }) {
    const formData = new FormData()
    formData.append('assignmentId', assignmentId)

    files.forEach((file) => {
      formData.append('files', file)
    })

    return httpPut(`${API_ROOT}/assignment/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }).then(this._successHandler, this._errorHandler)
  },
  async getAssignmentDocuments(assignmentId) {
    return httpGet(`${API_ROOT}/assignment/${assignmentId}/documents`).then(
      this._successHandler,
      this._errorHandler
    )
  },
  timedOutSession(sessionId, data) {
    return httpPost(`${API_ROOT}/session/${sessionId}/timed-out`, data).then(
      this._successHandler,
      this._errorHandler
    )
  },
  adminGetSessions({
    page,
    showBannedUsers,
    showTestUsers,
    sessionActivityFrom,
    sessionActivityTo,
    minMessagesSent,
    minSessionLength,
    studentRating,
    volunteerRating,
    firstTimeStudent,
    firstTimeVolunteer,
    isReported,
  }) {
    const queryParams = new URLSearchParams({
      page,
      showBannedUsers,
      showTestUsers,
      sessionActivityFrom,
      sessionActivityTo,
      minMessagesSent,
      minSessionLength,
      studentRating,
      volunteerRating,
      firstTimeStudent,
      firstTimeVolunteer,
      isReported,
    }).toString()

    return httpGet(`${API_ROOT}/sessions?${queryParams}`).then(
      this._successHandler,
      this._errorHandler
    )
  },
  adminGetSession(sessionId) {
    return httpGet(`${API_ROOT}/session/${sessionId}/admin`).then(
      this._successHandler,
      this._errorHandler
    )
  },
  adminReviewPendingVolunteer({ volunteerId, data }) {
    return httpPost(`${API_ROOT}/volunteers/review/${volunteerId}`, data).then(
      this._successHandler,
      this._errorHandler
    )
  },
  adminGetVolunteersToReview(page) {
    return httpGet(`${API_ROOT}/volunteers/review?page=${page}`).then(
      this._successHandler,
      this._errorHandler
    )
  },
  adminGetSessionNotifications(sessionId) {
    return httpGet(`${API_ROOT}/session/${sessionId}/notifications`).then(
      this._successHandler,
      this._errorHandler
    )
  },
  adminGetSessionsToReview(page, studentFirstName) {
    return httpGet(
      `${API_ROOT}/session/review?page=${page}&studentFirstName=${studentFirstName}`
    ).then(this._successHandler, this._errorHandler)
  },
  adminUpdateSession(sessionId, data) {
    return httpPut(`${API_ROOT}/session/${sessionId}`, data).then(
      this._successHandler,
      this._errorHandler
    )
  },
  adminGetUser(userId, page) {
    return httpGet(`${API_ROOT}/user/${userId}?page=${page}`).then(
      this._successHandler,
      this._errorHandler
    )
  },
  adminUpdateUser(userId, data) {
    return httpPut(`${API_ROOT}/user/${userId}`, data).then(
      this._successHandler,
      this._errorHandler
    )
  },
  adminGetUsers({
    page,
    userId,
    firstName,
    lastName,
    email,
    partnerOrg,
    school,
  }) {
    const queryParams = new URLSearchParams({
      page,
      userId,
      firstName,
      lastName,
      email,
      partnerOrg,
      school,
    }).toString()

    return httpGet(`${API_ROOT}/users?${queryParams}`).then(
      this._successHandler,
      this._errorHandler
    )
  },
  adminGetIneligibleStudents(page) {
    return httpGet(
      `${ELIGIBILITY_API_ROOT}/ineligible-students?page=${page}`
    ).then(this._successHandler, this._errorHandler)
  },
  adminGetSchool(schoolId) {
    return httpGet(`${ADMIN_ROOT}/school/${schoolId}`).then(
      this._successHandler,
      this._errorHandler
    )
  },
  adminGetSchools({ name, state, city, ncesId, isPartner, page }) {
    const queryParams = new URLSearchParams({
      name,
      state,
      city,
      ncesId,
      isPartner,
      page,
    }).toString()
    return httpGet(`${ADMIN_ROOT}/schools?${queryParams}`).then(
      this._successHandler,
      this._errorHandler
    )
  },
  adminUpdateSchool(schoolId, data) {
    return httpPut(`${ELIGIBILITY_API_ROOT}/school/${schoolId}`, data).then(
      this._successHandler,
      this._errorHandler
    )
  },
  adminUpdateSchoolApproval(data) {
    return httpPost(`${ELIGIBILITY_API_ROOT}/school/approval`, data).then(
      this._successHandler,
      this._errorHandler
    )
  },
  adminUpdateSchoolPartnerStatus(data) {
    return httpPost(`${ELIGIBILITY_API_ROOT}/school/partner`, data).then(
      this._successHandler,
      this._errorHandler
    )
  },
  adminGetPartnerSchools() {
    return httpGet(`${ADMIN_ROOT}/schools/partner-schools`).then(
      this._successHandler,
      this._errorHandler
    )
  },
  adminUploadRosterStudents(data) {
    return httpPost(`${ADMIN_ROOT}/roster-students`, data).then(
      this._successHandler,
      this._errorHandler
    )
  },
  adminCleverRoster(districtId: string) {
    return httpPost(`${ADMIN_ROOT}/clever/roster`, {
      districtId,
    }).then(this._successHandler, this._errorHandler)
  },
  adminCleverAddSchoolMapping(
    cleverSchoolId: string,
    upchieveSchoolId: string
  ) {
    return httpPost(`${ADMIN_ROOT}/clever/school`, {
      cleverSchoolId,
      upchieveSchoolId,
    }).then(this._successHandler, this._errorHandler)
  },
  adminGetSessionReport({
    joinedBefore,
    joinedAfter,
    sessionRangeFrom,
    sessionRangeTo,
    highSchoolId,
    studentPartnerOrg,
    studentPartnerSite,
    sponsorOrg,
  }) {
    const queryParams = new URLSearchParams({
      joinedBefore,
      joinedAfter,
      sessionRangeFrom,
      sessionRangeTo,
      highSchoolId,
      studentPartnerOrg,
      studentPartnerSite,
      sponsorOrg,
    }).toString()
    return httpGet(`${API_ROOT}/reports/session-report?${queryParams}`, {
      timeout: 300000,
    }).then(this._successHandler, this._errorHandler)
  },
  adminGetUsageReport({
    joinedBefore,
    joinedAfter,
    sessionRangeFrom,
    sessionRangeTo,
    highSchoolId,
    studentPartnerOrg,
    studentPartnerSite,
    sponsorOrg,
  }) {
    const queryParams = new URLSearchParams({
      joinedBefore,
      joinedAfter,
      sessionRangeFrom,
      sessionRangeTo,
      highSchoolId,
      studentPartnerOrg,
      studentPartnerSite,
      sponsorOrg,
    }).toString()
    return httpGet(`${API_ROOT}/reports/usage-report?${queryParams}`, {
      timeout: 300000,
    }).then(this._successHandler, this._errorHandler)
  },
  adminGetVolunteerTelecomReport({ startDate, endDate, partnerOrg }) {
    const queryParams = new URLSearchParams({
      startDate,
      endDate,
      partnerOrg,
    }).toString()
    return httpGet(
      `${API_ROOT}/reports/volunteer-telecom-report?${queryParams}`,
      {
        timeout: 300000,
      }
    ).then(this._successHandler, this._errorHandler)
  },
  adminGetPartnerAnalyticsReport({ startDate, endDate, partnerOrg }) {
    const queryParams = new URLSearchParams({
      startDate,
      endDate,
      partnerOrg,
    }).toString()
    return httpGet(
      `${API_ROOT}/reports/partner-analytics-report?${queryParams}`,
      {
        timeout: 300000,
        headers: {
          'Content-Disposition': 'attachment; filename=analytics-report.xlsx',
          'Content-Type':
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        },
        responseType: 'arraybuffer',
      }
    ).then(this._successHandler, this._errorHandler)
  },
  adminGetStudentPartners() {
    return httpGet(`${AUTH_ROOT}/partner/student-partners`).then(
      this._successHandler,
      this._errorHandler
    )
  },
  adminGetVolunteerPartners() {
    return httpGet(`${AUTH_ROOT}/partner/volunteer-partners`).then(
      this._successHandler,
      this._errorHandler
    )
  },
  adminGetSponsorOrgs() {
    return httpGet(`${AUTH_ROOT}/partner/sponsor-orgs`).then(
      this._successHandler,
      this._errorHandler
    )
  },
  adminGetZipCodes(zipCode) {
    return httpGet(`${ELIGIBILITY_API_ROOT}/zip-codes/${zipCode}`).then(
      this._successHandler,
      this._errorHandler
    )
  },
  adminGetUserIdFromEmail(email) {
    return httpGet(`${API_ROOT}/user/email/${email}`).then(
      this._successHandler,
      this._errorHandler
    )
  },
  adminNTHSAffiliateWithSchool(data: { chapterIds: string[] }) {
    return httpPost(`${ADMIN_ROOT}/nths/school-affiliation`, data).then(
      this._successHandler,
      this._errorHandler
    )
  },
  getQuestions(data) {
    return httpPost(`${API_ROOT}/training/questions`, data).then(
      this._successHandler,
      this._errorHandler
    )
  },
  getQuizScore(data) {
    return httpPost(`${API_ROOT}/training/score`, data).then(
      this._successHandler,
      this._errorHandler
    )
  },
  getReviewMaterials(data) {
    return httpGet(`${API_ROOT}/training/review/${data}`).then(
      this._successHandler,
      this._errorHandler
    )
  },
  getTrainingCourse(courseKey) {
    return httpGet(`${API_ROOT}/training/course/${courseKey}`).then(
      this._successHandler,
      this._errorHandler
    )
  },
  recordTrainingCourseProgress(courseKey, materialKey) {
    return httpPost(`${API_ROOT}/training/course/${courseKey}/progress`, {
      materialKey,
    }).then(this._successHandler, this._errorHandler)
  },
  updateSchedule(data) {
    return httpPost(`${API_ROOT}/calendar/save`, data).then(
      this._successHandler,
      this._errorHandler
    )
  },
  getWaitTimes() {
    return httpGet(`${API_ROOT}/stats/volunteer/heatmap`).then(
      this._successHandler,
      this._errorHandler
    )
  },
  searchSchool({ query }) {
    return httpGet(
      `${ELIGIBILITY_API_ROOT}/school/search?q=${encodeURIComponent(query)}`
    ).then(this._successHandler, this._errorHandler)
  },
  checkZipCode({ zipCode }) {
    return httpGet(`${ELIGIBILITY_API_ROOT}/check-zip-code/${zipCode}`).then(
      this._successHandler,
      this._errorHandler
    )
  },
  checkStudentEligibility({
    email,
    gradeLevel,
    referredByCode,
    schoolId,
    zipCode,
  }: {
    email: string
    gradeLevel?: string
    referredByCode: string | null
    schoolId?: string
    zipCode: string
  }) {
    return httpPost(`${ELIGIBILITY_API_ROOT}/check`, {
      email,
      gradeLevel,
      referredByCode,
      schoolId,
      zipCode,
    }).then(this._successHandler, this._axiosErrorHandler)
  },
  checkTeacherEligibility({ schoolId }: { schoolId: string }) {
    const queryParams = new URLSearchParams({ schoolId }).toString()
    return httpGet(`${ELIGIBILITY_API_ROOT}/check/teacher?${queryParams}`).then(
      this._successHandler,
      this._errorHandler
    )
  },
  checkIpAddress() {
    return httpGet(`${ELIGIBILITY_API_ROOT}/ip-check`).then(
      this._successHandler,
      this._errorHandler
    )
  },
  checkIfMessageIsClean(data) {
    return httpPost(`${API_ROOT}/moderate/message`, data).then(
      this._successHandler,
      this._errorHandler
    )
  },
  checkIfImageIsClean(data) {
    return httpPost(`${API_ROOT}/moderate/image`, data).then(
      this._successHandler,
      this._errorHandler
    )
  },
  checkIfVideoFrameIsClean(data) {
    return httpPost(`${API_ROOT}/moderate/video-frame`, data).then(
      this._successHandler,
      this._errorHandler
    )
  },
  feedback(data) {
    return httpPost(`${API_ROOT}/feedback`, data).then(
      this._successHandler,
      this._errorHandler
    )
  },
  checkReference(referenceId) {
    return httpGet(`${REFERENCE_API_ROOT}/${referenceId}`).then(
      this._successHandler,
      this._errorHandler
    )
  },
  saveReferenceForm(referenceId, data) {
    return httpPost(`${REFERENCE_API_ROOT}/${referenceId}/submit`, data).then(
      this._successHandler,
      this._errorHandler
    )
  },
  getPhotoUploadUrl() {
    return httpGet(`${API_ROOT}/user/volunteer-approval/photo-url`).then(
      this._successHandler,
      this._errorHandler
    )
  },
  addBackgroundInfo(data) {
    return httpPost(
      `${API_ROOT}/user/volunteer-approval/background-information`,
      data
    ).then(this._successHandler, this._errorHandler)
  },
  submitSurvey(survey) {
    return httpPost(`${API_ROOT}/survey/save`, survey).then(
      this._successHandler,
      this._errorHandler
    )
  },
  getPresessionSurveyForFeedback(sessionId) {
    return httpGet(`${API_ROOT}/survey/presession/${sessionId}`).then(
      this._successHandler,
      this._errorHandler
    )
  },
  getStudentsPresessionGoal(sessionId) {
    return httpGet(`${API_ROOT}/survey/presession/${sessionId}/goal`).then(
      this._successHandler,
      this._errorHandler
    )
  },
  getSurveyById(surveyId: number) {
    return httpGet(`${API_ROOT}/surveys/${surveyId}`).then(
      this._successHandler,
      this._errorHandler
    )
  },
  getPresessionSurvey(subjectName) {
    return httpGet(`${API_ROOT}/survey/presession?subject=${subjectName}`).then(
      this._successHandler,
      this._errorHandler
    )
  },
  getPresessionSurveyResponse(sessionId) {
    return httpGet(`${API_ROOT}/survey/presession/response/${sessionId}`).then(
      this._successHandler,
      this._errorHandler
    )
  },
  getPostsessionSurvey(subjectName, sessionId, role) {
    return httpGet(
      `${API_ROOT}/survey/postsession?subject=${subjectName}&sessionId=${sessionId}&role=${role}`
    ).then(this._successHandler, this._errorHandler)
  },
  getPostsessionSurveyResponse(sessionId, role) {
    return httpGet(
      `${API_ROOT}/survey/postsession/response?sessionId=${sessionId}&role=${role}`
    ).then(this._successHandler, this._errorHandler)
  },
  getImpactStudySurvey() {
    return httpGet(`${API_ROOT}/survey/impact-study`).then(
      this._successHandler,
      this._errorHandler
    )
  },
  getImpactStudySurveyResponses() {
    return httpGet(`${API_ROOT}/survey/impact-study/responses`).then(
      this._successHandler,
      this._errorHandler
    )
  },
  getUserProductFlags() {
    return httpGet(`${API_ROOT}/product-flags`).then(
      this._successHandler,
      this._errorHandler
    )
  },
  updateFavoriteVolunteerStatus(volunteerId, data) {
    return httpPost(
      `${API_ROOT}/students/favorite-volunteers/${volunteerId}`,
      data
    ).then(this._successHandler, this._errorHandler)
  },
  getRemainingFavoriteVolunteers() {
    return httpGet(`${API_ROOT}/students/remaining-favorite-volunteers`).then(
      this._successHandler,
      this._errorHandler
    )
  },
  checkIsFavoriteVolunteer(volunteerId) {
    return httpGet(
      `${API_ROOT}/students/favorite-volunteers/${volunteerId}`
    ).then(this._successHandler, this._errorHandler)
  },
  getSessionHistory(filter) {
    const queryParams = new URLSearchParams(filter).toString()
    return httpGet(
      `${API_ROOT}/sessions/history${queryParams.length ? `?${queryParams}` : ''}`
    ).then(this._successHandler, this._errorHandler)
  },
  getTotalSessionHistory(filter) {
    const queryParams = new URLSearchParams(filter).toString()
    return httpGet(
      `${API_ROOT}/sessions/history/total${queryParams.length ? `?${queryParams}` : ''}`
    ).then(this._successHandler, this._errorHandler)
  },
  getFavoriteVolunteers(page) {
    return httpGet(
      `${API_ROOT}/students/favorite-volunteers?page=${page}`
    ).then(this._successHandler, this._errorHandler)
  },
  getSessionRecap(sessionId) {
    return httpGet(`${API_ROOT}/sessions/${sessionId}/recap`).then(
      this._successHandler,
      this._errorHandler
    )
  },
  getStudentSignupSources() {
    return httpGet(`${ELIGIBILITY_API_ROOT}/signup-sources/students`).then(
      this._successHandler,
      this._errorHandler
    )
  },
  adminGetActivePartnersForStudent(studentId) {
    return httpGet(
      `${API_ROOT}/students/partners/active?student=${studentId}`
    ).then(this._successHandler, this._errorHandler)
  },
  getSubjects() {
    return httpGet(`${API_ROOT}/subjects`).then(
      this._successHandler,
      this._errorHandler
    )
  },
  getIsSubjectValid(subject, topic) {
    return httpGet<{ isValid: boolean }>(
      `${API_ROOT}/subjects/is-valid?subject=${subject}&topic=${topic}`
    ).then(this._successHandler, this._errorHandler)
  },
  getTrainingSubjects() {
    return httpGet(`${API_ROOT}/subjects/training`).then(
      this._successHandler,
      this._errorHandler
    )
  },
  isSessionRecapEligible(sessionId, data) {
    return httpPost(
      `${API_ROOT}/sessions/history/${sessionId}/eligible`,
      data
    ).then(this._successHandler, this._errorHandler)
  },
  getProgressReportForSession(sessionId) {
    return httpGet(`${API_ROOT}/progress-reports/sessions/${sessionId}`).then(
      this._successHandler,
      this._errorHandler
    )
  },
  getProgressReportsForSubject(subject, page) {
    return httpGet(
      `${API_ROOT}/progress-reports/subjects/${subject}?page=${page}`
    ).then(this._successHandler, this._errorHandler)
  },
  getProgressReportSummariesForSubject(subject) {
    return httpGet(`${API_ROOT}/progress-reports/summaries/${subject}`).then(
      this._successHandler,
      this._errorHandler
    )
  },
  getLatestProgressReportOverviewForSubject(subject) {
    return httpGet(
      `${API_ROOT}/progress-reports/summaries/${subject}/latest`
    ).then(this._successHandler, this._errorHandler)
  },
  updateProgressReportsReadStatus(reportIds) {
    return httpPost(`${API_ROOT}/progress-reports/read`, { reportIds }).then(
      this._successHandler,
      this._errorHandler
    )
  },
  getUnreadProgressReports() {
    return httpGet(`${API_ROOT}/progress-reports/overview/stats`).then(
      this._successHandler,
      this._errorHandler
    )
  },
  getLatestProgressReportOverviewSubject() {
    return httpGet(`${API_ROOT}/progress-reports/overview/latest/subject`).then(
      this._successHandler,
      this._errorHandler
    )
  },
  getProgressReportSurvey() {
    return httpGet(`${API_ROOT}/survey/progress-report`).then(
      this._successHandler,
      this._errorHandler
    )
  },
  getProgressReportSurveyResponses(progressReportId) {
    return httpGet(
      `${API_ROOT}/survey/progress-report/${progressReportId}/response`
    ).then(this._successHandler, this._errorHandler)
  },
  getTeacherClasses() {
    return httpGet(`${API_ROOT}/teachers/classes`).then(
      this._successHandler,
      this._errorHandler
    )
  },
  createTeacherClass(className, topicId) {
    return httpPost(`${API_ROOT}/teachers/class`, { className, topicId }).then(
      this._successHandler,
      this._errorHandler
    )
  },
  getStudentsInTeacherClass(classId) {
    return httpGet(`${API_ROOT}/teachers/class/${classId}/students`).then(
      this._successHandler,
      this._errorHandler
    )
  },
  getTeacherClassByClassCode(classCode) {
    return httpGet(`${API_ROOT}/teachers/class/?classCode=${classCode}`).then(
      this._successHandler,
      this._errorHandler
    )
  },
  getTeacherClassById(classId) {
    return httpGet(`${API_ROOT}/teachers/class/${classId}`).then(
      this._successHandler,
      this._errorHandler
    )
  },
  getStudentSessionDetails(studentId) {
    return httpGet(`${API_ROOT}/sessions/student/${studentId}`).then(
      this._successHandler,
      this._errorHandler
    )
  },
  getTopics() {
    return httpGet(`${API_ROOT}/topics`).then(
      this._successHandler,
      this._errorHandler
    )
  },
  saveBigFutureEmailForStudy(email) {
    return httpPost(`${ELIGIBILITY_API_ROOT}/big-future/email`, { email }).then(
      this._successHandler,
      this._errorHandler
    )
  },
  addStudentToClass({ email, classCode, gradeLevel }) {
    return httpPost(`${API_PUBLIC_ROOT}/students/class`, {
      email,
      classCode,
      gradeLevel,
    }).then(this._successHandler, this._errorHandler)
  },
  async getAllMessagesForBotConversation(conversationId: Uuid) {
    try {
      return await httpGet<TutorBotTranscriptPublic>(
        `${API_ROOT}/tutor-bot/conversations/${conversationId}`
      )
    } catch (err) {
      return this._axiosErrorHandler(err as AxiosError)
    }
  },
  getOrCreateTutorBotConversationWithMessagesBySessionId(sessionId: Uuid) {
    return httpPut(
      `${API_ROOT}/session/${sessionId}/tutor-bot-conversation`,
      {}
    ).then(this._successHandler, this._errorHandler)
  },
  async sendTutorBotMessage({
    userId,
    conversationId,
    message,
    senderUserType,
    sessionId,
    subjectName,
    snapshotBlob,
  }: TutorBotAddMessagePayload) {
    try {
      const form = new FormData()
      form.append('userId', userId)
      form.append('message', message)
      form.append('senderUserType', senderUserType)
      form.append('subjectName', subjectName)
      if (sessionId) {
        form.append('sessionId', sessionId)
      }
      if (snapshotBlob) {
        form.append('snapshot', snapshotBlob, 'whiteboard.jpg')
      }

      return await httpPost<TutorBotAddMessageResponsePublic>(
        `${API_ROOT}/tutor-bot/conversations/${conversationId}/message`,
        form
      )
    } catch (err) {
      return this._axiosErrorHandler(err as AxiosError)
    }
  },
  enrollStudentInIncentiveProgram(proxyEmail) {
    return httpPost(
      `${API_ROOT}/product-flags/fall-incentive-enrollment/enroll`,
      {
        proxyEmail,
      }
    ).then(this._successHandler, this._errorHandler)
  },
  deniedIncentiveProgramEnrollment() {
    return httpPost(
      `${API_ROOT}/product-flags/fall-incentive-enrollment/denied`
    ).then(this._successHandler, this._errorHandler)
  },
  getStudentClasses() {
    return httpGet(`${API_ROOT}/students/classes`).then(
      this._successHandler,
      this._errorHandler
    )
  },
  getStudentAssignments() {
    return httpGet(`${API_ROOT}/students/assignments`).then(
      this._successHandler,
      this._errorHandler
    )
  },
  getAssignmentById(assignmentId) {
    return httpGet(`${API_ROOT}/assignment/${assignmentId}`).then(
      this._successHandler,
      this._errorHandler
    )
  },
  createAssignment(assignmentData, studentIds) {
    return httpPost(`${API_ROOT}/teachers/assignment`, {
      assignmentData,
      studentIds,
    }).then(this._successHandler, this._errorHandler)
  },
  editAssignment(assignmentData) {
    return httpPost(`${API_ROOT}/teachers/assignment/edit`, {
      assignmentData,
    }).then(this._successHandler, this._errorHandler)
  },
  getAssignmentsByClassId(classId) {
    return httpGet(`${API_ROOT}/teachers/class/${classId}/assignments`).then(
      this._successHandler,
      this._errorHandler
    )
  },
  getStudentAssignmentCompletion(assignmentId) {
    return httpGet(`${API_ROOT}/assignment/${assignmentId}/students`).then(
      this._successHandler,
      this._errorHandler
    )
  },
  getAllAssignmentsForTeacher() {
    return httpGet(`${API_ROOT}/teachers/assignments`).then(
      this._successHandler,
      this._errorHandler
    )
  },
  getAssignmentForSession(sessionId) {
    return httpGet(`${API_ROOT}/session/${sessionId}/assignment`).then(
      this._successHandler,
      this._errorHandler
    )
  },
  deleteAssignment(assignmentId) {
    return httpDelete(`${API_ROOT}/assignment/${assignmentId}`).then(
      this._successHandler,
      this._errorHandler
    )
  },
  updateTeacherClass({ classData }) {
    return httpPost(`${API_ROOT}/teachers/class/update`, classData).then(
      this._successHandler,
      this._errorHandler
    )
  },
  deactivateTeacherClass(id) {
    return httpPost(`${API_ROOT}/teachers/class/deactivate`, id).then(
      this._successHandler,
      this._errorHandler
    )
  },
  removeStudentFromClass({ studentId, classId }) {
    return httpDelete(
      `${API_ROOT}/teachers/class/${classId}/student/${studentId}/remove`
    ).then(this._successHandler, this._errorHandler)
  },
  getUserRewards(offset) {
    return httpGet(`${API_ROOT}/rewards?offset=${offset}`).then(
      this._successHandler,
      this._errorHandler
    )
  },
  getOrCreateSessionMeeting(sessionId) {
    return httpPost(`${API_ROOT}/sessions/${sessionId}/meeting`).then(
      this._successHandler,
      this._errorHandler
    )
  },
  startSessionMeetingTranscription(sessionId) {
    return httpPost(
      `${API_ROOT}/sessions/${sessionId}/meeting/start-transcription`
    ).then(this._successHandler, this._errorHandler)
  },
  startSessionRecording(sessionId: string) {
    return httpPost(
      `${API_ROOT}/sessions/${sessionId}/meeting/start-recording`
    ).then(this._successHandler, this._errorHandler)
  },
  endSessionMeeting(sessionId) {
    return httpPut(`${API_ROOT}/sessions/${sessionId}/meeting}`).then(
      this._successHandler,
      this._errorHandler
    )
  },
  addVolunteerRoleForStudent() {
    return httpPost(`${API_ROOT}/user/roles/volunteer`).then(
      this._successHandler,
      this._errorHandler
    )
  },
  switchActiveRole(activeRole: 'student' | 'volunteer') {
    return httpPut(`${API_ROOT}/user/roles/active`, { activeRole }).then(
      this._successHandler,
      this._errorHandler
    )
  },
  getVolunteerPresence() {
    return httpGet(`${API_ROOT}/volunteers/presence`, {}).catch(
      this._axiosErrorHandler
    )
  },
  updateUserPreferredLanguage(preferredLanguage: string) {
    return httpPost<void>(`${API_ROOT}/user/preferred-language`, {
      preferredLanguage,
    }).catch(this._axiosErrorHandler)
  },
  async upsertImpactStudyCampaign(campaign: ImpactStudyCampaign) {
    try {
      return await httpPost<{ impactStudyEnrollmentAt?: Date }>(
        `${API_ROOT}/product-flags/impact-study-campaigns`,
        { campaign }
      )
    } catch (err) {
      //  TODO: Error handling and throwing will probably need to be centralized in the `http*` methods (httpGet, httpPost, etc.)
      return this._axiosErrorHandler(err as AxiosError)
    }
  },
  sendReferralText(phoneNumber: string) {
    return httpPost(`${API_ROOT}/send-referral-text`, { phoneNumber }).then(
      this._successHandler,
      this._errorHandler
    )
  },
  trackPresenceActive(clientUUID: string) {
    return httpPost(`${API_ROOT}/user/track-presence/active`, {
      clientUUID,
    }).then(this._successHandler, this._errorHandler)
  },
  trackPresenceInactive(clientUUID: string) {
    return httpPostKeepAlive(`${API_ROOT}/user/track-presence/inactive`, {
      clientUUID,
    }).then(this._successHandler, this._errorHandler)
  },
  trackPresencePassive(clientUUID: string) {
    return httpPostKeepAlive(`${API_ROOT}/user/track-presence/passive`, {
      clientUUID,
    }).then(this._successHandler, this._errorHandler)
  },
  trackPresenceCheckForInactivity(clientUUID: string) {
    return httpPostKeepAlive(
      `${API_ROOT}/user/track-presence/check-for-inactivity`,
      { clientUUID }
    ).then(this._successHandler, this._errorHandler)
  },
  completeGoogleSsoVolunteerSignup(data: {
    terms: boolean
    firstName: string
    lastName: string
    phone: string
    signupSourceId: number
    otherSignupSource?: string
  }) {
    return httpPut(`${API_ROOT}/user/volunteer/complete-sso-signup`, data).then(
      this._successHandler,
      this._errorHandler
    )
  },
  getNTHSGroupsForUser() {
    return httpGet(`${API_ROOT}/nths-groups`, {}).catch(this._axiosErrorHandler)
  },
  getNTHSGroupByCode(code: string) {
    return httpGet(`${API_PUBLIC_ROOT}/nths-groups/${code}`, {}).catch(
      this._axiosErrorHandler
    )
  },
  getNTHSGroupMembers(groupId: string) {
    return httpGet(`${API_ROOT}/nths-groups/${groupId}/members`).catch(
      this._axiosErrorHandler
    )
  },
  updateNTHSGroupMember(groupId: string, userId: string, data: any) {
    return httpPut(
      `${API_ROOT}/nths-groups/${groupId}/members/${userId}`,
      data
    ).catch(this._axiosErrorHandler)
  },
  leaveNthsChapter(groupId: string) {
    return httpDelete(`${API_ROOT}/nths-groups/${groupId}/leave`, {}).catch(
      this._axiosErrorHandler
    )
  },
  joinVolunteerToNTHSGroup({
    email,
    inviteCode,
  }: {
    email: string
    inviteCode: string
  }) {
    return httpPost(`${API_PUBLIC_ROOT}/nths-groups/join`, {
      email,
      inviteCode,
    }).then(this._successHandler, this._errorHandler)
  },
  createNTHSGroup() {
    return httpPost(`${API_ROOT}/nths-groups/new`, {}).then(
      this._successHandler,
      this._errorHandler
    )
  },
  editNTHSGroup({ groupId, name }: { groupId: string; name: string }) {
    return httpPut(`${API_ROOT}/nths-groups/${groupId}`, { name }).then(
      this._successHandler,
      this._errorHandler
    )
  },
  getActionsForNTHSGroup(groupId: string) {
    return httpGet(`${API_ROOT}/nths-groups/${groupId}/actions`).catch(
      this._axiosErrorHandler
    )
  },
  createActionForNTHSGroup(groupId: string, action: NTHSActionName) {
    return httpPost(`${API_ROOT}/nths-groups/${groupId}/actions`, {
      action,
    }).then(this._successHandler, this._errorHandler)
  },
  submitSchoolAffiliation(groupId: string, advisorInfo: AdvisorInfo) {
    return httpPost(
      `${API_ROOT}/nths-groups/${groupId}/submit-school-affiliation`,
      advisorInfo
    ).then(this._successHandler, this._errorHandler)
  },
  async createTutorBotSession(data: TutorBotCreateConvoPayload) {
    try {
      return await httpPost<TutorBotNewConversationPublic>(
        `${API_ROOT}/tutor-bot/conversations`,
        data
      )
    } catch (err) {
      return this._axiosErrorHandler(err as AxiosError)
    }
  },
  async updateTutorBotConversationWithSessionId(
    conversationId: Uuid,
    sessionId: Uuid
  ) {
    try {
      await httpPatch<void>(
        `${API_ROOT}/tutor-bot/conversations/${conversationId}`,
        {
          sessionId,
        }
      )
    } catch (err) {
      return this._axiosErrorHandler(err as AxiosError)
    }
  },
  totpEnroll() {
    return httpPost<{ qrUrl: string }>(`${API_ROOT}/totp/enroll`, {}).then(
      this._successHandler,
      this._axiosErrorHandler
    )
  },
  totpVerify(token: string) {
    return httpPost<{ verified: boolean }>(`${API_ROOT}/totp/verify`, {
      token,
    }).then(this._successHandler, this._axiosErrorHandler)
  },
  updateSessionLastSeen(sessionId: Uuid, userId: Uuid) {
    return httpPost(
      `${API_ROOT}/session/${sessionId}/recap/${userId}/update-last-seen`,
      {}
    ).then(this._successHandler, this._errorHandler)
  },
  checkForUnreadDMs() {
    return httpGet(`${API_ROOT}/sessions/unread-dms`).then(
      this._successHandler,
      this._errorHandler
    )
  },
}
