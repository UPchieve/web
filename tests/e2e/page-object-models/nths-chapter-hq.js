import { expect } from '@playwright/test'
import { checkboxTestId, NTHSChapterPage } from './nths-chapter.js'

export class NTHSChapterHQPage extends NTHSChapterPage {
  constructor(page) {
    super(page)
    this.inviteLink = page.getByTestId('invite-link-url')
    this.copyButton = page.getByRole('button', { name: 'Copy link' })
    this.copiedButton = page.getByRole('button', { name: 'Copied' })
    this.nameInput = page.locator('#nths-group-name')
    this.leaveTeamButton = page.getByTestId('leave-team-button')
    this.allMembersChip = page.getByTestId('roster-chip-all')
    this.rosterError = page.getByTestId('roster-error')
    this.confirmRemoveButton = page.getByTestId('confirm-remove-member')
  }

  async goHome() {
    await this.page.goto('/groups/home')
    await this.page.waitForURL('**/groups/home')
  }

  async goMembers() {
    await this.page.goto('/groups/members')
    await this.page.waitForURL('**/groups/members')
    await expect(this.allMembersChip).toBeVisible()
  }

  async goSetup() {
    await this.page.goto('/groups/setup')
    await this.page.waitForURL('**/groups/setup')
  }

  checklistCheckbox(actionName) {
    return this.page.getByTestId(checkboxTestId(actionName))
  }

  memberRow(userId) {
    return this.page.getByTestId(`roster-row-${userId}`)
  }

  memberActions(userId) {
    return this.page.getByTestId(`member-actions-${userId}`)
  }

  /** The number inside the "All members (N)" chip. */
  async allMembersCount() {
    const label = await this.allMembersChip.textContent()
    return Number(label.match(/\((\d+)\)/)[1])
  }

  async openMemberMenu(userId) {
    await this.memberActions(userId).click()
    await expect(this.memberActions(userId)).toHaveAttribute(
      'aria-expanded',
      'true'
    )
  }
}
