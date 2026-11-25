import { expect } from '@playwright/test'

export class NTHSChapterPage {
  page

  constructor(page) {
    this.page = page
    this.schoolApprovedPath = page.getByTestId('school-approved-path')
    this.communityPath = page.getByTestId('community-path')
    this.communityCurrentBadge = page.getByTestId('community-current-badge')
    this.schoolApprovedCurrentBadge = page.getByTestId(
      'school-approved-current-badge'
    )
    this.chooseSchoolApprovedButton = page.getByTestId(
      'choose-school-approved-button'
    )
    this.addAdvisorButton = page.getByTestId('add-advisor-button')
    this.switchToCommunityButton = page.getByTestId(
      'switch-to-community-button'
    )
    this.advisorTitleInput = page.locator('input[name="advisor-title"]')
    this.cancelAdvisorButton = page.getByTestId('cancel-advisor-button')
  }

  async goto() {
    await this.page.goto('/groups/to-do')
    await this.page.waitForURL('**/groups/to-do')
  }

  async schoolApprovalIsSettled() {
    await this.page.goto('/groups/manage')
    await this.page.waitForURL('**/groups/manage')
  }

  async openPathChooser() {
    await this.page.goto('/groups/manage')
    await this.page.waitForURL('**/groups/manage')
    await expect(this.schoolApprovedPath).toBeVisible()
    await expect(this.communityPath).toBeVisible()
    await expect(this.chooseSchoolApprovedButton).toBeVisible()
    await expect(this.communityCurrentBadge).toBeVisible()
  }

  async switchToCommunity() {
    await this.switchToCommunityButton.click()
    await expect(this.switchToCommunityButton).toHaveCount(0)
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
