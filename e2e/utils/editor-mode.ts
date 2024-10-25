export function expectEditorModeWrite(I: CodeceptJS.I) {
  I.see('Schreibe etwas')
  I.seeElement('$add-new-plugin-row-button')
  I.seeElementInDOM('#serlo-root')
}

export function expectEditorModeRead(I: CodeceptJS.I) {
  I.dontSee('Schreibe etwas')
  I.dontSeeElement('$add-new-plugin-row-button')
  I.seeElementInDOM('#serlo-root')
}
