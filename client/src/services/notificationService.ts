class NotificationService {
  private audio: HTMLAudioElement | null = null;
  private permission: NotificationPermission = 'default';
  private inAppNotificationCallback: ((data: any) => void) | null = null;

  constructor() {
    this.initializeAudio();
    this.requestPermission();
  }

  // Method to set the in-app notification callback
  setInAppNotificationCallback(callback: (data: any) => void) {
    this.inAppNotificationCallback = callback;
  }

  private initializeAudio() {
    if (typeof window !== 'undefined') {
      // Create a simple notification sound using Web Audio API
      this.createNotificationSound();
    }
  }

  private createNotificationSound() {
    // Create a simple beep sound using Web Audio API
    if (typeof window !== 'undefined' && 'AudioContext' in window) {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      this.playBeepSound = () => {
        try {
          const oscillator = audioContext.createOscillator();
          const gainNode = audioContext.createGain();
          
          oscillator.connect(gainNode);
          gainNode.connect(audioContext.destination);
          
          oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
          oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
          
          gainNode.gain.setValueAtTime(0, audioContext.currentTime);
          gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.01);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
          
          oscillator.start(audioContext.currentTime);
          oscillator.stop(audioContext.currentTime + 0.3);
        } catch (error) {
          console.log('Could not create notification sound:', error);
        }
      };
    }
  }

  private playBeepSound: (() => void) | null = null;

  async requestPermission(): Promise<NotificationPermission> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      console.log('Browser does not support notifications');
      return 'denied';
    }

    if (Notification.permission === 'granted') {
      this.permission = 'granted';
      return 'granted';
    }

    if (Notification.permission === 'denied') {
      this.permission = 'denied';
      return 'denied';
    }

    // Request permission
    const permission = await Notification.requestPermission();
    this.permission = permission;
    return permission;
  }

  private playNotificationSound() {
    // Check if sound is enabled in settings
    const soundEnabled = localStorage.getItem('notificationSound') !== 'false';
    
    if (soundEnabled && this.playBeepSound) {
      try {
        this.playBeepSound();
      } catch (error) {
        console.log('Error playing notification sound:', error);
      }
    }
  }

  private getNotificationIcon(type: string): string {
    const baseUrl = window.location.origin;
    switch (type) {
      case 'like':
        return `${baseUrl}/icons/heart-notification.svg`;
      case 'comment':
        return `${baseUrl}/icons/comment-notification.svg`;
      case 'follow':
      case 'follow_request':
        return `${baseUrl}/icons/follow-notification.svg`;
      case 'mention':
        return `${baseUrl}/icons/default-notification.svg`;
      default:
        return `${baseUrl}/icons/default-notification.svg`;
    }
  }

  private getNotificationTitle(type: string): string {
    switch (type) {
      case 'like':
        return 'New Like';
      case 'comment':
        return 'New Comment';
      case 'follow':
        return 'New Follower';
      case 'follow_request':
        return 'Follow Request';
      case 'follow_accept':
        return 'Follow Request Accepted';
      case 'mention':
        return 'You were mentioned';
      default:
        return 'New Notification';
    }
  }

  showNotification(data: {
    type: string;
    message: string;
    username?: string;
    avatar?: string;
    postImage?: string;
  }) {
    // Always play sound regardless of permission
    this.playNotificationSound();

    // Check if we have permission for browser notifications
    if (this.permission !== 'granted') {
      console.log('Notification permission not granted, showing in-app notification');
      // Show in-app notification instead
      if (this.inAppNotificationCallback) {
        this.inAppNotificationCallback(data);
      }
      return;
    }

    // Don't show browser notification if the tab is active, show in-app instead
    if (!document.hidden) {
      if (this.inAppNotificationCallback) {
        this.inAppNotificationCallback(data);
      }
      return;
    }

    const title = this.getNotificationTitle(data.type);
    const options: NotificationOptions = {
      body: data.message,
      icon: data.avatar || this.getNotificationIcon(data.type),
      badge: '/icons/app-badge.svg',
      tag: `${data.type}-${data.username}`, // Prevent duplicate notifications
      requireInteraction: false,
      silent: true, // We handle sound ourselves
      timestamp: Date.now(),
    };

    // Add image for post-related notifications
    if (data.postImage && (data.type === 'like' || data.type === 'comment')) {
      options.image = data.postImage;
    }

    try {
      const notification = new Notification(title, options);

      // Auto close after 5 seconds
      setTimeout(() => {
        notification.close();
      }, 5000);

      // Handle click - focus the window and navigate to notifications
      notification.onclick = () => {
        window.focus();
        // Navigate to notifications page
        if (window.location.pathname !== '/notifications') {
          window.location.href = '/notifications';
        }
        notification.close();
      };

      // Handle error
      notification.onerror = (error) => {
        console.error('Notification error:', error);
      };

    } catch (error) {
      console.error('Failed to show notification:', error);
    }
  }

  // Method to test notification
  testNotification() {
    this.showNotification({
      type: 'like',
      message: 'This is a test notification with sound!',
      username: 'test_user'
    });
  }

  // Method to check if notifications are supported
  isSupported(): boolean {
    return typeof window !== 'undefined' && 'Notification' in window;
  }

  // Method to get current permission status
  getPermission(): NotificationPermission {
    return this.permission;
  }
}

// Create singleton instance
const notificationService = new NotificationService();

export default notificationService;