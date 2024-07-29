import { expect } from '@playwright/test'

export class VolunteerDashboard {
  page

  constructor(page) {
    this.page = page
    this.mobileMenu = page.getByTestId('mobile-header-hamburger')

    // Volunteer onboarding
    // Upchieve 101
    this.trainingLink = page.getByText('Training')

    // Safety screening
    this.safetyScreening = page.getByTestId('safety-screening')
    this.backgroundInformationAccountAction = page.getByTestId(
      'Background information'
    )
    this.proofOfIdentityAccountAction = page.getByTestId('Proof of identity')
    this.photoUploadModal = page.getByTestId('photo-upload-modal')
    this.photoUploadButton = page.getByTestId('upload-photo-btn')
    this.removePhotoButton = page.getByTestId('remove-photo-btn')
    this.submitPhotoButton = page.getByTestId('submit-photo-btn')
    this.fileInput = page.getByTestId('photo-upload-file-input')
    this.uploadedPhoto = page.getByTestId('uploaded-photo')
  }

  get isMobile() {
    return this.page.viewportSize().width < 767
  }

  async joinSessionFor(firstName) {
    await expect(
      this.page.getByTestId(`session-row-${firstName}`),
      'the new student session should show up for the volunteer'
    ).toBeVisible()
    await this.page.getByTestId(`session-row-${firstName}`).click()
    await this.page.waitForURL('**/session/**')
  }

  async goToTraining() {
    if (this.isMobile) {
      await this.mobileMenu.click()
    }

    await this.trainingLink.click()
  }

  async safetyScreeningIsReady() {
    await expect(this.safetyScreening).toBeVisible()
    await expect(this.backgroundInformationAccountAction).toBeVisible()
    await expect(this.proofOfIdentityAccountAction).toBeVisible()
  }

  async goToBackgroundInformation() {
    await this.backgroundInformationAccountAction.click()
    await this.page.waitForURL('**/background-information')

    return this.page
  }

  async openProofOfIdentityModal() {
    await this.proofOfIdentityAccountAction.click()
    await expect(this.photoUploadModal).toBeVisible()
    await expect(this.submitPhotoButton).toBeVisible()
    await expect(this.submitPhotoButton).not.toBeEnabled()
    await expect(this.photoUploadButton).toBeVisible()
    await expect(this.photoUploadButton).toBeEnabled()
    await expect(this.removePhotoButton).not.toBeVisible()
  }

  async selectPhoto(fileName) {
    await this.fileInput.setInputFiles([fileName])
    await expect(this.uploadedPhoto).toBeVisible()
    await expect(this.removePhotoButton).toBeVisible()
  }

  async submitPhoto() {
    // Press the submit button
    await this.submitPhotoButton.click()
    await expect(this.photoUploadModal).not.toBeVisible()
    await this.photoUploadIsComplete()
    await this.closePhotoUploadModal()
  }


  async removePhoto() {
    await expect(this.uploadedPhoto).toBeVisible()
    await this.removePhotoButton.click()
    await expect(this.uploadedPhoto).not.toBeVisible()
    await expect(this.submitPhotoButton).not.toBeEnabled()
    await expect(this.removePhotoButton).not.toBeVisible()
  }

  async photoUploadIsComplete() {
    await expect(this.proofOfIdentityAccountAction).toContainText('Waiting for review (1-2 business days)')
    await this.proofOfIdentityAccountAction.click()
    await expect(this.page.getByTestId('photo-submitted-content')).toBeVisible()
  }

  async closePhotoUploadModal() {
    await this.page.getByTestId('close-modal-btn').click()
    await expect(this.photoUploadModal).not.toBeVisible()
  }
}
