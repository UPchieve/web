import {
  MATH_SUBJECTS,
  MATH_CERTS,
  SCIENCE_SUBJECTS,
  COLLEGE_SUBJECTS,
  SAT_SUBJECTS,
  TRAINING,
  SUBJECT_TYPES
} from "../consts";

const getSubjectType = subject => {
  let type = "";

  if (Object.values(MATH_SUBJECTS).includes(subject)) type = SUBJECT_TYPES.MATH;
  if (Object.values(MATH_CERTS).includes(subject)) type = SUBJECT_TYPES.MATH;
  if (Object.values(SCIENCE_SUBJECTS).includes(subject))
    type = SUBJECT_TYPES.SCIENCE;
  if (Object.values(COLLEGE_SUBJECTS).includes(subject))
    type = SUBJECT_TYPES.COLLEGE;
  if (Object.values(SAT_SUBJECTS).includes(subject)) type = SUBJECT_TYPES.SAT;
  if (Object.values(TRAINING).includes(subject)) type = SUBJECT_TYPES.TRAINING;

  return type;
};

export default getSubjectType;
