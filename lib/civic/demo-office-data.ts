import type { Category, IssueStatus } from "./model"

// Fictional scenarios. These scripts are also the source of the synthetic audio.
export const demoOfficers = [
  {
    id: "office-demo-meera",
    name: "Meera Deshmukh",
    role: "Ward civil works engineer",
    office: "Demonstration civil works desk",
    responsibilities: "Road repairs and storm-water drainage",
    localityId: "kothrud",
  },
  {
    id: "office-demo-nikhil",
    name: "Nikhil Jadhav",
    role: "Ward services officer",
    office: "Demonstration public services desk",
    responsibilities: "Water supply and street lighting",
    localityId: "pcmc",
  },
] as const

type DemoConversation = {
  key: string
  hoursAgo: number
  summary: string
  progress: string
  nextAction: string
  turns: ["agent" | "officer", string][]
}
type DemoCase = {
  id: string
  title: string
  category: Category
  issueType: string
  localityId: string
  landmark: string
  lat: number
  lng: number
  officer: number
  status: IssueStatus
  reportedHoursAgo: number
  dueHoursAgo: number
  reports: string[]
  nextAction: string
  calls: DemoConversation[]
}
export const demoOfficeCases: DemoCase[] = [
  {
    id: "office-demo-pothole",
    title: "School gate potholes repaired and checked",
    category: "roads",
    issueType: "Pothole",
    localityId: "kothrud",
    landmark: "Fictional Vidya School, west gate",
    lat: 18.50389,
    lng: 73.8075,
    officer: 0,
    status: "verified",
    reportedHoursAgo: 96,
    dueHoursAgo: 24,
    reports: [
      "Two deep potholes outside the school gate fill with water. Children step into traffic to avoid them.",
      "The same damaged stretch is difficult for wheelchairs and bicycles.",
      "Please repair the west entrance before school pickup.",
    ],
    nextAction:
      "Residents confirmed the repair. Keep the history available if the problem returns.",
    calls: [
      {
        key: "road-first",
        hoursAgo: 72,
        summary:
          "Meera accepted responsibility for the school gate road and promised a patch repair within two days.",
        progress: "in_progress",
        nextAction: "Check the promised repair and ask residents to confirm.",
        turns: [
          [
            "agent",
            "This is a scripted demonstration. I am Pramanik, following up on three reports about potholes at Vidya School's west gate. Who will handle the repair?",
          ],
          [
            "officer",
            "I am Meera Deshmukh, the ward civil works engineer. My team is responsible for this road. We will patch both potholes within two days.",
          ],
          [
            "agent",
            "I have saved that deadline. Residents will check the surface after your team finishes.",
          ],
        ],
      },
      {
        key: "road-followup",
        hoursAgo: 22,
        summary:
          "The agent recalled the earlier promise. Meera reported the patch repair finished; residents subsequently confirmed a usable surface.",
        progress: "completion_claimed",
        nextAction: "Compare the resident checks before closing the case.",
        turns: [
          [
            "agent",
            "Meera, I am following up on the two day repair promise for Vidya School's west gate. Three households reported the same potholes. What has changed?",
          ],
          [
            "officer",
            "Our road team has patched both potholes and removed the loose material. The school entrance is usable now. Please ask the residents to check it.",
          ],
          [
            "agent",
            "Thank you. I will record this as your completion claim and ask residents to verify the repair before closing the case.",
          ],
        ],
      },
    ],
  },
  {
    id: "office-demo-water",
    title: "Water leaking beside the metro footpath",
    category: "water",
    issueType: "Water leakage",
    localityId: "pcmc",
    landmark: "Fictional PCMC metro north service lane, valve V-12",
    lat: 18.62932,
    lng: 73.80329,
    officer: 1,
    status: "following_up",
    reportedHoursAgo: 36,
    dueHoursAgo: -24,
    reports: [
      "Clean water has been leaking from the valve beside the north service lane since morning.",
      "The wet footpath is slippery. The leak is beside valve V-12, not inside the station.",
    ],
    nextAction:
      "Return at the promised deadline and request a repair update with a site photograph.",
    calls: [
      {
        key: "water-first",
        hoursAgo: 24,
        summary:
          "Nikhil accepted the valve leak report and committed to replacing the faulty seal within two days.",
        progress: "in_progress",
        nextAction: "Follow up on the valve seal replacement deadline.",
        turns: [
          [
            "agent",
            "This is a scripted demonstration. Two residents report a water leak at valve V-12 on the north service lane outside PCMC metro. Is this with your team?",
          ],
          [
            "officer",
            "Yes. I am Nikhil Jadhav, the ward services officer. Our water team will replace the faulty seal within two days. We need a short supply shutdown.",
          ],
          [
            "agent",
            "I will keep the location and deadline in the case history and check back on the repair.",
          ],
        ],
      },
      {
        key: "water-followup",
        hoursAgo: 2,
        summary:
          "The agent supplied the exact valve location and recalled the previous commitment. The seal has arrived; repair remains pending.",
        progress: "in_progress",
        nextAction:
          "Deadline is still open. Ask for completion evidence after the shutdown.",
        turns: [
          [
            "agent",
            "Nikhil, yesterday you promised a new seal within two days. The reports identify valve V-12 beside the north service lane, outside the station. Has the repair started?",
          ],
          [
            "officer",
            "The replacement seal has arrived. Our water team will isolate the valve tomorrow morning and complete the repair by tomorrow afternoon. The earlier deadline still stands.",
          ],
          [
            "agent",
            "I have kept the original commitment. Please provide a site update after the repair. Residents will confirm whether the leak has stopped.",
          ],
        ],
      },
    ],
  },
  {
    id: "office-demo-light",
    title: "Streetlights restored? Residents are checking",
    category: "lighting",
    issueType: "Broken streetlight",
    localityId: "ramwadi",
    landmark: "Fictional Ramwadi walking lane, poles R-4 to R-6",
    lat: 18.55703,
    lng: 73.90856,
    officer: 1,
    status: "awaiting_verification",
    reportedHoursAgo: 60,
    dueHoursAgo: 24,
    reports: [
      "Three lamps on the walking lane are dark after sunset. The pole labels are R-4, R-5 and R-6.",
      "The unlit stretch makes the evening walk to the metro difficult.",
    ],
    nextAction:
      "Ask residents to check all three lamps after sunset. Officer confirmation alone does not close the case.",
    calls: [
      {
        key: "light-first",
        hoursAgo: 48,
        summary:
          "Nikhil promised an electrical inspection within one day. The deadline passed before a completion update was recorded.",
        progress: "in_progress",
        nextAction: "Check the inspection deadline and all three pole numbers.",
        turns: [
          [
            "agent",
            "This is a scripted demonstration. Residents say poles R-4 to R-6 on the Ramwadi walking lane are dark. Can your office arrange an inspection?",
          ],
          [
            "officer",
            "Our lighting team handles those poles. We will inspect the feeder and replace the failed lamps within one day.",
          ],
          [
            "agent",
            "I have recorded the one day commitment. I will ask residents to check the lane after sunset.",
          ],
        ],
      },
      {
        key: "light-followup",
        hoursAgo: 3,
        summary:
          "After the original deadline, Nikhil reported replacing the lamps. The agent requested resident verification after sunset.",
        progress: "completion_claimed",
        nextAction: "Await resident checks for poles R-4, R-5 and R-6.",
        turns: [
          [
            "agent",
            "Nikhil, the one day commitment for poles R-4 to R-6 has passed. We still need a clear update for the residents.",
          ],
          [
            "officer",
            "The lighting team replaced the three lamps this afternoon. I understand the update is late. All three should now be working. Please check after sunset.",
          ],
          [
            "agent",
            "I have recorded the delay and your completion claim. The case will stay open until residents confirm the lamps are working.",
          ],
        ],
      },
    ],
  },
  {
    id: "office-demo-drain",
    title: "Drain clearance disputed by residents",
    category: "drainage",
    issueType: "Blocked drain",
    localityId: "vanaz",
    landmark: "Fictional Vanaz market lane, drain D-8",
    lat: 18.50719,
    lng: 73.8052,
    officer: 0,
    status: "disputed",
    reportedHoursAgo: 120,
    dueHoursAgo: 48,
    reports: [
      "The drain beside the market entrance overflows after light rain. The grate is marked D-8.",
      "Water still collects at the entrance even though a crew visited.",
      "The drain mouth looks clear but water is not flowing through the outlet.",
    ],
    nextAction:
      "Reopen the inspection with the resident's conflicting observation and ask for an outlet flow test.",
    calls: [
      {
        key: "drain-first",
        hoursAgo: 96,
        summary:
          "Meera accepted responsibility and promised to clear drain D-8 within two days.",
        progress: "in_progress",
        nextAction: "Review the promised clearance and water flow.",
        turns: [
          [
            "agent",
            "This is a scripted demonstration. Three reports describe overflow at drain D-8 beside Vanaz market. Can you confirm who should act?",
          ],
          [
            "officer",
            "The ward drainage team is responsible. We will remove the blockage at drain D-8 within two days and check the outlet.",
          ],
          [
            "agent",
            "I have saved the drain label, responsibility and deadline. Residents will check whether water flows afterwards.",
          ],
        ],
      },
      {
        key: "drain-followup",
        hoursAgo: 12,
        summary:
          "Meera claimed the grate was cleared, but did not establish an outlet flow test. Residents later reported continuing overflow; the case was reopened.",
        progress: "completion_claimed",
        nextAction:
          "Send the conflicting resident report back to the engineer and request a flow test.",
        turns: [
          [
            "agent",
            "Meera, the two day deadline for drain D-8 has passed. Residents still need a reliable update. Was the outlet checked?",
          ],
          [
            "officer",
            "Our crew removed debris from the grate yesterday. I have a clearance note, but I do not yet have the outlet flow test result.",
          ],
          [
            "agent",
            "I will record what the crew completed and keep the outlet question open. We need a resident check before treating this as resolved.",
          ],
        ],
      },
    ],
  },
]

export function isScriptedDemo(
  outcome: Record<string, unknown> | null | undefined
) {
  const provenance = outcome?.provenance
  return (
    !!provenance &&
    typeof provenance === "object" &&
    "kind" in provenance &&
    provenance.kind === "scripted_demo"
  )
}
