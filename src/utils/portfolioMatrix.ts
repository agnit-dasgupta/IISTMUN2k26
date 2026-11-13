/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { COUNTRY_MATRIX } from "../data";
import { CountryMatrixRow, PortfolioStatus, CommitteeId } from "../types";

export type PortfolioStateMap = Record<string, Partial<Record<string, PortfolioStatus>>>;

/**
 * Normalizes string for robust lookup
 */
function cleanKey(name: string): string {
  return (name || "").toLowerCase().trim();
}

/**
 * Computes the effective status for a portfolio in a given committee
 * using live portfolio_states overrides merged onto the COUNTRY_MATRIX baseline.
 */
export function getEffectivePortfolioStatus(
  countryName: string,
  committeeId: string,
  portfolioOverrides: PortfolioStateMap = {},
  matrixRows: CountryMatrixRow[] = COUNTRY_MATRIX
): PortfolioStatus {
  if (!countryName || !committeeId) return "N/A";

  // IP Journalism and IP Photojournalism are always N/A for country delegations
  if (committeeId === "ip_journalism" || committeeId === "ip_photojournalism") {
    const directOverride = portfolioOverrides[countryName]?.[committeeId];
    if (directOverride) return directOverride;
    return "N/A";
  }

  // 1. Direct match in portfolio_states overrides
  const directOverride = portfolioOverrides[countryName]?.[committeeId];
  if (directOverride) return directOverride;

  // 2. Case-insensitive lookup in overrides
  const cleanedCountry = cleanKey(countryName);
  for (const [key, val] of Object.entries(portfolioOverrides)) {
    if (cleanKey(key) === cleanedCountry) {
      if (val[committeeId]) return val[committeeId]!;
    }
  }

  // 3. Fallback to matrix baseline row
  const row = matrixRows.find(r => cleanKey(r.country) === cleanedCountry);
  if (row) {
    const status = (row as any)[committeeId] as PortfolioStatus | undefined;
    if (status) return status;
  }

  return "N/A";
}

/**
 * Retrieves ONLY portfolios that are currently marked as "Available" by the admin
 * for a specific committee.
 * 
 * Portfolios with status "Assigned", "Reserved", "Pending", or "N/A" are excluded.
 */
export function getAvailablePortfoliosForCommittee(
  committeeId: string,
  portfolioOverrides: PortfolioStateMap = {},
  matrixRows: CountryMatrixRow[] = COUNTRY_MATRIX
): string[] {
  if (!committeeId) return [];

  // Special handling for International Press (IP): Portfolios are always N/A
  if (committeeId === "ip_journalism" || committeeId === "ip_photojournalism") {
    return ["N/A"];
  }

  // Filter matrix rows where effective status is "Available"
  const availableList: string[] = [];
  const seen = new Set<string>();

  for (const row of matrixRows) {
    if (!row.country || seen.has(row.country)) continue;
    const status = getEffectivePortfolioStatus(row.country, committeeId, portfolioOverrides, matrixRows);
    if (status === "Available") {
      availableList.push(row.country);
      seen.add(row.country);
    }
  }

  return availableList;
}

/**
 * Computes portfolio distribution statistics (Total, Available, Assigned/Allotted, Reserved)
 */
export function calculateMatrixStats(
  portfolioOverrides: PortfolioStateMap = {},
  matrixRows: CountryMatrixRow[] = COUNTRY_MATRIX
) {
  const committees: CommitteeId[] = ["uncopuos", "unhrc", "unodc", "nes75", "undp", "ip_journalism", "ip_photojournalism", "unga"];
  
  let totalSeats = 0;
  let available = 0;
  let assigned = 0;
  let reserved = 0;
  let pending = 0;

  for (const row of matrixRows) {
    for (const comm of committees) {
      const status = getEffectivePortfolioStatus(row.country, comm, portfolioOverrides, matrixRows);
      if (status !== "N/A") {
        totalSeats++;
        if (status === "Available") available++;
        else if (status === "Assigned") assigned++;
        else if (status === "Reserved") reserved++;
        else if (status === "Pending") pending++;
      }
    }
  }

  return {
    totalRows: matrixRows.length,
    totalSeats,
    available,
    assigned,
    reserved,
    pending
  };
}

