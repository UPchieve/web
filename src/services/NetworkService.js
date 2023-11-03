import errcode from 'err-code'
import promiseRetry from 'promise-retry'
import config from '../config'
import axios from 'axios'

const AUTH_ROOT = `${config.serverRoot}/auth`
const API_ROOT = `${config.serverRoot}/api`
const ADMIN_ROOT = `${API_ROOT}/admin`
const ELIGIBILITY_API_ROOT = `${config.serverRoot}/api-public/eligibility`
const CONTACT_API_ROOT = `${config.serverRoot}/api-public/contact`
const REFERENCE_API_ROOT = `${config.serverRoot}/api-public/reference`
const REFERRAL_API_ROOT = `${config.serverRoot}/api-public/referral`
const WHITEBOARD_ROOT = `${config.serverRoot}/whiteboard`
const HEALTH_ROOT = `${config.serverRoot}/healthz`

const FAULT_TOLERANT_HTTP_TIMEOUT = 10000
const FAULT_TOLERANT_HTTP_MAX_RETRY_TIMEOUT = 100000
const FAULT_TOLERANT_HTTP_MAX_RETRIES = 10

export const axiosInstance = axios.create({
  withCredentials: true,
  baseURL: config.serverRoot,
})

export function httpGet(path, config) {
  return axiosInstance.get(path, config)
}

export function httpPost(path, data) {
  return axiosInstance.post(path, data)
}

export function httpPut(path, data) {
  return axiosInstance.put(path, data)
}

