import { randomBytes } from "node:crypto";
import { DomainError, type Scenario } from "./domain.js";

export interface AuthorizationResult {
  approved: boolean;
  mode: "simulated";
  authorizationCode?: string;
}

export function authorizePayment(scenario: Scenario): AuthorizationResult {
  if ((process.env.PAYMENT_MODE || "simulated") !== "simulated") {
    throw new DomainError(
      "PAYMENT_MODE_UNAVAILABLE",
      "Only the clearly labeled simulator is configured. Add an approved Visa sandbox client before changing payment mode.",
    );
  }

  // ponytail: the simulator is the safe demo boundary; replace this one function when an exact Visa sandbox product and credentials are selected.
  return scenario === "auth-decline"
    ? { approved: false, mode: "simulated" }
    : { approved: true, mode: "simulated", authorizationCode: `SIM-${randomBytes(3).toString("hex").toUpperCase()}` };
}
