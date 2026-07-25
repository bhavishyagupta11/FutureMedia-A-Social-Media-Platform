class SearchPage {
  constructor(page) {
    this.page = page;
    this.searchInput = page.locator('input.search-input');
    this.resultsSection = page.locator('.search-results-section, .search-results-list').first();
    this.resultItems = page.locator('.search-result-item');
    this.recentItems = page.locator('.recent-item');
    this.trendingTags = page.locator('.tag-chip');
    this.suggestedUsers = page.locator('.suggested-user-card');
  }

  async goto() {
    await this.page.goto('/search');
  }

  async search(query) {
    await this.searchInput.fill(query);
    await this.page.waitForTimeout(600); // Debounce wait
  }

  async getResultCount() {
    return await this.resultItems.count();
  }
}

module.exports = SearchPage;
