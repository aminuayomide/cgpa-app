// ----- CONFIG -----
export const G_MAX = 5.0;

export const GRADE_MAP = {
  A: 5.0,
  B: 4.0,
  C: 3.0,
  D: 2.0,
  E: 1.0,
  F: 0.0
};

// ----- CLASSIFICATION -----
export function getClassification(cgpa) {
  if (cgpa >= 4.5) return "First Class Honours (1)";
  if (cgpa >= 3.5) return "Second Class Honours (Upper Division) (2:1)";
  if (cgpa >= 2.4) return "Second Class Honours (Lower Division) (2:2)";
  if (cgpa >= 1.5) return "Third Class Honours (3)";
  return "Fail / No Award";
}

// ----- GPA -----
export function calculateGPA(courses) {
  let totalCredits = 0;
  let totalPoints = 0;

  courses.forEach(course => {
    const credits = Number(course.credits) || 0;
    const gradePoint = GRADE_MAP[course.grade] ?? 0;

    if (credits > 0) {
      totalCredits += credits;
      totalPoints += credits * gradePoint;
    }
  });

  return {
    totalCredits,
    totalPoints,
    gpa: totalCredits ? totalPoints / totalCredits : 0
  };
}

// ----- CGPA -----
export function calculateCGPA(prevCgpa, prevCredits, gpaMetrics) {
  const prevPoints = prevCgpa * prevCredits;

  const overallCredits = prevCredits + gpaMetrics.totalCredits;
  const overallPoints = prevPoints + gpaMetrics.totalPoints;

  return {
    cgpa: overallCredits ? overallPoints / overallCredits : 0,
    overallCredits
  };
}

// ----- MAX CGPA -----
export function calculateCGPAmax(currentCgpa, usedCredits, totalCredits) {
  if (totalCredits <= 0 || usedCredits > totalCredits) return null;

  return G_MAX - (usedCredits / totalCredits) * (G_MAX - currentCgpa);
}
