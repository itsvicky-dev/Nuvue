/**
 * Utility functions for handling URLs and file paths
 */

/**
 * Converts a file path or URL to a proper Next.js Image-compatible URL
 * @param url - The original URL or file path
 * @returns A properly formatted URL
 */
export function getImageUrl(url: string | undefined | null): string {
  // Return placeholder if no URL provided
  if (!url) return '/placeholder-image.jpg';
  
  // If it's already a full URL, return as is
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  
  // Fix backslashes and ensure proper path format
  const fixedPath = url.replace(/\\/g, '/').replace(/^\/+/, '');
  
  // Get base URL from environment or use default
  const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000';
  
  return `${baseUrl}/${fixedPath}`;
}

/**
 * Gets a profile picture URL with fallback
 * @param profilePicture - The profile picture URL
 * @param username - The username for generating initials
 * @returns The profile picture URL or null if should show initials
 */
export function getProfilePictureUrl(profilePicture: string | undefined | null, username: string): string | null {
  if (!profilePicture) return null;
  return getImageUrl(profilePicture);
}

/**
 * Validates if a URL is a valid image URL
 * @param url - The URL to validate
 * @returns true if it's a valid image URL
 */
export function isValidImageUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}