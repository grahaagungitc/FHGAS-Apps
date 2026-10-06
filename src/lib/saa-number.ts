export function formatSaaNumber(formType: string, name: string, requestNumber: number) {
  const formatPart = (value: string) =>
    value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .toUpperCase();

  return `SAA - ${formatPart(formType)} - ${formatPart(name)} - ${String(requestNumber).padStart(4, "0")}`;
}