export const LOCALITIES = [
  { id: "kothrud", name: "Kothrud", lat: 18.50389, lng: 73.8075 },
  { id: "pcmc", name: "PCMC Metro", lat: 18.62932, lng: 73.80329 },
  { id: "district-court", name: "District Court Metro", lat: 18.52679, lng: 73.8569 },
  { id: "vanaz", name: "Vanaz Metro", lat: 18.50719, lng: 73.8052 },
  { id: "ramwadi", name: "Ramwadi Metro", lat: 18.55703, lng: 73.90856 },
  { id: "viman-nagar", name: "Viman Nagar", lat: 18.57039, lng: 73.91333 },
] as const;

export const CATEGORIES = {
  roads: { label: "Roads & footpaths", color: "#bd7540", types: ["Pothole", "Damaged footpath", "Broken road surface"] },
  water: { label: "Water supply", color: "#467ca1", types: ["Water leakage", "Water shortage", "Contaminated supply"] },
  drainage: { label: "Sanitation & drainage", color: "#64835f", types: ["Overflowing drain", "Blocked drain", "Uncollected waste"] },
  lighting: { label: "Street lighting", color: "#9b7b31", types: ["Broken streetlight", "Unlit stretch", "Exposed wiring"] },
} as const;
export type Category = keyof typeof CATEGORIES;
export const STATUSES = {
  reported: "Reported", assigned: "Assigned", following_up: "Following up",
  awaiting_verification: "Awaiting verification", verified: "Verified", disputed: "Disputed / reopened",
} as const;
export type IssueStatus = keyof typeof STATUSES;
export type TimelineEvent = { id: string; kind: string; title: string; description: string; source: string; createdAt: string };
export type Commitment = { id: string; action: string; dueAt: string | null; status: string; sourceCallId: string };
export type CivicIssue = {
  id: string; title: string; description: string; category: Category; issueType: string;
  localityId: string; landmark: string; lat: number; lng: number; status: IssueStatus;
  complaintCount: number; officeId: string | null; assignmentCertainty: string;
  isDemo: boolean; createdAt: string; updatedAt: string;
  events: TimelineEvent[]; commitments: Commitment[];
  evidence: { id: string; caption: string; url: string; createdAt: string }[];
  calls: { id: string; status: string; summary: string | null; createdAt: string }[];
  nextFollowUp: string | null;
};
export type Office = {
  id: string; name: string; governmentBody: string; address: string; designation: string;
  localityId: string; lat: number | null; lng: number | null; jurisdiction: string;
  categories: Category[]; source: string; verified: boolean; publishedPhone: string | null;
};
export type CivicSnapshot = { issues: CivicIssue[]; offices: Office[]; directoryMissing: string[] };
export const DATASET_FILES = ["contacts_master.csv", "contacts_by_location.csv", "contacts_by_location.json", "area_anchors.csv", "area_contact_links.csv", "issue_routing_rules.csv", "pcmc_ward_office_mapping.csv", "map_points.geojson"];
export function localityName(id: string) { return LOCALITIES.find((item) => item.id === id)?.name ?? id; }
export function formatDate(date: string | null) {
  return date ? new Date(date).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" }) : "No deadline given";
}
