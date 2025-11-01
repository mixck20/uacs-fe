import { getYearLabel } from '../constants/academic';

/**
 * Format course, year level, and section into a display string
 * @param {string} course - Course code (e.g., "BSIT")
 * @param {number} yearLevel - Year level (1-5)
 * @param {string} section - Section (optional, e.g., "A", "B", "1")
 * @returns {string} Formatted string (e.g., "BSIT 3A" or "BSIT 3rd Year")
 */
export const formatCourseYearSection = (course, yearLevel, section) => {
  if (!course || !yearLevel) return 'N/A';
  
  // If section provided, use compact format
  if (section) {
    return `${course} ${yearLevel}${section}`;
  }
  
  // Otherwise use full format
  return `${course} ${getYearLabel(yearLevel)}`;
};

/**
 * Format full academic info
 * @param {Object} academicInfo - Academic information object
 * @param {string} academicInfo.department - Department code
 * @param {string} academicInfo.course - Course code
 * @param {number} academicInfo.yearLevel - Year level
 * @param {string} academicInfo.section - Section (optional)
 * @returns {string} Formatted string
 */
export const formatFullAcademicInfo = ({ department, course, yearLevel, section }) => {
  if (!course || !yearLevel) return 'N/A';
  return formatCourseYearSection(course, yearLevel, section);
};

/**
 * Parse old courseYear format to structured data
 * Examples: "BSIT 3rd Year", "BSIT 3A", "BSCS 4th Year"
 * @param {string} courseYear - Old format string
 * @returns {Object} Structured data { course, yearLevel, section }
 */
export const parseCourseYear = (courseYear) => {
  if (!courseYear) return { course: null, yearLevel: null, section: null };
  
  const parts = courseYear.trim().split(' ');
  const course = parts[0];
  
  // Check for compact format (e.g., "BSIT 3A")
  const compactMatch = parts[1]?.match(/^(\d)([A-Z])$/);
  if (compactMatch) {
    return {
      course,
      yearLevel: parseInt(compactMatch[1]),
      section: compactMatch[2]
    };
  }
  
  // Check for full format (e.g., "BSIT 3rd Year")
  const yearMatch = parts[1]?.match(/^(\d)(st|nd|rd|th)?$/);
  if (yearMatch) {
    return {
      course,
      yearLevel: parseInt(yearMatch[1]),
      section: null
    };
  }
  
  return { course, yearLevel: null, section: null };
};
