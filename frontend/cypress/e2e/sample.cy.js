describe("Homepage", () => {
  it("should show the welcome dialog if not logged in", () => {
    cy.clearLocalStorage();
    cy.visit("http://localhost:8080/");
    cy.contains("Welcome to Ann").should("exist");
  });
});
