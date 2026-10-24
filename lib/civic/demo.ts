import { DATASET_FILES, LOCALITIES, type Category, type CivicSnapshot } from "./model";

const examples: { title: string; category: Category; issueType: string; landmark: string; description: string }[] = [
  { title: "A rough stretch on the way home", category: "roads", issueType: "Pothole", landmark: "Near Kothrud locality anchor", description: "Fictional demo: a damaged road surface makes the evening commute difficult. Residents are collecting reports about this shared problem." },
  { title: "Water leaking onto the footpath", category: "water", issueType: "Water leakage", landmark: "Near PCMC Metro anchor", description: "Fictional demo: a leaking water line leaves standing water along the walking route." },
  { title: "A drain that needs attention", category: "drainage", issueType: "Blocked drain", landmark: "Near District Court Metro anchor", description: "Fictional demo: a blocked drain causes water to collect beside a pedestrian crossing." },
  { title: "One pothole. A shared concern.", category: "roads", issueType: "Pothole", landmark: "Near Vanaz Metro anchor", description: "Fictional demo: a pothole near the station affects residents and commuters. Add a report to this shared case so the community can follow it through together." },
  { title: "A dark walk from the station", category: "lighting", issueType: "Broken streetlight", landmark: "Near Ramwadi Metro anchor", description: "Fictional demo: a streetlight is not working along a route used after sunset." },
  { title: "Drainage overflowing after rain", category: "drainage", issueType: "Overflowing drain", landmark: "Near Viman Nagar locality anchor", description: "Fictional demo: water is overflowing from a drain and affecting access to nearby homes." },
];
export function demoSnapshot(): CivicSnapshot {
  return {
    offices: [], directoryMissing: DATASET_FILES,
    issues: examples.map((example, i) => {
      const location = LOCALITIES[i];
      const createdAt = new Date(Date.now() - (i + 1) * 86400000).toISOString();
      return {
        ...example, id: `demo-${location.id}`, localityId: location.id, lat: location.lat, lng: location.lng,
        status: "reported", complaintCount: i === 3 ? 3 : 1, officeId: null, assignmentCertainty: "unassigned",
        isDemo: true, createdAt, updatedAt: createdAt, commitments: [], evidence: [], calls: [], nextFollowUp: null,
        events: [{ id: `event-${i}`, kind: "reported", title: "Community case opened", description: "Fictional issue created for the Pramanik demonstration. No government response or assignment has been recorded.", source: "Demo seed", createdAt }],
      };
    }),
  };
}
