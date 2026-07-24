class NotificationsPage {
  constructor(page) {
    this.page = page;
    this.header = page.locator('h1:has-text("Notifications")');
    this.markAllReadButton = page.locator('button:has-text("Mark all as read")');
    this.notificationItems = page.locator('.notificationItem');
    this.emptyState = page.locator('.notificationsEmptyState');
  }

  async goto() {
    await this.page.goto('/notifications');
  }

  async markAllAsRead() {
    if (await this.markAllReadButton.isVisible()) {
      await this.markAllReadButton.click();
    }
  }

  async getNotificationCount() {
    return await this.notificationItems.count();
  }
}

module.exports = NotificationsPage;
