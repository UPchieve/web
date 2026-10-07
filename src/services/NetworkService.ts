import errcode from 'err-code'
import promiseRetry from 'promise-retry'
import config from '../config'
import axios from 'axios'
import type { AxiosError, AxiosRequestConfig } from 'axios'
import type { ImpactStudyCampaign } from '@/types'
import type {
  NTHSActionName,
  NTHSChapterImpactResponse,
  NTHSChapterRosterResponse,
  NTHSMemberUpdate,
} from './NTHSGroupService'
import type {
  NTHSApplyPreview,
  NTHSFormVersion,
  NTHSUnlistedSchool,
} from './NTHSApplicationService'
import type { CalendarRosterPeriod } from './NTHSRosterService'
import type { AdvisorInfo } from '@/components/NTHS/SchoolAffiliation/school-affiliation-machine'
import type { CurrentSessionPublic } from '@/types/sessions'
import type { DateString, Uuid } from '@/types/shared'
import type {
  TutorBotAddMessagePayload,
  TutorBotAddMessageResponsePublic,
  TutorBotCreateConvoPayload,
  TutorBotNewConversationPublic,
  TutorBotTranscriptPublic,
} from '@/types/bot-conversations'
import type {
  AsyncReviewSubject,
  EssayReviewStatus,
  EssayReviewSubmission,
  EssayReviewSubmissionForVolunteer,
} from '@/types/essay-review'
import type { FeatureFlagResponse } from '@/contracts/analytics'
import type {
  LoginResponse,
  AuthStatusResponse,
  CheckCredentialResponse,
  AuthPayload,
} from '@/contracts/auth'

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

// TODO: Rename. Calling this `NetworkError` is misleading because it's
// not just network errors that it might be wrapping.
export class NetworkError extends Error {
  status?: number
  clientMessage?: string
  clientTitle?: string
  code?: string

