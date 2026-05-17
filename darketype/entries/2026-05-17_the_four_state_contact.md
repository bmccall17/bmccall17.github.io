---
title: "the four-state contact"
date: 2026-05-17
state: "shipped"
tags: [crm, lifecycle, audit-trail, workflow]
series: "crm-agent828"
---

# why promoting a contact to a lead now requires you to type a reason.

the crm had a hidden conflation: a "contact" was three different things at once — a person we'd nurtured for years, a stranger from an event, and someone halfway between. there was no vocabulary, no queue, and no policy. just a table. the fix wasn't a feature; it was a vocabulary.

## the four states

the matrix is straightforward:
- `strategic`
- `candidate`
- `observe`
- `archive`

each one means an operational thing, not a sentiment. `observe` is the default — we know they exist, but we have no signal from them. `candidate` is the promise: this contact belongs in the next promotion pass.

## the promotion gate

the technical detail that matters: `post /api/admin/leads/from-contact` now returns a `400` without a `promotion_reason`. the api physically refuses silent promotion. pair that with the new `patch /:id/relationship-tier` requiring a reason textarea, and every state transition lands a row in `contact_activities` (the layer 0 substrate). the audit trail is the policy.

## the candidates drawer

this is what you actually open in the morning. you filter by `relationship_tier='candidate'`, sort by signal strength (relevance + verified email + intel depth), and see one "promote" button per row that pops the reason modal. the query is one indexed read. the workflow is one decision per contact. 

the sibling view is the `stranded` filter — high-relevance contacts with intel but no open lead and `tier='observe'` (the ones who deserved a decision but never got one).

## the lesson

three weeks ago, "promote this contact" was a button. now it's a sentence you have to write. that sounds like friction; it's actually the cheapest possible audit log. the four-state vocabulary cost one migration and one enum. the reason field cost one `not null` and one `400`. the candidates tab cost ~100 lines of React. the total cost was lower than the cost of one bad lead going into warming with no context.
