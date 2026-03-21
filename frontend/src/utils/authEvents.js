// Global auth event system for handling authentication failures
// This allows API interceptors to trigger login modals without direct imports

class AuthEventEmitter {
  constructor() {
    this.eventTarget = new EventTarget();
  }

  // Trigger login modal
  triggerLogin(redirectPath = null) {
    const event = new CustomEvent('auth:login-required', {
      detail: { redirectPath }
    });
    this.eventTarget.dispatchEvent(event);
  }

  // Listen for login events
  onLoginRequired(callback) {
    this.eventTarget.addEventListener('auth:login-required', callback);
  }

  // Remove listener
  removeLoginListener(callback) {
    this.eventTarget.removeEventListener('auth:login-required', callback);
  }
}

export const authEvents = new AuthEventEmitter();
