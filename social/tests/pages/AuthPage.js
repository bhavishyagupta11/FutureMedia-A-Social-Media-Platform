class AuthPage {
  constructor(page) {
    this.page = page;

    // Login Selectors
    this.loginUsernameInput = page.locator('#login-username');
    this.loginPasswordInput = page.locator('#login-password');
    this.loginSubmitButton = page.locator('button:has-text("Login")');
    this.signupLink = page.locator('a:has-text("Create account")');

    // Signup Selectors
    this.signupEmailInput = page.locator('#signup-email');
    this.signupUsernameInput = page.locator('#signup-username');
    this.signupPasswordInput = page.locator('#signup-password');
    this.signupConfirmInput = page.locator('#signup-confirm-password');
    this.signupSubmitButton = page.locator('button:has-text("Sign up")');
    this.loginLink = page.locator('a:has-text("Log in")');
  }

  async gotoLogin() {
    await this.page.goto('/');
  }

  async gotoSignup() {
    await this.page.goto('/signup');
  }

  async login(username, password) {
    await this.loginUsernameInput.fill(username);
    await this.loginPasswordInput.fill(password);
    await this.loginSubmitButton.click();
  }

  async register(email, username, password) {
    await this.signupEmailInput.fill(email);
    await this.signupUsernameInput.fill(username);
    await this.signupPasswordInput.fill(password);
    await this.signupConfirmInput.fill(password);
    await this.signupSubmitButton.click();
  }
}

module.exports = AuthPage;
