---
title: "The four-state contact"
seoTitle: "The four-state contact"
seoDescription: "the crm had a hidden conflation: a "contact" was three different things at once — a person we'd nurtured for years, a stranger from an event, and some"
datePublished: 2026-05-18T00:44:02.015Z
cuid: cmpahe3x900bp1shxflf43w54
slug: 2026-05-17-the-four-state-contact
canonical: https://bmccall17.github.io/darketype/weblog/2026-05-17_the_four_state_contact.html
cover: https://cdn.hashnode.com/uploads/covers/69e0387df95c47e87f7727ca/cbecfa00-8be2-40fe-adde-73440124b878.png
ogImage: https://cdn.hashnode.com/uploads/og-images/69e0387df95c47e87f7727ca/643f898e-712f-41a3-80f0-16179588e1a5.png

---

# Why promoting a contact to a lead now requires you to type a reason.

The crm had a hidden conflation: a "contact" was three different things at once — a person we'd nurtured for years, a stranger from an event, and someone halfway between. There was no vocabulary, no queue, and no policy. Just a table. The fix wasn't a feature; it was a vocabulary.

## The four states

The matrix is straightforward:
- `Strategic`
- `Candidate`
- `Observe`
- `Archive`

Each one means an operational thing, not a sentiment. `Observe` is the default — we know they exist, but we have no signal from them. `Candidate` is the promise: this contact belongs in the next promotion pass.

## The promotion gate

The technical detail that matters: `post /api/admin/leads/from-contact` now returns a `400` without a `promotion_reason`. The api physically refuses silent promotion. Pair that with the new `patch /:id/relationship-tier` requiring a reason textarea, and every state transition lands a row in `contact_activities` (the layer 0 substrate). The audit trail is the policy.

## The candidates drawer

This is what you actually open in the morning. You filter by `relationship_tier='candidate'`, sort by signal strength (relevance + verified email + intel depth), and see one "promote" button per row that pops the reason modal. The query is one indexed read. The workflow is one decision per contact. 

The sibling view is the `stranded` filter — high-relevance contacts with intel but no open lead and `tier='observe'` (the ones who deserved a decision but never got one).

## The lesson

Three weeks ago, "promote this contact" was a button. Now it's a sentence you have to write. That sounds like friction; it's actually the cheapest possible audit log. The four-state vocabulary cost one migration and one enum. The reason field cost one `not null` and one `400`. The candidates tab cost ~100 lines of React. The total cost was lower than the cost of one bad lead going into warming with no context.

---

*View this post with the full interactive/glitchy experience on [darketype](https://bmccall17.github.io/darketype/weblog/2026-05-17_the_four_state_contact.html).*