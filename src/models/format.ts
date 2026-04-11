/** Built-in format kinds for `Require Format:`. */
export type DateFormatId = "dd-mm-yyyy" | "dd/mm/yyyy" | "yyyy-mm-dd" | "mm-dd-yyyy";

export type RequireFormatSpec =
  | { kind: "date"; dateFormat: DateFormatId }
  | { kind: "phone"; mask: string }
  | { kind: "email" }
  | { kind: "integer" }
  | { kind: "decimal" }
  | { kind: "currency"; symbol: string }
  | { kind: "uuid" }
  | { kind: "ukPostcode" }
  | { kind: "customMask"; mask: string };
