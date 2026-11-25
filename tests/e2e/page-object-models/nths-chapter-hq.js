import { expect } from '@playwright/test'
import { NTHSChapterPage } from './nths-chapter.js'

export class NTHSChapterHQPage extends NTHSChapterPage {
  constructor(page) {
    super(page)
    this.copyButton = page.getByTestId('right-now-copy')
    this.copiedButton = page.getByRole('button', { name: 'Copied' })
    this.nameInput = page.getByTestId('name-input')
    this.leaveTeamButton = page.getByTestId('leave-team-button')
    this.allMembersChip = page.getByTestId('members-table-chip-everyone')
    this.rosterError = page.getByTestId('roster-error')
    this.confirmRemoveButton = page.getByTestId('confirm-remove-member')
  }

  async goHome() {
    await this.page.goto('/groups/home')
    await this.page.waitForURL('**/groups/home')
  }

  async goManage() {
    await this.page.goto('/groups/manage')
    await this.page.waitForURL('**/groups/manage')
    await expect(this.allMembersChip).toBeVisible()
  }

  checklistCheckbox(itemName) {
    return this.page.getByRole('checkbox', { name: itemName })
  }

  memberRow(userId) {
    return this.page
      .getByTestId('members-table-row')
      .filter({ has: this.memberActions(userId) })
  }

  memberActions(userId) {
    return this.page.getByTestId(`member-actions-${userId}`)
  }

  /** The number inside the "Everyone (N)" chip. */
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
