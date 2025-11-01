// Academic Constants for University of the Assumption

export const DEPARTMENTS = [
  { code: 'CCS', name: 'College of Computer Studies', fullName: 'College of Computer Studies' },
  { code: 'COED', name: 'College of Education', fullName: 'College of Education' },
  { code: 'CBAA', name: 'College of Business, Accountancy and Administration', fullName: 'College of Business, Accountancy and Administration' },
  { code: 'CAS', name: 'College of Arts and Sciences', fullName: 'College of Arts and Sciences' },
  { code: 'CE', name: 'College of Engineering', fullName: 'College of Engineering' },
  { code: 'CAHS', name: 'College of Allied Health Sciences', fullName: 'College of Allied Health Sciences' },
  { code: 'CHM', name: 'College of Hospitality Management', fullName: 'College of Hospitality Management' },
  { code: 'CHTM', name: 'College of Hotel and Tourism Management', fullName: 'College of Hotel and Tourism Management' }
];

export const COURSES_BY_DEPARTMENT = {
  'CCS': [
    { code: 'BSIT', name: 'Bachelor of Science in Information Technology' },
    { code: 'BSCS', name: 'Bachelor of Science in Computer Science' },
    { code: 'BSCpE', name: 'Bachelor of Science in Computer Engineering' },
    { code: 'BSEMC', name: 'Bachelor of Science in Entertainment and Multimedia Computing' }
  ],
  'COED': [
    { code: 'BSED', name: 'Bachelor of Secondary Education' },
    { code: 'BEED', name: 'Bachelor of Elementary Education' },
    { code: 'BECEd', name: 'Bachelor of Early Childhood Education' },
    { code: 'BSE', name: 'Bachelor of Special Education' }
  ],
  'CBAA': [
    { code: 'BSA', name: 'Bachelor of Science in Accountancy' },
    { code: 'BSBA', name: 'Bachelor of Science in Business Administration' },
    { code: 'BSMA', name: 'Bachelor of Science in Management Accounting' },
    { code: 'BSE', name: 'Bachelor of Science in Entrepreneurship' }
  ],
  'CAS': [
    { code: 'AB-PSYCH', name: 'Bachelor of Arts in Psychology' },
    { code: 'AB-POLSCI', name: 'Bachelor of Arts in Political Science' },
    { code: 'AB-COMM', name: 'Bachelor of Arts in Communication' },
    { code: 'BS-PSYCH', name: 'Bachelor of Science in Psychology' }
  ],
  'CE': [
    { code: 'BSCE', name: 'Bachelor of Science in Civil Engineering' },
    { code: 'BSEE', name: 'Bachelor of Science in Electrical Engineering' },
    { code: 'BSME', name: 'Bachelor of Science in Mechanical Engineering' },
    { code: 'BSChE', name: 'Bachelor of Science in Chemical Engineering' }
  ],
  'CAHS': [
    { code: 'BSN', name: 'Bachelor of Science in Nursing' },
    { code: 'BSPT', name: 'Bachelor of Science in Physical Therapy' },
    { code: 'BSMT', name: 'Bachelor of Science in Medical Technology' },
    { code: 'BSPharma', name: 'Bachelor of Science in Pharmacy' }
  ],
  'CHM': [
    { code: 'BSHM', name: 'Bachelor of Science in Hospitality Management' },
    { code: 'BSHRM', name: 'Bachelor of Science in Hotel and Restaurant Management' }
  ],
  'CHTM': [
    { code: 'BSTM', name: 'Bachelor of Science in Tourism Management' },
    { code: 'BSTRM', name: 'Bachelor of Science in Travel Management' }
  ]
};

export const YEAR_LEVELS = [
  { value: 1, label: '1st Year' },
  { value: 2, label: '2nd Year' },
  { value: 3, label: '3rd Year' },
  { value: 4, label: '4th Year' },
  { value: 5, label: '5th Year' }
];

// Helper function to get department name by code
export const getDepartmentName = (code) => {
  const dept = DEPARTMENTS.find(d => d.code === code);
  return dept ? dept.name : code;
};

// Helper function to get course name by code
export const getCourseName = (departmentCode, courseCode) => {
  const courses = COURSES_BY_DEPARTMENT[departmentCode] || [];
  const course = courses.find(c => c.code === courseCode);
  return course ? course.name : courseCode;
};

// Helper function to get courses for a department
export const getCoursesByDepartment = (departmentCode) => {
  return COURSES_BY_DEPARTMENT[departmentCode] || [];
};

// Helper function to get year label
export const getYearLabel = (yearLevel) => {
  const year = YEAR_LEVELS.find(y => y.value === yearLevel);
  return year ? year.label : `${yearLevel}th Year`;
};
