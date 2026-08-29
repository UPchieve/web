import { expect } from '@playwright/test'

const SCHOOL_APPROVAL_ACTION = 'MARKED SCHOOL AFFILIATION IN PROGRESS'

const itemTestId = (actionName) => `checklist-item-${actionName}`
const checkboxTestId = (actionName) => `checklist-checkbox-${actionName}`
const controlTestId = (actionName) => `checklist-control-${actionName}`

export class NTHSChapterPage {
  page

  constructor(page) {
    this.page = page
    this.schoolApprovalItem = page.getByTestId(
      itemTestId(SCHOOL_APPROVAL_ACTION)
    )
    this.schoolApprovalCheckbox = page.getByTestId(
      checkboxTestId(SCHOOL_APPROVAL_ACTION)
    )
    this.schoolApprovalControl = page.getByTestId(
      controlTestId(SCHOOL_APPROVAL_ACTION)
    )
    this.schoolApprovedPath = page.getByTestId('school-approved-path')
    this.communityPath = page.getByTestId('community-path')
    this.communityCurrentBadge = page.getByTestId('community-current-badge')
    this.schoolApprovedCurrentBadge = page.getByTestId(
      'school-approved-current-badge'
    )
    this.chooseSchoolApprovedButton = page.getByTestId(
      'choose-school-approved-button'
    )
    this.stayCommunityButton = page.getByTestId('stay-community-button')
    this.addAdvisorButton = page.getByTestId('add-advisor-button')
    this.switchToCommunityButton = page.getByTestId(
      'switch-to-community-button'
    )
    this.advisorTitleInput = page.locator('input[name="advisor-title"]')
    this.cancelAdvisorButton = page.getByTestId('cancel-advisor-button')
  }

  async goto() {
    await this.page.goto('/groups')
    await this.page.waitForURL('**/groups/dashboard')
  }

  async schoolApprovalIsOutstanding() {
    await expect(this.schoolApprovalItem).toBeVisible()
    await expect(this.schoolApprovalCheckbox).not.toBeChecked()
  }

  async schoolApprovalIsSettled() {
    await expect(this.schoolApprovalCheckbox).toBeChecked()
  }

  async openPathChooser() {
    await this.schoolApprovalControl.click()
    await this.page.waitForURL('**/groups/settings')
    await expect(this.schoolApprovedPath).toBeVisible()
    await expect(this.communityPath).toBeVisible()
    await expect(this.chooseSchoolApprovedButton).toBeVisible()
    await expect(this.stayCommunityButton).toBeVisible()
  }

  async stayCommunity() {
    await this.stayCommunityButton.click()
    await expect(this.stayCommunityButton).toHaveCount(0)
    await expect(this.communityCurrentBadge).toBeVisible()
  }

  async chooseSchoolApproved() {
    await this.chooseSchoolApprovedButton.click()
    await expect(this.advisorTitleInput).toBeVisible()
  }

  // Waits for the chooser rather than the form's absence: an opt-out POST would
  // hide both for as long as it is in flight, and the caller reads the database
  // straight after this.
  async cancelAdvisorForm() {
    await this.cancelAdvisorButton.click()
    await expect(this.advisorTitleInput).toHaveCount(0)
    await expect(this.communityPath).toBeVisible()
  }
}
