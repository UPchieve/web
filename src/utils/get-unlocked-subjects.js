import { CERT_UNLOCKING, COMPUTED_CERTS } from "../consts";

const getUnlockedSubjects = userCertifications => {
  // Add all the certifications that this completed cert unlocks into a Set
  const currentSubjects = new Set();

  for (const cert in userCertifications) {
    if (userCertifications[cert].passed && CERT_UNLOCKING[cert])
      CERT_UNLOCKING[cert].forEach(subject => currentSubjects.add(subject));
  }

  for (const cert in COMPUTED_CERTS) {
    const prerequisiteCerts = COMPUTED_CERTS[cert];
    let meetsRequirements = true;

    for (let i = 0; i < prerequisiteCerts.length; i++) {
      const prereqCert = prerequisiteCerts[i];

      if (!currentSubjects.has(prereqCert)) {
        meetsRequirements = false;
        break;
      }
    }

    if (meetsRequirements) currentSubjects.add(cert);
  }

  return Array.from(currentSubjects);
};

export default getUnlockedSubjects;
