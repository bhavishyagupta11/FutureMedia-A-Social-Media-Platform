class ProfilePage {
  constructor(page) {
    this.page = page;

    // View Selectors
    this.editProfileButton = page.locator('button:has-text("Edit profile")');
    this.displayNameText = page.locator('.profileDisplayName');
    this.bioText = page.locator('.profileBio');
    this.websiteLink = page.locator('.profileWebsite');

    // Edit Selectors
    this.displayNameInput = page.getByPlaceholder('Your full name');
    this.bioInput = page.getByPlaceholder('Tell people about yourself...');
    this.websiteInput = page.getByPlaceholder('https://yoursite.com');
    this.avatarInput = page.locator('input[type="file"]');
    this.saveButton = page.locator('button.saveBtn');
    this.cancelButton = page.locator('button.cancelBtn');
  }

  async goto(userId) {
    if (userId) {
      await this.page.goto(`/profile/${userId}`);
    } else {
      await this.page.goto('/profile');
    }
  }

  async clickEditProfile() {
    await this.editProfileButton.click();
  }

  async updateProfile({ displayName, bio, website, avatarPath }) {
    if (displayName !== undefined) {
      await this.displayNameInput.fill(displayName);
    }
    if (bio !== undefined) {
      await this.bioInput.fill(bio);
    }
    if (website !== undefined) {
      await this.websiteInput.fill(website);
    }
    if (avatarPath) {
      await this.avatarInput.setInputFiles(avatarPath);
    }
    await this.saveButton.click();
  }
}

module.exports = ProfilePage;
