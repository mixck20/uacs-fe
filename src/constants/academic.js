// Academic Constants for University of the Assumption

// Course-to-Department mapping (auto-populates department from course selection)
export const COURSE_TO_DEPARTMENT = {
  // College of Accountancy
  'BSA': 'College of Accountancy',
  'BSMA': 'College of Accountancy',
  
  // College of Hospitality and Tourism Management
  'BSHM': 'College of Hospitality and Tourism Management',
  'BSTM': 'College of Hospitality and Tourism Management',
  
  // School of Business and Public Administration
  'BSBA': 'School of Business and Public Administration',
  'BSE': 'School of Business and Public Administration',
  'BSPA': 'School of Business and Public Administration',
  
  // School of Education
  'BSED': 'School of Education',
  'BEED': 'School of Education',
  'BECEd': 'School of Education',
  
  // College of Nursing and Pharmacy
  'BSN': 'College of Nursing and Pharmacy',
  'BSPharma': 'College of Nursing and Pharmacy',
  
  // School of Arts and Sciences
  'AB-PSYCH': 'School of Arts and Sciences',
  'AB-POLSCI': 'School of Arts and Sciences',
  'AB-COMM': 'School of Arts and Sciences',
  'BS-PSYCH': 'School of Arts and Sciences',
  'BS-BIO': 'School of Arts and Sciences',
  
  // College of Engineering and Architecture
  'BSCE': 'College of Engineering and Architecture',
  'BSEE': 'College of Engineering and Architecture',
  'BSME': 'College of Engineering and Architecture',
  'BSArch': 'College of Engineering and Architecture',
  
  // College of Information Technology
  'BSIT': 'College of Information Technology',
  'BSCS': 'College of Information Technology',
  'BSCpE': 'College of Information Technology',
  
  // Institute of Theology and Religious Studies
  'BTh': 'Institute of Theology and Religious Studies',
  'AB-Theo': 'Institute of Theology and Religious Studies'
};

// All available courses (flat list - no department selection needed)
export const COURSES = [
  // College of Accountancy
  { code: 'BSA', name: 'Bachelor of Science in Accountancy' },
  { code: 'BSMA', name: 'Bachelor of Science in Management Accounting' },
  
  // College of Hospitality and Tourism Management
  { code: 'BSHM', name: 'Bachelor of Science in Hospitality Management' },
  { code: 'BSTM', name: 'Bachelor of Science in Tourism Management' },
  
  // School of Business and Public Administration
  { code: 'BSBA', name: 'Bachelor of Science in Business Administration' },
  { code: 'BSE', name: 'Bachelor of Science in Entrepreneurship' },
  { code: 'BSPA', name: 'Bachelor of Science in Public Administration' },
  
  // School of Education
  { code: 'BSED', name: 'Bachelor of Secondary Education' },
  { code: 'BEED', name: 'Bachelor of Elementary Education' },
  { code: 'BECEd', name: 'Bachelor of Early Childhood Education' },
  
  // College of Nursing and Pharmacy
  { code: 'BSN', name: 'Bachelor of Science in Nursing' },
  { code: 'BSPharma', name: 'Bachelor of Science in Pharmacy' },
  
  // School of Arts and Sciences
  { code: 'AB-PSYCH', name: 'Bachelor of Arts in Psychology' },
  { code: 'AB-POLSCI', name: 'Bachelor of Arts in Political Science' },
  { code: 'AB-COMM', name: 'Bachelor of Arts in Communication' },
  { code: 'BS-PSYCH', name: 'Bachelor of Science in Psychology' },
  { code: 'BS-BIO', name: 'Bachelor of Science in Biology' },
  
  // College of Engineering and Architecture
  { code: 'BSCE', name: 'Bachelor of Science in Civil Engineering' },
  { code: 'BSEE', name: 'Bachelor of Science in Electrical Engineering' },
  { code: 'BSME', name: 'Bachelor of Science in Mechanical Engineering' },
  { code: 'BSArch', name: 'Bachelor of Science in Architecture' },
  
  // College of Information Technology
  { code: 'BSIT', name: 'Bachelor of Science in Information Technology' },
  { code: 'BSCS', name: 'Bachelor of Science in Computer Science' },
  { code: 'BSCpE', name: 'Bachelor of Science in Computer Engineering' },
  
  // Institute of Theology and Religious Studies
  { code: 'BTh', name: 'Bachelor of Theology' },
  { code: 'AB-Theo', name: 'Bachelor of Arts in Theology' }
];

export const YEAR_LEVELS = [
  { value: 1, label: '1st Year' },
  { value: 2, label: '2nd Year' },
  { value: 3, label: '3rd Year' },
  { value: 4, label: '4th Year' },
  { value: 5, label: '5th Year' }
];

// Helper function to get department from course code
export const getDepartmentFromCourse = (courseCode) => {
  return COURSE_TO_DEPARTMENT[courseCode] || null;
};

// Helper function to get course name by code
export const getCourseName = (courseCode) => {
  const course = COURSES.find(c => c.code === courseCode);
  return course ? course.name : courseCode;
};

// Helper function to get year label
export const getYearLabel = (yearLevel) => {
  const year = YEAR_LEVELS.find(y => y.value === yearLevel);
  return year ? year.label : `${yearLevel}th Year`;
};
