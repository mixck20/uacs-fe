/**
 * Input sanitization utilities
 */

/**
 * Sanitize text input by removing potentially dangerous characters
 * @param {string} input - The input to sanitize
 * @param {number} maxLength - Maximum allowed length
 * @returns {string} Sanitized input
 */
export const sanitizeText = (input, maxLength = 500) => {
  if (!input || typeof input !== 'string') return '';
  
  return input
    .replace(/[<>]/g, '') // Remove HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, '') // Remove event handlers like onclick=
    .trim()
    .slice(0, maxLength);
};

/**
 * Sanitize email input
 * @param {string} email - Email to sanitize
 * @returns {string} Sanitized email
 */
export const sanitizeEmail = (email) => {
  if (!email || typeof email !== 'string') return '';
  
  return email
    .toLowerCase()
    .trim()
    .slice(0, 254); // RFC 5321
};

/**
 * Sanitize phone number
 * @param {string} phone - Phone number to sanitize
 * @returns {string} Sanitized phone
 */
export const sanitizePhone = (phone) => {
  if (!phone || typeof phone !== 'string') return '';
  
  return phone
    .replace(/[^\d\s\-\+\(\)]/g, '') // Keep only digits and phone formatting chars
    .trim()
    .slice(0, 20);
};

/**
 * Sanitize form data object
 * @param {Object} formData - Form data to sanitize
 * @returns {Object} Sanitized form data
 */
export const sanitizeFormData = (formData) => {
  const sanitized = {};
  
  for (const [key, value] of Object.entries(formData)) {
    if (typeof value === 'string') {
      if (key.toLowerCase().includes('email')) {
        sanitized[key] = sanitizeEmail(value);
      } else if (key.toLowerCase().includes('phone')) {
        sanitized[key] = sanitizePhone(value);
      } else {
        sanitized[key] = sanitizeText(value);
      }
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
};

/**
 * Validate file upload
 * @param {File} file - File to validate
 * @param {Object} options - Validation options
 * @returns {Object} { valid: boolean, error: string }
 */
export const validateFileUpload = (file, options = {}) => {
  const {
    maxSize = 5 * 1024 * 1024, // 5MB default
    allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'],
    allowedExtensions = ['.jpg', '.jpeg', '.png', '.pdf']
  } = options;

  if (!file) {
    return { valid: false, error: 'No file provided' };
  }

  // Check file size
  if (file.size > maxSize) {
    return { 
      valid: false, 
      error: `File size must be less than ${Math.round(maxSize / 1024 / 1024)}MB` 
    };
  }

  // Check file type
  if (!allowedTypes.includes(file.type)) {
    return { 
      valid: false, 
      error: `File type must be one of: ${allowedTypes.join(', ')}` 
    };
  }

  // Check file extension
  const extension = '.' + file.name.split('.').pop().toLowerCase();
  if (!allowedExtensions.includes(extension)) {
    return { 
      valid: false, 
      error: `File extension must be one of: ${allowedExtensions.join(', ')}` 
    };
  }

  return { valid: true, error: null };
};