export default {
  _successHandler(res) {
    return Promise.resolve(res)
  },
  _errorHandler(res) {
    return Promise.reject(res)
  },
  _faultTolerantHttp(method, onRetry, url, data) {
    const promiseToRetry = () => {
      return (['get', 'delete', 'head', 'jsonp'].indexOf(method) !== -1
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
      retry => {
        if (requestState.isAborted) {
          // early exit
          throw errcode(new Error('Aborted by user'), 'EUSERABORTED')
        }

        return promiseToRetry().catch(res => {
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
  getCsrfToken() {
    return httpGet(`${API_ROOT}/csrftoken`).then(
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
  getStudentPartner(partnerId) {
    return httpGet(
      `${AUTH_ROOT}/partner/student?partnerId=${encodeURIComponent(partnerId)}`
    ).then(this._successHandler, this._errorHandler)
  },
  checkHealth() {
    return httpGet(`${HEALTH_ROOT}`).then(
      this._successHandler,
      this._errorHandler
    )
  },
  registerOpenVolunteer(data) {
    return httpPost(`${AUTH_ROOT}/register/volunteer/open`, data).then(
      this._successHandler,
      this._errorHandler
    )
  },
  registerPartnerVolunteer(data) {
    return httpPost(`${AUTH_ROOT}/register/volunteer/partner`, data).then(
      this._successHandler,
      this._errorHandler
    )
  },
  registerOpenStudent(data) {
    return httpPost(`${AUTH_ROOT}/register/student/open`, data).then(
      this._successHandler,
      this._errorHandler
    )
  },
  registerPartnerStudent(data) {
    return httpPost(`${AUTH_ROOT}/register/student/partner`, data).then(
      this._successHandler,
      this._errorHandler
    )
  },
  sendReset(data) {
    return httpPost(`${AUTH_ROOT}/reset/send`, data).then(
      this._successHandler,
      this._errorHandler
    )
  },
  confirmReset(data) {
    return httpPost(`${AUTH_ROOT}/reset/confirm`, data).then(
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
  sendVerification(data) {
    return httpPost(`${API_ROOT}/verify/send`, data).then(
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
  newSession(data, onRetry) {
    return this._faultTolerantHttp(
      'post',
      onRetry,
      `${API_ROOT}/session/new`,
      data
    )
  },
  endSession(data) {
    return httpPost(`${API_ROOT}/session/end`, data).then(
      this._successHandler,
      this._errorHandler
    )
  },
  checkSession(data, onRetry) {
    return this._faultTolerantHttp(
      'post',
      onRetry,
      `${API_ROOT}/session/check`,
      data
    )
  },
  currentSession(data) {
    return httpPost(`${API_ROOT}/session/current`, data).then(
      this._successHandler,
      this._errorHandler
    )
  },
  getRecapSessionForDms(data) {
    return httpPost(`${API_ROOT}/session/recap-dms`, data).then(
      this._successHandler,
      this._errorHandler
    )
  },
  latestSession(data) {
    return httpPost(`${API_ROOT}/session/latest`, data).then(
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
  timedOutSession(sessionId, data) {
    return httpPost(`${API_ROOT}/session/${sessionId}/timed-out`, data).then(
      this._successHandler,
      this._errorHandler
    )
  },
  resetWhiteboard(data) {
    return httpPost(`${WHITEBOARD_ROOT}/reset`, data).then(
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
    highSchool,
  }) {
    const queryParams = new URLSearchParams({
      page,
      userId,
      firstName,
      lastName,
      email,
      partnerOrg,
      highSchool,
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
    return httpGet(`${ELIGIBILITY_API_ROOT}/school/${schoolId}`).then(
      this._successHandler,
      this._errorHandler
    )
  },
  adminGetSchools({ name, state, city, page }) {
    const queryParams = new URLSearchParams({
      name,
      state,
      city,
      page,
    }).toString()
    return httpGet(`${ELIGIBILITY_API_ROOT}/schools?${queryParams}`).then(
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
    schoolUpchieveId,
    zipCode,
    email,
    referredByCode,
    currentGrade,
  }) {
    return httpPost(`${ELIGIBILITY_API_ROOT}/check`, {
      schoolUpchieveId,
      zipCode,
      email,
      referredByCode,
      currentGrade,
    }).then(this._successHandler, this._errorHandler)
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
  feedback(data) {
    return httpPost(`${API_ROOT}/feedback`, data).then(
      this._successHandler,
      this._errorHandler
    )
  },
  getFeedback({ sessionId, userType }) {
    const queryParams = new URLSearchParams({
      sessionId,
      userType,
    }).toString()
    return httpGet(`${API_ROOT}/feedback?${queryParams}`).then(
      this._successHandler,
      this._errorHandler
    )
  },
  savePushToken(data) {
    return httpPost(`${API_ROOT}/push-token/save`, data).then(
      this._successHandler,
      this._errorHandler
    )
  },
  addReference({ referenceFirstName, referenceLastName, referenceEmail }) {
    return httpPost(`${API_ROOT}/user/volunteer-approval/reference`, {
      referenceFirstName,
      referenceLastName,
      referenceEmail,
    }).then(this._successHandler, this._errorHandler)
  },
  deleteReference({ referenceEmail }) {
    return httpPost(`${API_ROOT}/user/volunteer-approval/reference/delete`, {
      referenceEmail,
    }).then(this._successHandler, this._errorHandler)
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
  getSessionHistory(page) {
    return httpGet(`${API_ROOT}/sessions/history?page=${page}`).then(
      this._successHandler,
      this._errorHandler
    )
  },
  getTotalSessionHistory() {
    return httpGet(`${API_ROOT}/sessions/history/total`).then(
      this._successHandler,
      this._errorHandler
    )
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
    return httpGet(
      `${API_ROOT}/subjects/is-valid?subject=${subject}&topic=${topic}`
    ).then(this._successHandler, this._errorHandler)
  },
  getTrainingSubjects() {
    return httpGet(`${API_ROOT}/subjects/training`).then(
      this._successHandler,
      this._errorHandler
    )
  },
  queueStudentsTextReminder(data) {
    return httpPost(`${API_ROOT}/students/reminders/text`, data).then(
      this._successHandler,
      this._errorHandler
    )
  },
  fallIncentiveProgramEnrollmentEnroll(data) {
    return httpPost(
      `${API_ROOT}/product-flags/fall-incentive-enrollment/enroll`,
      data
    ).then(this._successHandler, this._errorHandler)
  },
  isSessionRecapEligible(sessionId, data) {
    return httpPost(
      `${API_ROOT}/sessions/history/${sessionId}/eligible`,
      data
    ).then(this._successHandler, this._errorHandler)
  },
}
