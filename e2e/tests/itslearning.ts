Feature('Itslearning integration')

Scenario('Instructors have write access', ({ I }) => {
  I.setInstructorRole()

  openSerloEditorWithLTI(I)

  I.see('Schreibe etwas')
  I.seeElement('$add-new-plugin-row-button')
  I.seeElementInDOM('#serlo-root')
})

Scenario('Learners only have read access', ({ I }) => {
  I.setLearnerRole()

  openSerloEditorWithLTI(I)

  I.dontSee('Schreibe etwas')
  I.dontSeeElement('$add-new-plugin-row-button')
  I.seeElementInDOM('#serlo-root')
})

function openSerloEditorWithLTI(I: CodeceptJS.I) {
  I.amOnPage('http://localhost:8101')
}
