export function formatHelpDeskTicket(idOrSeed?: string) {
  if (!idOrSeed) {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let randomPart = "";
    for (let i = 0; i < 5; i++) {
      randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `#FHGAS-HelpDesk-${randomPart}`;
  }

  // Generate deterministic 5 alphanumeric characters from the id/seed
  const clean = idOrSeed.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  const seedPart = clean.length >= 5 ? clean.slice(-5) : clean.padEnd(5, "X");
  return `#FHGAS-HelpDesk-${seedPart}`;
}

export function formatSaaNumber(formType: string, name: string, requestNumber: number, id?: string) {
  return formatHelpDeskTicket(id);
}