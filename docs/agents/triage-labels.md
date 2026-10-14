# Triage Labels

The skills speak in terms of five canonical triage roles. This file maps those roles to the actual label strings used in this repo's issue tracker, plus the terminal `resolved` status, reused from the wayfinding operations in `issue-tracker.md`.

| Label in engineering/skills | Label in our tracker | Meaning                                            |
| --------------------------- | -------------------- | -------------------------------------------------- |
| `needs-triage`              | `needs-triage`       | Maintainer needs to evaluate this issue            |
| `needs-info`                | `needs-info`         | Waiting on reporter for more information           |
| `ready-for-agent`           | `ready-for-agent`    | Fully specified, ready for an AFK agent            |
| `ready-for-human`           | `ready-for-human`    | Requires human implementation                      |
| `wontfix`                   | `wontfix`            | Will not be actioned                               |
| `resolved`                  | `resolved`           | Done; every acceptance criterion is met and ticked |

When a skill mentions a role (e.g. "apply the AFK-ready triage label"), use the corresponding label string from this table.

When you finish a ticket, set it to `resolved` and tick its acceptance-criteria checkboxes (see `issue-tracker.md`).

Edit the right-hand column to match whatever vocabulary you actually use.
