function parseVCard(vCardContent) {
  const lines = vCardContent.split("\n");
  const contactInfo = {
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
  };
// Parcours de chaque ligne du fichier vcf
  lines.forEach((line) => {
    if (line.startsWith("FN:")) {
      const fullName = line.split("FN:")[1].trim();
      const [firstName, lastName] = fullName.split(" ");
      contactInfo.firstName = firstName;
      contactInfo.lastName = lastName;
    } else if (line.startsWith("TEL;")) { 
      contactInfo.phone = line.split(":")[1].trim();
    } else if (line.startsWith("EMAIL;")) { 
      contactInfo.email = line.split(":")[1].trim();
    }
  });
  return contactInfo;
}

module.exports = { parseVCard };
