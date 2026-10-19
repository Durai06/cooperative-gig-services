// ============================================================
// CoopConnect – Rule-Based Worker Matching Service
// No AI, ML, or external AI dependencies.
// All scoring is deterministic and explainable.
// ============================================================

import { MATCHING_WEIGHTS } from "@/constants";
import type {
  Booking,
  MatchScoreBreakdown,
  Worker,
  WorkerMatch,
} from "@/types";

// ─── Haversine Distance ──────────────────────────────────────

function haversineKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ─── Individual Scorers ──────────────────────────────────────

/** Returns MATCHING_WEIGHTS.skill if worker has the skill, else 0. */
function calcSkillScore(worker: Worker, serviceId: string): number {
  const hasSkill = worker.skills.some((s) => s.serviceId === serviceId);
  return hasSkill ? MATCHING_WEIGHTS.skill : 0;
}

/** Full availability score; 0 if unavailable. */
function calcAvailabilityScore(worker: Worker): number {
  return worker.availability ? MATCHING_WEIGHTS.availability : 0;
}

/**
 * Rating score normalised 0–MATCHING_WEIGHTS.rating.
 * A 5-star worker gets the full weight; a 1-star worker gets 20% of it.
 */
function calcRatingScore(worker: Worker): number {
  if (worker.totalRatings === 0) return MATCHING_WEIGHTS.rating * 0.5; // fair default for new workers
  const normalised = (worker.rating - 1) / 4; // 0..1
  return Math.round(normalised * MATCHING_WEIGHTS.rating * 10) / 10;
}

/**
 * Experience score normalised 0–MATCHING_WEIGHTS.experience.
 * Capped at 10 years for max score.
 */
function calcExperienceScore(worker: Worker): number {
  const capped = Math.min(worker.experience, 10);
  const normalised = capped / 10;
  return Math.round(normalised * MATCHING_WEIGHTS.experience * 10) / 10;
}

/**
 * Proximity score normalised 0–MATCHING_WEIGHTS.proximity.
 * ≤1 km → full score; ≥30 km → 0.
 */
function calcProximityScore(
  worker: Worker,
  bookingLat?: number,
  bookingLon?: number,
): { score: number; distanceKm?: number } {
  if (
    bookingLat === undefined ||
    bookingLon === undefined ||
    worker.latitude === undefined ||
    worker.longitude === undefined
  ) {
    return { score: MATCHING_WEIGHTS.proximity * 0.5 }; // midpoint when coords unavailable
  }

  const km = haversineKm(
    worker.latitude,
    worker.longitude,
    bookingLat,
    bookingLon,
  );
  const MAX_KM = 30;
  const normalised = Math.max(0, 1 - km / MAX_KM);
  return {
    score: Math.round(normalised * MATCHING_WEIGHTS.proximity * 10) / 10,
    distanceKm: Math.round(km * 10) / 10,
  };
}

/**
 * Workload balance score normalised 0–MATCHING_WEIGHTS.workload.
 * A worker with 0 active jobs gets full score; ≥8 active jobs gets 0.
 */
function calcWorkloadScore(worker: Worker): number {
  const MAX_ACTIVE = 8;
  const normalised = Math.max(0, 1 - worker.activeJobs / MAX_ACTIVE);
  return Math.round(normalised * MATCHING_WEIGHTS.workload * 10) / 10;
}

// ─── Eligibility Guard ───────────────────────────────────────

export interface EligibilityResult {
  eligible: boolean;
  reason?: string;
}

export function checkEligibility(
  worker: Worker,
  serviceId: string,
): EligibilityResult {
  if (worker.verificationStatus !== "verified") {
    return { eligible: false, reason: "Worker is not verified" };
  }
  if (!worker.availability) {
    return { eligible: false, reason: "Worker is not available" };
  }
  const hasSkill = worker.skills.some((s) => s.serviceId === serviceId);
  if (!hasSkill) {
    return {
      eligible: false,
      reason: "Worker does not have the required skill",
    };
  }
  return { eligible: true };
}

// ─── Core Matching Function ──────────────────────────────────

export function matchWorkers(
  booking: Pick<Booking, "serviceId" | "latitude" | "longitude">,
  workers: Worker[],
): WorkerMatch[] {
  const results: WorkerMatch[] = [];

  for (const worker of workers) {
    const elig = checkEligibility(worker, booking.serviceId);
    if (!elig.eligible) continue;

    const skillScore = calcSkillScore(worker, booking.serviceId);
    const availabilityScore = calcAvailabilityScore(worker);
    const ratingScore = calcRatingScore(worker);
    const experienceScore = calcExperienceScore(worker);
    const { score: proximityScore, distanceKm } = calcProximityScore(
      worker,
      booking.latitude,
      booking.longitude,
    );
    const workloadScore = calcWorkloadScore(worker);

    const total = Math.min(
      100,
      Math.round(
        (skillScore +
          availabilityScore +
          ratingScore +
          experienceScore +
          proximityScore +
          workloadScore) *
          10,
      ) / 10,
    );

    const breakdown: MatchScoreBreakdown = {
      skillScore,
      availabilityScore,
      ratingScore,
      experienceScore,
      proximityScore,
      workloadScore,
      total,
    };

    results.push({ worker, score: total, breakdown, distanceKm });
  }

  // Sort: higher score first. Tiebreak: more experience, then lower workload.
  results.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (b.worker.experience !== a.worker.experience)
      return b.worker.experience - a.worker.experience;
    return a.worker.activeJobs - b.worker.activeJobs;
  });

  return results;
}

// ─── Fair Distribution Adjustment ───────────────────────────

/**
 * Applies a fairness penalty to workers with high recent workloads
 * so that opportunity is spread more equitably.
 *
 * Penalty formula:
 *   penalty = (activeJobs / MAX_ACTIVE_FOR_PENALTY) * MAX_PENALTY_POINTS
 *
 * This adjusts the final priority score without changing the raw match score.
 */
export function applyFairnessAdjustment(matches: WorkerMatch[]): WorkerMatch[] {
  const MAX_ACTIVE_FOR_PENALTY = 6;
  const MAX_PENALTY_POINTS = 8; // up to 8 points deducted for overloaded workers

  return matches
    .map((m) => {
      const penalty =
        (Math.min(m.worker.activeJobs, MAX_ACTIVE_FOR_PENALTY) /
          MAX_ACTIVE_FOR_PENALTY) *
        MAX_PENALTY_POINTS;
      const adjustedScore = Math.max(
        0,
        Math.round((m.score - penalty) * 10) / 10,
      );
      return { ...m, score: adjustedScore };
    })
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.worker.activeJobs - b.worker.activeJobs;
    });
}

// ─── Distribution Summary ────────────────────────────────────

export interface DistributionSummary {
  workerName: string;
  activeJobs: number;
  completedJobs: number;
  matchScore: number;
  priorityScore: number; // after fairness adjustment
}

export function buildDistributionSummary(
  rawMatches: WorkerMatch[],
  adjusted: WorkerMatch[],
): DistributionSummary[] {
  return adjusted.map((adj) => {
    const raw = rawMatches.find((r) => r.worker.id === adj.worker.id);
    return {
      workerName: adj.worker.user.name,
      activeJobs: adj.worker.activeJobs,
      completedJobs: adj.worker.completedJobs,
      matchScore: raw?.score ?? adj.score,
      priorityScore: adj.score,
    };
  });
}
