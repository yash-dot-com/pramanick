# Pramanik Pune contacts — 2026-10-24

This dataset includes publicly published professional contacts, not personal/private data.

## Files
- `contacts_master.csv`: agency, office, position, person's official published name (where available), office phone, official mobile (where published), email, physical office address, map search link, published jurisdiction, issues, primary source, recency and status.
- `area_anchors.csv`: five station/locality markers plus Viman Nagar, with OSM-derived representative lat/lon and a confidence field. These **are not ward boundaries**.
- `area_contact_links.csv`: area-to-contact directory links, NOT legally verified issue-to-person assignments.
- `issue_routing_rules.csv`: suggested issue categories and minimum checks before assignment.
- `pcmc_ward_office_mapping.csv`: official earlier extracted PCMC electoral-to-regional-office mapping; ward numbers are not geospatial polygons.
- `map_points.geojson`: grounded point geometries only; offices lacking reliable coordinates are omitted, not geocoded from guesswork.

## Critical provenance and limitations
- Current PCMC names and emails from `pcmcindia.gov.in/departments-details?Id=...`.
- PMC office PHONE numbers are from a *historic official property-tax directory*, not a new staffing list; verify before production.
- Five named PMC ward contacts are from official PMC October–December 2025 RTI disclosure. The snapshot does not establish the same officer remains in post in 2026. In particular, names in other-year municipal disclosures are not identical.
- Maha Metro traffic/security names from its official English/Marathi customer-care pages; a traffic-security officer is **not automatically responsible for road repairs**.
- MLA names and constituencies are from Pune District Government public representative page. They represent constituencies and can facilitate oversight; they are not the municipal maintenance departments. Phone/email left blank if not published in the consulted authoritative source.
- `office_latitude` and `office_longitude` are intentionally blank where unavailable. Google Maps search links use office addresses, not geocoding coordinates; check these before pinning.
- It is unsafe to assume Viman Nagar or Ramwadi entire neighborhood maps to one PMC ward based only on a center point; actual polygon needed.
- No automated calling is authorized for any contact (`automated_call_authorized=NO` everywhere). For live hackathon call only the consenting demo contact. Store recordings privately and redact before public display.
- This is not exhaustive for the several thousand employees or all offices in PCMC/PMC. It focuses on roles likely relevant to the six target areas and their main functional departments.
- Some listed phone numbers are switchboards, NOT direct personal phone numbers.

## Development use
1. Import `contacts_master.csv` into a `public_contacts` SQLite table.
2. Join `area_contact_links.csv` using `contact_id` to display a directory in Information mode.
3. Overlay official ward GeoJSON polygons before binding a complaint lat/lon to an administrative ward.
4. Resolve issue topic + asset ownership using `issue_routing_rules.csv`; approve the responsible office via a human review.
5. Keep public contact lookups and autonomous call permissions separate.

No current official ward polygons are embedded in this package. The user may reuse the earlier `boundary_sources.csv` to obtain and prepare them.

### Simplest files to import
- `contacts_by_location.csv` is **pre-joined/denormalized** for frontend filters. One contact appears once for each relevant area.
- `contacts_by_location.json` contains the same records in JSON for importing into TypeScript seed scripts.
- Blank values are intentional; source-as-of and `verification_status` are important.
