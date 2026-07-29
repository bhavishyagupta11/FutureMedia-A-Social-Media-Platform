class NavigationPage {
  constructor(page) {
    this.page = page;
    this.homeLink = page.locator('a.nav-item[href="/home"]');
    this.exploreLink = page.locator('a.nav-item[href="/explore"]');
    this.searchLink = page.locator('a.nav-item[href="/search"]');
    this.notificationsLink = page.locator('a.nav-item[href="/notifications"]');
    this.settingsLink = page.locator('a.nav-item[href="/settings"]');
    this.logoutButton = page.locator('.logout-btn');
  }

  async navigateTo(path) {
    await this.page.locator(`a.nav-item[href="${path}"]`).click();
  }

  async logout() {
    await this.logoutButton.click();
  }
}

module.exports = NavigationPage;