  constructor(
    message: string,
    {
      status,
      clientMessage,
      clientTitle,
      code,
    }: {
      status?: number
      clientMessage?: string
      clientTitle?: string
      code?: string
    } = {}
  ) {
    super(message)
    this.name = 'NetworkError'
    this.status = status
    this.clientMessage = clientMessage
    this.clientTitle = clientTitle
    this.code = code
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

export async function httpGetDeprecated<T>(path: string, config?: object) {
  return axiosInstance.get<T>(path, config)
}

// TODO: Use generics instead of Object.
// TODO: Move NetworkError conversion into these helpers instead of
// the handling the error through `_errorHandler` and `_axiosErrorHandler`
export async function httpPostDeprecated<T>(
  path: string,
  data: object,
  config?: AxiosRequestConfig
) {
  return axiosInstance.post<T>(path, data, config)
}

export async function httpPutDeprecated<T>(
  path: string,
  data: object,
  config?: AxiosRequestConfig
) {
  return axiosInstance.put<T>(path, data, config)
}

export async function httpPatchDeprecated<T>(
  path: string,
  data: object,
  config?: AxiosRequestConfig
) {
  return axiosInstance.patch<T>(path, data, config)
}

export async function httpDeleteDeprecated<T>(
  path: string,
  config?: AxiosRequestConfig
) {
  return axiosInstance.delete<T>(path, config)
}

export function toNetworkError(err: unknown): NetworkError {
  if (isNetworkError(err)) {
    return err
  }

  if (axios.isAxiosError(err)) {
    const status = err.response?.status
    const clientMessage = err.response?.data?.clientMessage
    const clientTitle = err.response?.data?.clientTitle
    const code = err.response?.data?.code
    const message =
      clientMessage ??
      err.response?.data?.err ??
      err.message ??
      'An unexpected error occurred.'
    return new NetworkError(message, {
      status,
      clientMessage,
      clientTitle,
      code,
    })
  }

  return new NetworkError(err instanceof Error ? err.message : 'Unknown error')
}

export async function httpGet<T>(path: string, config?: AxiosRequestConfig) {
  try {
    const response = await axiosInstance.get<T>(path, config)
    return response.data
  } catch (error) {
    throw toNetworkError(error)
  }
}

export async function httpPost<TResponse, TRequest = object>(
  path: string,
  body: TRequest,
  config?: AxiosRequestConfig
) {
  try {
    const response = await axiosInstance.post<TResponse>(path, body, config)
    return response.data
  } catch (error) {
    throw toNetworkError(error)
  }
}

export async function httpPut<TResponse, TRequest = object>(
  path: string,
  body: TRequest,
  config?: AxiosRequestConfig
): Promise<TResponse> {
  try {
    const response = await axiosInstance.put<TResponse>(path, body, config)
    return response.data
  } catch (error) {
    throw toNetworkError(error)
  }
}

export async function httpDelete<T>(path: string, config?: AxiosRequestConfig) {
  try {
    const response = await axiosInstance.delete<T>(path, config)
    return response.data
  } catch (error) {
    throw toNetworkError(error)
  }
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
// TODO: Update to follow new HTTP pattern
export async function httpPostDeprecatedKeepAlive<T>(
  path: string,
  data: object
) {
  return axiosFetchInstance.post<T>(path, data, {
    headers: axiosInstance.defaults.headers.common,
    fetchOptions: {
      credentials: 'include',
      keepalive: true,
    },
  })
}

export function getBootstrappedFeatureFlags() {
  return httpGet<FeatureFlagResponse>(`${API_PUBLIC_ROOT}/feature-flags`)
}

export function authStatus() {
  return httpGet<AuthStatusResponse>(`${AUTH_ROOT}/status`)
}

export function login(data: AuthPayload) {
  return httpPost<LoginResponse>(`${AUTH_ROOT}/login`, data)
}

export function logout() {
  return httpGet<void>(`${AUTH_ROOT}/logout`)
}

export function checkRegister(data: AuthPayload) {
  return httpPost<CheckCredentialResponse>(
    `${AUTH_ROOT}/register/checkcred`,
    data
  )
}

export default {
  _successHandler(res) {
    return Promise.resolve(res)
  },
  _errorHandler(res) {
    return Promise.reject(res)
  },
  _axiosErrorHandler(res: AxiosError): never {
    const data = res.response?.data as
      | {
          err?: string
          clientMessage?: string
          clientTitle?: string
          code?: string
        }
      | undefined
    const message =
      data?.clientMessage ??
      data?.err ??
      res.message ??
      'An unexpected error occurred.'
    throw new NetworkError(message, {
      status: res.response?.status,
      clientMessage: data?.clientMessage,
      clientTitle: data?.clientTitle,
      code: data?.code,
    })
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
  getBootstrappedFeatureFlags,
  authStatus,
  login,
  logout,
  checkRegister,
  getVolunteerPartner(partnerId) {
    return httpGetDeprecated(
      `${AUTH_ROOT}/partner/volunteer?partnerId=${encodeURIComponent(
        partnerId
      )}`
    ).then(this._successHandler, this._errorHandler)
  },
  getStudentPartner(partnerKey: string) {
    return httpGetDeprecated(
      `${AUTH_ROOT}/partner/student?partnerId=${encodeURIComponent(partnerKey)}`
    ).then(this._successHandler, this._axiosErrorHandler)
  },
  checkHealth() {
    return httpGetDeprecated(`${VERSION_ROOT}/version.json`).then(
      this._successHandler,
      this._errorHandler
    )
  },
  async registerOpenVolunteer(data: any) {
    const config = await getAdditionalConfig('registerVolunteer')
    return httpPostDeprecated(
      `${AUTH_ROOT}/register/volunteer/open`,
      data,
      config
    ).then(this._successHandler, this._errorHandler)
  },
  async registerPartnerVolunteer(data: any) {
    const config = await getAdditionalConfig('registerVolunteer')
    return httpPostDeprecated(
      `${AUTH_ROOT}/register/volunteer/partner`,
      data,
      config
    ).then(this._successHandler, this._errorHandler)
  },
  async registerStudent(data: any) {
    const config = await getAdditionalConfig('registerStudent')
    return httpPostDeprecated(
      `${AUTH_ROOT}/register/student`,
      data,
      config
    ).then(this._successHandler, this._errorHandler)
  },
  async registerTeacher(data: any) {
    const config = await getAdditionalConfig('registerTeacher')
    return httpPostDeprecated(
      `${AUTH_ROOT}/register/teacher`,
      data,
      config
    ).then(this._successHandler, this._errorHandler)
  },
  async sendReset(data: any) {
    const config = await getAdditionalConfig('sendReset')
    return httpPostDeprecated(`${AUTH_ROOT}/reset/send`, data, config).then(
      this._successHandler,
      this._errorHandler
    )
  },
  async confirmReset(data) {
    const config = await getAdditionalConfig('resetPassword')
    return httpPostDeprecated(`${AUTH_ROOT}/reset/confirm`, data, config).then(
      this._successHandler,
      this._errorHandler
    )
  },
  user() {
    return httpGetDeprecated(`${API_ROOT}/user`).then(
      this._successHandler,
      this._errorHandler
    )
  },
  userGlobal() {
    return httpGetDeprecated(`${API_ROOT}/user`).then(
      this._successHandler,
      this._errorHandler
    )
  },
  async sendVerification(data) {
    const config = await getAdditionalConfig('sendVerification')
    return httpPostDeprecated(`${API_ROOT}/verify/v2/send`, data, config).then(
      this._successHandler,
      this._errorHandler
    )
  },
  confirmVerification(data) {
    return httpPostDeprecated(`${API_ROOT}/verify/confirm`, data).then(
      this._successHandler,
      this._errorHandler
    )
  },
  sendContact(data) {
    return httpPostDeprecated(`${CONTACT_API_ROOT}/send`, data).then(
      this._successHandler,
      this._errorHandler
    )
  },
  setProfile(data) {
    return httpPutDeprecated(`${API_ROOT}/user`, data).then(
      this._successHandler,
      this._errorHandler
    )
  },
  deletePhone() {
    return httpDeleteDeprecated(`${API_ROOT}/user/phone`)
  },
  deleteAccount() {
    return httpDeleteDeprecated(`${API_ROOT}/user`)
  },
  getVolunteersAvailability(data) {
    return httpGetDeprecated(
      `${API_ROOT}/volunteers/availability/${data}`
    ).then(this._successHandler, this._errorHandler)
  },
  getVolunteers() {
    return httpGetDeprecated(`${API_ROOT}/volunteers`).then(
      this._successHandler,
      this._errorHandler
    )
  },
  getVolunteerLastUpdated() {
    return httpGetDeprecated(`${API_ROOT}/volunteers/hours-last-updated`).then(
      this._successHandler,
      this._errorHandler
    )
  },
  getReferredFriends() {
    return httpGetDeprecated(`${API_ROOT}/user/referred-friends`).then(
      this._successHandler,
      this._errorHandler
    )
  },
  getReferredBy(referralCode) {
    return httpGetDeprecated(`${REFERRAL_API_ROOT}/${referralCode}`).then(
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
      return await httpPostDeprecated<{
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
      return await httpPostDeprecated<{
        sessionId: Uuid
        session: CurrentSessionPublic
      }>(`${API_ROOT}/session/${sessionId}/breakout`, {})
    } catch (err) {
      return this._axiosErrorHandler(err as AxiosError)
    }
  },
  async joinSession(data: { sessionId: string; joinedFrom?: string }) {
    try {
      return await httpPostDeprecated<{
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
      return await httpPostDeprecated<{
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
      return await httpPostDeprecated<{
        sessionId: Uuid
        data: CurrentSessionPublic
      }>(`${API_ROOT}/session/current`, {})
    } catch (err) {
      return this._axiosErrorHandler(err as AxiosError)
    }
  },
  getRecapSessionForDms(data) {
    return httpPostDeprecated(`${API_ROOT}/session/recap-dms`, data).then(
      this._successHandler,
      this._errorHandler
    )
  },
  latestSession() {
    return httpPostDeprecated(`${API_ROOT}/session/latest`).then(
      this._successHandler,
      this._errorHandler
    )
  },
  getSession(sessionId) {
    return httpGetDeprecated(`${API_ROOT}/session/${sessionId}`).then(
      this._successHandler,
      this._errorHandler
    )
  },
  reportSession({ sessionId, reportReason, reportMessage, source }) {
    return httpPostDeprecated(`${API_ROOT}/session/${sessionId}/report`, {
      reportReason,
      reportMessage,
      source,
    }).then(this._successHandler, this._errorHandler)
  },
  uploadSessionImage({ sessionId, image }) {
    const formData = new FormData()
    formData.append('image', image)

    return httpPutDeprecated(
      `${API_ROOT}/session/${sessionId}/image`,
      formData
    ).then(this._successHandler, this._errorHandler)
  },
  async getAssignmentDocuments(assignmentId) {
    return httpGetDeprecated(
      `${API_ROOT}/assignment/${assignmentId}/documents`
    ).then(this._successHandler, this._errorHandler)
  },
  timedOutSession(sessionId, data) {
    return httpPostDeprecated(
      `${API_ROOT}/session/${sessionId}/timed-out`,
      data
    ).then(this._successHandler, this._errorHandler)
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

    return httpGetDeprecated(`${API_ROOT}/sessions?${queryParams}`).then(
      this._successHandler,
      this._errorHandler
    )
  },
  adminGetSession(sessionId) {
    return httpGetDeprecated(`${API_ROOT}/session/${sessionId}/admin`).then(
      this._successHandler,
      this._errorHandler
    )
  },
  adminReviewPendingVolunteer({ volunteerId, data }) {
    return httpPostDeprecated(
      `${API_ROOT}/volunteers/review/${volunteerId}`,
      data
    ).then(this._successHandler, this._errorHandler)
  },
  adminGetVolunteersToReview(page) {
    return httpGetDeprecated(`${API_ROOT}/volunteers/review?page=${page}`).then(
      this._successHandler,
      this._errorHandler
    )
  },
  adminGetSessionNotifications(sessionId) {
    return httpGetDeprecated(
      `${API_ROOT}/session/${sessionId}/notifications`
    ).then(this._successHandler, this._errorHandler)
  },
  adminGetSessionsToReview(page, studentFirstName) {
    return httpGetDeprecated(
      `${API_ROOT}/session/review?page=${page}&studentFirstName=${studentFirstName}`
    ).then(this._successHandler, this._errorHandler)
  },
  adminUpdateSession(sessionId, data) {
    return httpPutDeprecated(`${API_ROOT}/session/${sessionId}`, data).then(
      this._successHandler,
      this._errorHandler
    )
  },
  adminGetUser(userId, page) {
    return httpGetDeprecated(`${API_ROOT}/user/${userId}?page=${page}`).then(
      this._successHandler,
      this._errorHandler
    )
  },
  adminUpdateUser(userId, data) {
    return httpPutDeprecated(`${API_ROOT}/user/${userId}`, data).then(
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

    return httpGetDeprecated(`${API_ROOT}/users?${queryParams}`).then(
      this._successHandler,
      this._errorHandler
    )
  },
  adminGetIneligibleStudents(page) {
    return httpGetDeprecated(
      `${ELIGIBILITY_API_ROOT}/ineligible-students?page=${page}`
    ).then(this._successHandler, this._errorHandler)
  },
  adminGetSchool(schoolId) {
    return httpGetDeprecated(`${ADMIN_ROOT}/school/${schoolId}`).then(
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
    return httpGetDeprecated(`${ADMIN_ROOT}/schools?${queryParams}`).then(
      this._successHandler,
      this._errorHandler
    )
  },
  adminUpdateSchool(schoolId, data) {
    return httpPutDeprecated(
      `${ELIGIBILITY_API_ROOT}/school/${schoolId}`,
      data
    ).then(this._successHandler, this._errorHandler)
  },
  adminUpdateSchoolApproval(data) {
    return httpPostDeprecated(
      `${ELIGIBILITY_API_ROOT}/school/approval`,
      data
    ).then(this._successHandler, this._errorHandler)
  },
  adminUpdateSchoolPartnerStatus(data) {
    return httpPostDeprecated(
      `${ELIGIBILITY_API_ROOT}/school/partner`,
      data
    ).then(this._successHandler, this._errorHandler)
  },
  adminGetPartnerSchools() {
    return httpGetDeprecated(`${ADMIN_ROOT}/schools/partner-schools`).then(
      this._successHandler,
      this._errorHandler
    )
  },
  adminUploadRosterStudents(data) {
    return httpPostDeprecated(`${ADMIN_ROOT}/roster-students`, data).then(
      this._successHandler,
      this._errorHandler
    )
  },
  adminCleverRoster(districtId: string) {
    return httpPostDeprecated(`${ADMIN_ROOT}/clever/roster`, {
      districtId,
    }).then(this._successHandler, this._errorHandler)
  },
  adminCleverAddSchoolMapping(
    cleverSchoolId: string,
    upchieveSchoolId: string
  ) {
    return httpPostDeprecated(`${ADMIN_ROOT}/clever/school`, {
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
    return httpGetDeprecated(
      `${API_ROOT}/reports/session-report?${queryParams}`,
      {
        timeout: 300000,
      }
    ).then(this._successHandler, this._errorHandler)
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
    return httpGetDeprecated(
      `${API_ROOT}/reports/usage-report?${queryParams}`,
      {
        timeout: 300000,
      }
    ).then(this._successHandler, this._errorHandler)
  },
  adminGetVolunteerTelecomReport({ startDate, endDate, partnerOrg }) {
    const queryParams = new URLSearchParams({
      startDate,
      endDate,
      partnerOrg,
    }).toString()
    return httpGetDeprecated(
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
    return httpGetDeprecated(
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
    return httpGetDeprecated(`${AUTH_ROOT}/partner/student-partners`).then(
      this._successHandler,
      this._errorHandler
    )
  },
  adminGetVolunteerPartners() {
    return httpGetDeprecated(`${AUTH_ROOT}/partner/volunteer-partners`).then(
      this._successHandler,
      this._errorHandler
    )
  },
  adminGetSponsorOrgs() {
    return httpGetDeprecated(`${AUTH_ROOT}/partner/sponsor-orgs`).then(
      this._successHandler,
      this._errorHandler
    )
  },
  adminGetZipCodes(zipCode) {
    return httpGetDeprecated(
      `${ELIGIBILITY_API_ROOT}/zip-codes/${zipCode}`
    ).then(this._successHandler, this._errorHandler)
  },
  adminGetUserIdFromEmail(email) {
    return httpGetDeprecated(`${API_ROOT}/user/email/${email}`).then(
      this._successHandler,
      this._errorHandler
    )
  },
  adminNTHSAffiliateWithSchool(data: { chapterIds: string[] }) {
    return httpPostDeprecated(
      `${ADMIN_ROOT}/nths/school-affiliation`,
      data
    ).then(this._successHandler, this._errorHandler)
  },
  getQuestions(data) {
    return httpPostDeprecated(`${API_ROOT}/training/questions`, data).then(
      this._successHandler,
      this._errorHandler
    )
  },
  getQuizScore(data) {
    return httpPostDeprecated(`${API_ROOT}/training/score`, data).then(
      this._successHandler,
      this._errorHandler
    )
  },
  getReviewMaterials(data) {
    return httpGetDeprecated(`${API_ROOT}/training/review/${data}`).then(
      this._successHandler,
      this._errorHandler
    )
  },
  getTrainingCourse(courseKey) {
    return httpGetDeprecated(`${API_ROOT}/training/course/${courseKey}`).then(
      this._successHandler,
      this._errorHandler
    )
  },
  recordTrainingCourseProgress(courseKey, materialKey) {
    return httpPostDeprecated(
      `${API_ROOT}/training/course/${courseKey}/progress`,
      {
        materialKey,
      }
    ).then(this._successHandler, this._errorHandler)
  },
  updateSchedule(data) {
    return httpPostDeprecated(`${API_ROOT}/calendar/save`, data).then(
      this._successHandler,
      this._errorHandler
    )
  },
  getWaitTimes() {
    return httpGetDeprecated(`${API_ROOT}/stats/volunteer/heatmap`).then(
      this._successHandler,
      this._errorHandler
    )
  },
  searchSchool({ query }) {
    return httpGetDeprecated(
      `${ELIGIBILITY_API_ROOT}/school/search?q=${encodeURIComponent(query)}`
    ).then(this._successHandler, this._errorHandler)
  },
  checkZipCode({ zipCode }) {
    return httpGetDeprecated(
      `${ELIGIBILITY_API_ROOT}/check-zip-code/${zipCode}`
    ).then(this._successHandler, this._errorHandler)
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
    return httpPostDeprecated(`${ELIGIBILITY_API_ROOT}/check`, {
      email,
      gradeLevel,
      referredByCode,
      schoolId,
      zipCode,
    }).then(this._successHandler, this._axiosErrorHandler)
  },
  checkTeacherEligibility({ schoolId }: { schoolId: string }) {
    const queryParams = new URLSearchParams({ schoolId }).toString()
    return httpGetDeprecated(
      `${ELIGIBILITY_API_ROOT}/check/teacher?${queryParams}`
    ).then(this._successHandler, this._errorHandler)
  },
  checkIpAddress() {
    return httpGetDeprecated(`${ELIGIBILITY_API_ROOT}/ip-check`).then(
      this._successHandler,
      this._errorHandler
    )
  },
  checkIfMessageIsClean(data) {
    return httpPostDeprecated(`${API_ROOT}/moderate/message`, data).then(
      this._successHandler,
      this._errorHandler
    )
  },
  checkIfImageIsClean(data) {
    return httpPostDeprecated(`${API_ROOT}/moderate/image`, data).then(
      this._successHandler,
      this._errorHandler
    )
  },
  checkIfVideoFrameIsClean(data) {
    return httpPostDeprecated(`${API_ROOT}/moderate/video-frame`, data).then(
      this._successHandler,
      this._errorHandler
    )
  },
  feedback(data) {
    return httpPostDeprecated(`${API_ROOT}/feedback`, data).then(
      this._successHandler,
      this._errorHandler
    )
  },
  checkReference(referenceId) {
    return httpGetDeprecated(`${REFERENCE_API_ROOT}/${referenceId}`).then(
      this._successHandler,
      this._errorHandler
    )
  },
  saveReferenceForm(referenceId, data) {
    return httpPostDeprecated(
      `${REFERENCE_API_ROOT}/${referenceId}/submit`,
      data
    ).then(this._successHandler, this._errorHandler)
  },
  uploadVolunteerPhoto(file) {
    const formData = new FormData()
    formData.append('file', file)
    return httpPutDeprecated(
      `${API_ROOT}/user/volunteer-approval/photo`,
      formData
    ).then(this._successHandler, this._errorHandler)
  },
  addBackgroundInfo(data) {
    return httpPostDeprecated(
      `${API_ROOT}/user/volunteer-approval/background-information`,
      data
    ).then(this._successHandler, this._errorHandler)
  },
  submitSurvey(survey) {
    return httpPostDeprecated(`${API_ROOT}/survey/save`, survey).then(
      this._successHandler,
      this._errorHandler
    )
  },
  getPresessionSurveyForFeedback(sessionId) {
    return httpGetDeprecated(`${API_ROOT}/survey/presession/${sessionId}`).then(
      this._successHandler,
      this._errorHandler
    )
  },
  getStudentsPresessionGoal(sessionId) {
    return httpGetDeprecated(
      `${API_ROOT}/survey/presession/${sessionId}/goal`
    ).then(this._successHandler, this._errorHandler)
  },
  getSurveyById(surveyId: number) {
    return httpGetDeprecated(`${API_ROOT}/surveys/${surveyId}`).then(
      this._successHandler,
      this._errorHandler
    )
  },
  getPresessionSurvey(subjectName) {
    return httpGetDeprecated(
      `${API_ROOT}/survey/presession?subject=${subjectName}`
    ).then(this._successHandler, this._errorHandler)
  },
  getPresessionSurveyResponse(sessionId) {
    return httpGetDeprecated(
      `${API_ROOT}/survey/presession/response/${sessionId}`
    ).then(this._successHandler, this._errorHandler)
  },
  getPostsessionSurvey(subjectName, sessionId, role) {
    return httpGetDeprecated(
      `${API_ROOT}/survey/postsession?subject=${subjectName}&sessionId=${sessionId}&role=${role}`
    ).then(this._successHandler, this._errorHandler)
  },
  getPostsessionSurveyResponse(sessionId, role) {
    return httpGetDeprecated(
      `${API_ROOT}/survey/postsession/response?sessionId=${sessionId}&role=${role}`
    ).then(this._successHandler, this._errorHandler)
  },
  getImpactStudySurvey() {
    return httpGetDeprecated(`${API_ROOT}/survey/impact-study`).then(
      this._successHandler,
      this._errorHandler
    )
  },
  getImpactStudySurveyResponses() {
    return httpGetDeprecated(`${API_ROOT}/survey/impact-study/responses`).then(
      this._successHandler,
      this._errorHandler
    )
  },
  getUserProductFlags() {
    return httpGetDeprecated(`${API_ROOT}/product-flags`).then(
      this._successHandler,
      this._errorHandler
    )
  },
  updateFavoriteVolunteerStatus(volunteerId, data) {
    return httpPostDeprecated(
      `${API_ROOT}/students/favorite-volunteers/${volunteerId}`,
      data
    ).then(this._successHandler, this._errorHandler)
  },
  getRemainingFavoriteVolunteers() {
    return httpGetDeprecated(
      `${API_ROOT}/students/remaining-favorite-volunteers`
    ).then(this._successHandler, this._errorHandler)
  },
  checkIsFavoriteVolunteer(volunteerId) {
    return httpGetDeprecated(
      `${API_ROOT}/students/favorite-volunteers/${volunteerId}`
    ).then(this._successHandler, this._errorHandler)
  },
  getSessionHistory(filter) {
    const queryParams = new URLSearchParams(filter).toString()
    return httpGetDeprecated(
      `${API_ROOT}/sessions/history${queryParams.length ? `?${queryParams}` : ''}`
    ).then(this._successHandler, this._errorHandler)
  },
  getTotalSessionHistory(filter) {
    const queryParams = new URLSearchParams(filter).toString()
    return httpGetDeprecated(
      `${API_ROOT}/sessions/history/total${queryParams.length ? `?${queryParams}` : ''}`
    ).then(this._successHandler, this._errorHandler)
  },
  getVolunteerFirstSessionDate() {
    return httpGetDeprecated(`${API_ROOT}/sessions/first-session-date`).then(
      this._successHandler,
      this._errorHandler
    )
  },
  getPastVolunteers() {
    return httpGetDeprecated(`${API_ROOT}/students/past-volunteers`).then(
      this._successHandler,
      this._errorHandler
    )
  },
  getSessionRecap(sessionId) {
    return httpGetDeprecated(`${API_ROOT}/sessions/${sessionId}/recap`).then(
      this._successHandler,
      this._errorHandler
    )
  },
  getStudentSignupSources() {
    return httpGetDeprecated(
      `${ELIGIBILITY_API_ROOT}/signup-sources/students`
    ).then(this._successHandler, this._errorHandler)
  },
  adminGetActivePartnersForStudent(studentId) {
    return httpGetDeprecated(
      `${API_ROOT}/students/partners/active?student=${studentId}`
    ).then(this._successHandler, this._errorHandler)
  },
  getSubjects() {
    return httpGetDeprecated(`${API_ROOT}/subjects`).then(
      this._successHandler,
      this._errorHandler
    )
  },
  getIsSubjectValid(subject, topic) {
    return httpGetDeprecated<{ isValid: boolean }>(
      `${API_ROOT}/subjects/is-valid?subject=${subject}&topic=${topic}`
    ).then(this._successHandler, this._errorHandler)
  },
  getTrainingSubjects() {
    return httpGetDeprecated(`${API_ROOT}/subjects/training`).then(
      this._successHandler,
      this._errorHandler
    )
  },
  isSessionRecapEligible(sessionId, data) {
    return httpPostDeprecated(
      `${API_ROOT}/sessions/history/${sessionId}/eligible`,
      data
    ).then(this._successHandler, this._errorHandler)
  },
  getProgressReportForSession(sessionId) {
    return httpGetDeprecated(
      `${API_ROOT}/progress-reports/sessions/${sessionId}`
    ).then(this._successHandler, this._errorHandler)
  },
  getProgressReportsForSubject(subject, page) {
    return httpGetDeprecated(
      `${API_ROOT}/progress-reports/subjects/${subject}?page=${page}`
    ).then(this._successHandler, this._errorHandler)
  },
  getProgressReportSummariesForSubject(subject) {
    return httpGetDeprecated(
      `${API_ROOT}/progress-reports/summaries/${subject}`
    ).then(this._successHandler, this._errorHandler)
  },
  getLatestProgressReportOverviewForSubject(subject) {
    return httpGetDeprecated(
      `${API_ROOT}/progress-reports/summaries/${subject}/latest`
    ).then(this._successHandler, this._errorHandler)
  },
  updateProgressReportsReadStatus(reportIds) {
    return httpPostDeprecated(`${API_ROOT}/progress-reports/read`, {
      reportIds,
    }).then(this._successHandler, this._errorHandler)
  },
  getUnreadProgressReports() {
    return httpGetDeprecated(
      `${API_ROOT}/progress-reports/overview/stats`
    ).then(this._successHandler, this._errorHandler)
  },
  getLatestProgressReportOverviewSubject() {
    return httpGetDeprecated(
      `${API_ROOT}/progress-reports/overview/latest/subject`
    ).then(this._successHandler, this._errorHandler)
  },
  getProgressReportSurvey() {
    return httpGetDeprecated(`${API_ROOT}/survey/progress-report`).then(
      this._successHandler,
      this._errorHandler
    )
  },
  getProgressReportSurveyResponses(progressReportId) {
    return httpGetDeprecated(
      `${API_ROOT}/survey/progress-report/${progressReportId}/response`
    ).then(this._successHandler, this._errorHandler)
  },
  getTeacherClasses() {
    return httpGetDeprecated(`${API_ROOT}/teachers/classes`).then(
      this._successHandler,
      this._errorHandler
    )
  },
  createTeacherClass(className, topicId) {
    return httpPostDeprecated(`${API_ROOT}/teachers/class`, {
      className,
      topicId,
    }).then(this._successHandler, this._errorHandler)
  },
  getStudentsInTeacherClass(classId) {
    return httpGetDeprecated(
      `${API_ROOT}/teachers/class/${classId}/students`
    ).then(this._successHandler, this._errorHandler)
  },
  getTeacherClassByClassCode(classCode) {
    return httpGetDeprecated(
      `${API_ROOT}/teachers/class/?classCode=${classCode}`
    ).then(this._successHandler, this._errorHandler)
  },
  getTeacherClassById(classId) {
    return httpGetDeprecated(`${API_ROOT}/teachers/class/${classId}`).then(
      this._successHandler,
      this._errorHandler
    )
  },
  getStudentSessionDetails(studentId) {
    return httpGetDeprecated(`${API_ROOT}/sessions/student/${studentId}`).then(
      this._successHandler,
      this._errorHandler
    )
  },
  getTopics() {
    return httpGetDeprecated(`${API_ROOT}/topics`).then(
      this._successHandler,
      this._errorHandler
    )
  },
  saveBigFutureEmailForStudy(email) {
    return httpPostDeprecated(`${ELIGIBILITY_API_ROOT}/big-future/email`, {
      email,
    }).then(this._successHandler, this._errorHandler)
  },
  addStudentToClass({ email, classCode, gradeLevel }) {
    return httpPostDeprecated(`${API_PUBLIC_ROOT}/students/class`, {
      email,
      classCode,
      gradeLevel,
    }).then(this._successHandler, this._errorHandler)
  },
  async getAllMessagesForBotConversation(conversationId: Uuid) {
    try {
      return await httpGetDeprecated<TutorBotTranscriptPublic>(
        `${API_ROOT}/tutor-bot/conversations/${conversationId}`
      )
    } catch (err) {
      return this._axiosErrorHandler(err as AxiosError)
    }
  },
  getOrCreateTutorBotConversationWithMessagesBySessionId(sessionId: Uuid) {
    return httpPutDeprecated(
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

      return await httpPostDeprecated<TutorBotAddMessageResponsePublic>(
        `${API_ROOT}/tutor-bot/conversations/${conversationId}/message`,
        form
      )
    } catch (err) {
      return this._axiosErrorHandler(err as AxiosError)
    }
  },
  enrollStudentInIncentiveProgram(proxyEmail) {
    return httpPostDeprecated(
      `${API_ROOT}/product-flags/fall-incentive-enrollment/enroll`,
      {
        proxyEmail,
      }
    ).then(this._successHandler, this._errorHandler)
  },
  deniedIncentiveProgramEnrollment() {
    return httpPostDeprecated(
      `${API_ROOT}/product-flags/fall-incentive-enrollment/denied`
    ).then(this._successHandler, this._errorHandler)
  },
  getStudentClasses() {
    return httpGetDeprecated(`${API_ROOT}/students/classes`).then(
      this._successHandler,
      this._errorHandler
    )
  },
  getStudentAssignments() {
    return httpGetDeprecated(`${API_ROOT}/students/assignments`).then(
      this._successHandler,
      this._errorHandler
    )
  },
  getAssignmentById(assignmentId: string) {
    return httpGetDeprecated(`${API_ROOT}/assignment/${assignmentId}`).then(
      this._successHandler,
      this._errorHandler
    )
  },
  upsertAssignment(formData: FormData) {
    return httpPutDeprecated(`${API_ROOT}/teachers/assignment`, formData).then(
      this._successHandler,
      this._errorHandler
    )
  },
  createAssignments(formData: FormData) {
    return httpPostDeprecated(
      `${API_ROOT}/teachers/assignments`,
      formData
    ).then(this._successHandler, this._errorHandler)
  },
  getAssignmentsByClassId(classId: string) {
    return httpGetDeprecated(
      `${API_ROOT}/teachers/class/${classId}/assignments`
    ).then(this._successHandler, this._errorHandler)
  },
  getStudentAssignmentCompletion(assignmentId) {
    return httpGetDeprecated(
      `${API_ROOT}/assignment/${assignmentId}/students`
    ).then(this._successHandler, this._errorHandler)
  },
  getAllAssignmentsForTeacher() {
    return httpGetDeprecated(`${API_ROOT}/teachers/assignments`).then(
      this._successHandler,
      this._errorHandler
    )
  },
  getAssignmentForSession(sessionId) {
    return httpGetDeprecated(
      `${API_ROOT}/session/${sessionId}/assignment`
    ).then(this._successHandler, this._errorHandler)
  },
  deleteAssignment(assignmentId) {
    return httpDeleteDeprecated(`${API_ROOT}/assignment/${assignmentId}`).then(
      this._successHandler,
      this._errorHandler
    )
  },
  updateTeacherClass({ classData }) {
    return httpPostDeprecated(
      `${API_ROOT}/teachers/class/update`,
      classData
    ).then(this._successHandler, this._errorHandler)
  },
  deactivateTeacherClass(id) {
    return httpPostDeprecated(`${API_ROOT}/teachers/class/deactivate`, id).then(
      this._successHandler,
      this._errorHandler
    )
  },
  removeStudentFromClass({ studentId, classId }) {
    return httpDeleteDeprecated(
      `${API_ROOT}/teachers/class/${classId}/student/${studentId}/remove`
    ).then(this._successHandler, this._errorHandler)
  },
  getUserRewards(offset) {
    return httpGetDeprecated(`${API_ROOT}/rewards?offset=${offset}`).then(
      this._successHandler,
      this._errorHandler
    )
  },
  getOrCreateSessionMeeting(sessionId) {
    return httpPostDeprecated(`${API_ROOT}/sessions/${sessionId}/meeting`).then(
      this._successHandler,
      this._errorHandler
    )
  },
  startSessionMeetingTranscription(sessionId) {
    return httpPostDeprecated(
      `${API_ROOT}/sessions/${sessionId}/meeting/start-transcription`
    ).then(this._successHandler, this._errorHandler)
  },
  startSessionRecording(sessionId: string) {
    return httpPostDeprecated(
      `${API_ROOT}/sessions/${sessionId}/meeting/start-recording`
    ).then(this._successHandler, this._errorHandler)
  },
  endSessionMeeting(sessionId) {
    return httpPutDeprecated(`${API_ROOT}/sessions/${sessionId}/meeting}`).then(
      this._successHandler,
      this._errorHandler
    )
  },
  addVolunteerRoleForStudent() {
    return httpPostDeprecated(`${API_ROOT}/user/roles/volunteer`).then(
      this._successHandler,
      this._errorHandler
    )
  },
  switchActiveRole(activeRole: 'student' | 'volunteer') {
    return httpPutDeprecated(`${API_ROOT}/user/roles/active`, {
      activeRole,
    }).then(this._successHandler, this._errorHandler)
  },
  getVolunteerPresence() {
    return httpGetDeprecated(`${API_ROOT}/volunteers/presence`, {}).catch(
      this._axiosErrorHandler
    )
  },
  updateUserPreferredLanguage(preferredLanguage: string) {
    return httpPostDeprecated<void>(`${API_ROOT}/user/preferred-language`, {
      preferredLanguage,
    }).catch(this._axiosErrorHandler)
  },
  async upsertImpactStudyCampaign(campaign: ImpactStudyCampaign) {
    try {
      return await httpPostDeprecated<{ impactStudyEnrollmentAt?: Date }>(
        `${API_ROOT}/product-flags/impact-study-campaigns`,
        { campaign }
      )
    } catch (err) {
      //  TODO: Error handling and throwing will probably need to be centralized in the `http*` methods (httpGetDeprecated, httpPostDeprecated, etc.)
      return this._axiosErrorHandler(err as AxiosError)
    }
  },
  sendReferralText(phoneNumber: string) {
    return httpPostDeprecated(`${API_ROOT}/send-referral-text`, {
      phoneNumber,
    }).then(this._successHandler, this._errorHandler)
  },
  trackPresenceActive(clientUUID: string) {
    return httpPostDeprecated(`${API_ROOT}/user/track-presence/active`, {
      clientUUID,
    }).then(this._successHandler, this._errorHandler)
  },
  trackPresenceInactive(clientUUID: string) {
    return httpPostDeprecatedKeepAlive(
      `${API_ROOT}/user/track-presence/inactive`,
      {
        clientUUID,
      }
    ).then(this._successHandler, this._errorHandler)
  },
  trackPresencePassive(clientUUID: string) {
    return httpPostDeprecatedKeepAlive(
      `${API_ROOT}/user/track-presence/passive`,
      {
        clientUUID,
      }
    ).then(this._successHandler, this._errorHandler)
  },
  trackPresenceCheckForInactivity(clientUUID: string) {
    return httpPostDeprecatedKeepAlive(
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
    return httpPutDeprecated(
      `${API_ROOT}/user/volunteer/complete-sso-signup`,
      data
    ).then(this._successHandler, this._errorHandler)
  },
  getNTHSGroupsForUser() {
    return httpGetDeprecated(`${API_ROOT}/nths-groups`, {}).catch(
      this._axiosErrorHandler
    )
  },
  getNTHSGroupByCode(code: string) {
    return httpGetDeprecated(
      `${API_PUBLIC_ROOT}/nths-groups/${code}`,
      {}
    ).catch(this._axiosErrorHandler)
  },
  getNTHSGroupMembers(groupId: string) {
    return httpGetDeprecated(
      `${API_ROOT}/nths-groups/${groupId}/members`
    ).catch(this._axiosErrorHandler)
  },
  updateNTHSGroupMember(
    groupId: string,
    userId: string,
    data: NTHSMemberUpdate
  ) {
    return httpPutDeprecated(
      `${API_ROOT}/nths-groups/${groupId}/members/${userId}`,
      data
    ).catch(this._axiosErrorHandler)
  },
  leaveNthsChapter(groupId: string) {
    return httpDeleteDeprecated(
      `${API_ROOT}/nths-groups/${groupId}/leave`,
      {}
    ).catch(this._axiosErrorHandler)
  },
  joinVolunteerToNTHSGroup({
    email,
    inviteCode,
  }: {
    email: string
    inviteCode: string
  }) {
    return httpPostDeprecated(`${API_PUBLIC_ROOT}/nths-groups/join`, {
      email,
      inviteCode,
    }).then(this._successHandler, this._errorHandler)
  },
  createNTHSGroup() {
    return httpPostDeprecated(`${API_ROOT}/nths-groups/new`, {}).then(
      this._successHandler,
      this._errorHandler
    )
  },
  editNTHSGroup({ groupId, name }: { groupId: string; name: string }) {
    return httpPutDeprecated(`${API_ROOT}/nths-groups/${groupId}`, {
      name,
    }).then(this._successHandler, this._errorHandler)
  },
  getNTHSChapterImpact(groupId: string, monthStartsAt?: Date) {
    return httpGetDeprecated<NTHSChapterImpactResponse>(
      `${API_ROOT}/nths-groups/${groupId}/impact`,
      monthStartsAt
        ? { params: { monthStartsAt: monthStartsAt.toISOString() } }
        : undefined
    ).catch(this._axiosErrorHandler)
  },
  getNTHSChapterRoster(
    groupId: string,
    periodStarts?: Record<CalendarRosterPeriod, Date>
  ) {
    return httpGetDeprecated<NTHSChapterRosterResponse>(
      `${API_ROOT}/nths-groups/${groupId}/roster`,
      periodStarts
        ? {
            params: {
              weekStartsAt: periodStarts.thisWeek.toISOString(),
              lastTwoWeeksStartsAt: periodStarts.lastTwoWeeks.toISOString(),
              monthStartsAt: periodStarts.thisMonth.toISOString(),
            },
          }
        : undefined
    ).catch(this._axiosErrorHandler)
  },
  getActionsForNTHSGroup(groupId: string) {
    return httpGetDeprecated(
      `${API_ROOT}/nths-groups/${groupId}/actions`
    ).catch(this._axiosErrorHandler)
  },
  createActionForNTHSGroup(groupId: string, action: NTHSActionName) {
    return httpPostDeprecated(`${API_ROOT}/nths-groups/${groupId}/actions`, {
      action,
    }).then(this._successHandler, this._errorHandler)
  },
  deleteActionForNTHSGroup(groupId: string, action: NTHSActionName) {
    return httpDeleteDeprecated(
      `${API_ROOT}/nths-groups/${groupId}/actions/${encodeURIComponent(action)}`
    ).then(this._successHandler, this._errorHandler)
  },
  submitSchoolAffiliation(groupId: string, advisorInfo: AdvisorInfo) {
    return httpPostDeprecated(
      `${API_ROOT}/nths-groups/${groupId}/submit-school-affiliation`,
      advisorInfo
    ).then(this._successHandler, this._errorHandler)
  },
  getNTHSApplicationEligibility() {
    return httpGetDeprecated<{
      eligible: boolean
      reasons?: string[]
      currentGradeName?: string
      applyPreview?: NTHSApplyPreview
    }>(`${API_ROOT}/nths-application/eligibility`)
  },
  submitNTHSApplication(data: {
    schoolId?: string
    unlistedSchool?: NTHSUnlistedSchool
    gradeLevel: string
    responses: Record<string, string | boolean>
    formVersion: NTHSFormVersion
  }) {
    return httpPostDeprecated(`${API_ROOT}/nths-application`, data).then(
      this._successHandler,
      this._errorHandler
    )
  },
  async createTutorBotSession(data: TutorBotCreateConvoPayload) {
    try {
      return await httpPostDeprecated<TutorBotNewConversationPublic>(
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
      await httpPatchDeprecated<void>(
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
    return httpPostDeprecated<{ qrUrl: string }>(
      `${API_ROOT}/totp/enroll`,
      {}
    ).then(this._successHandler, this._axiosErrorHandler)
  },
  totpVerify(token: string) {
    return httpPostDeprecated<{ verified: boolean }>(
      `${API_ROOT}/totp/verify`,
      {
        token,
      }
    ).then(this._successHandler, this._axiosErrorHandler)
  },
  updateSessionLastSeen(sessionId: Uuid, userId: Uuid) {
    return httpPostDeprecated(
      `${API_ROOT}/session/${sessionId}/recap/${userId}/update-last-seen`,
      {}
    ).then(this._successHandler, this._errorHandler)
  },
  checkForUnreadDMs() {
    return httpGetDeprecated(`${API_ROOT}/sessions/unread-dms`).then(
      this._successHandler,
      this._errorHandler
    )
  },
  async submitEssayReview(data: {
    subject: AsyncReviewSubject
    essay: string
    essayPurpose?: string
    essayPrompt?: string
    additionalContext?: string
    reviewReasons: string[]
    reviewEmail: string
  }) {
    try {
      return await httpPostDeprecated<{
        essayReview: {
          id: Uuid
          status: EssayReviewStatus
          submittedAt: DateString
        }
      }>(`${API_ROOT}/essay-reviews`, data)
    } catch (err) {
      return this._axiosErrorHandler(err as AxiosError)
    }
  },
  async adminGetEssayReviews() {
    try {
      return await httpGetDeprecated<{ essayReviews: EssayReviewSubmission[] }>(
        `${ADMIN_ROOT}/essay-reviews`
      )
    } catch (err) {
      return this._axiosErrorHandler(err as AxiosError)
    }
  },
  async getEssayReviewsForVolunteer() {
    try {
      return await httpGetDeprecated<{
        essayReviews: EssayReviewSubmissionForVolunteer[]
      }>(`${API_ROOT}/essay-reviews/list`)
    } catch (err) {
      return this._axiosErrorHandler(err as AxiosError)
    }
  },
  async getPendingAsyncReviewCount() {
    try {
      return await httpGetDeprecated<{ count: number }>(
        `${API_ROOT}/essay-reviews/count`
      )
    } catch (err) {
      return this._axiosErrorHandler(err as AxiosError)
    }
  },
  async submitVolunteerEssayReview(submissionId: string, review: string) {
    try {
      return await httpPostDeprecated<void>(
        `${API_ROOT}/essay-reviews/volunteer/${submissionId}/reviews`,
        { review }
      )
    } catch (err) {
      return this._axiosErrorHandler(err as AxiosError)
    }
  },
  async getEssayReviewEmailPreference() {
    try {
      return await httpGetDeprecated<{ optedIn: boolean }>(
        `${API_ROOT}/essay-reviews/volunteer/email-preference`
      )
    } catch (err) {
      return this._axiosErrorHandler(err as AxiosError)
    }
  },
  async updateEssayReviewEmailPreference(optedIn: boolean) {
    try {
      return await httpPostDeprecated<void>(
        `${API_ROOT}/essay-reviews/volunteer/email-preference`,
        { optedIn }
      )
    } catch (err) {
      return this._axiosErrorHandler(err as AxiosError)
    }
  },
  async adminGetEssayReview(submissionId: string) {
    try {
      return await httpGetDeprecated<{ essayReview: EssayReviewSubmission }>(
        `${ADMIN_ROOT}/essay-reviews/${submissionId}`
      )
    } catch (err) {
      return this._axiosErrorHandler(err as AxiosError)
    }
  },
  async adminUpdateEssayReview(
    submissionId: string,
    status: EssayReviewStatus
  ) {
    try {
      return await httpPostDeprecated<{ essayReview: EssayReviewSubmission }>(
        `${ADMIN_ROOT}/essay-reviews/${submissionId}`,
        { status }
      )
    } catch (err) {
      return this._axiosErrorHandler(err as AxiosError)
    }
  },
  async adminSendEssayReviews(submissionId: Uuid, finalReviews: string[]) {
    try {
      return await httpPostDeprecated<{ essayReview: EssayReviewSubmission }>(
        `${ADMIN_ROOT}/essay-reviews/${submissionId}/send`,
        { finalReviews }
      )
    } catch (err) {
      return this._axiosErrorHandler(err as AxiosError)
    }
  },
}
