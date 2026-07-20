class FeedPage {
  constructor(page) {
    this.page = page;

    // Post composer
    this.postInput = page.getByPlaceholder('Start a thread or share a post...');
    this.postButton = page.locator('button.button-share');
    this.imageButton = page.locator('button[title="Add Image"]');
    this.videoButton = page.locator('button[title="Add Video"]');
    this.imageFileInput = page.locator('input[name="file"]');
    this.videoFileInput = page.locator('input[name="videoFile"]');

    // Feed
    this.postsContainer = page.locator('.Posts');
    this.postCards = page.locator('.Post');
  }

  async goto() {
    await this.page.goto('/home');
  }

  async createTextPost(text) {
    await this.postInput.fill(text);
    await this.postButton.click();
  }

  async createImagePost(text, imagePath) {
    await this.postInput.fill(text);
    await this.imageFileInput.setInputFiles(imagePath);
    await this.postButton.click();
  }

  /**
   * Get the first post card matching the caption text.
   */
  getPostByCaption(caption) {
    return this.page.locator('.Post', { has: this.page.locator(`.captionText:has-text("${caption}")`) });
  }

  /**
   * Like the first post in the feed.
   */
  async likeFirstPost() {
    const likeButton = this.postCards.first().locator('button[title="Like"]');
    await likeButton.click();
  }

  /**
   * Toggle comments on a post and type a comment.
   */
  async commentOnPost(postLocator, commentText) {
    const commentToggle = postLocator.locator('button[title="Comment"]');
    await commentToggle.click();
    const commentInput = postLocator.locator('input[placeholder="Write a comment..."]');
    await commentInput.fill(commentText);
    const postBtn = postLocator.locator('button.commentButton');
    await postBtn.click();
  }

  /**
   * Delete a post (only visible if owner).
   */
  async deletePost(postLocator) {
    const deleteBtn = postLocator.locator('button[title="Delete post"]');
    // Handle the confirm dialog
    this.page.once('dialog', dialog => dialog.accept());
    await deleteBtn.click();
  }
}

module.exports = FeedPage;
