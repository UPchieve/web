export class TrainingCourse {

  constructor(page) {
    this.page = page
    this.baseUrl = '/training/course/'
  }

  async goTo(courseKey) {
    await this.page.goto(this.baseUrl + courseKey)
    await this.page.waitForURL('**' + this.baseUrl + courseKey)
  }

  async completeCourse() {
    const modules = await this.getModules()

    for (const mod of modules) {
      await mod.click()

      const materials = await this.getModuleMaterials(mod)
      for (const material of materials) {
        await material.click()

        const button = await this.getMaterialCompletedButton(material)
        await button.click()
      }
    }
  }

  async getModules() {
    return this.page.getByTestId('training-module').all()
  }

  async getModuleMaterials(mod) {
    return mod.getByTestId('training-material').all()
  }

  async getMaterialCompletedButton(material) {
    return material.getByTestId('btn-mark-training-completed')
  }

  async goToQuiz() {
    const quizLink = this.page.getByTestId('quiz-link')
    await quizLink.click()
    await this.page.waitForURL('**/quiz')
  }
}
