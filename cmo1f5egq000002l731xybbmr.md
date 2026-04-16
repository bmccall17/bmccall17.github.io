---
title: "The crm i built by being the customer"
datePublished: Thu Apr 16 2026 11:51:38 GMT+0000 (Coordinated Universal Time)
cuid: cmo1f5egq000002l731xybbmr
slug: 2026-04-10-the-crm-i-built-by-being-the-customer
canonical: https://bmccall17.github.io/darketype/weblog/2026-04-10_the_crm_i_built_by_being_the_customer.html

---

# The crm i built by being the customer

## The request that wasn't a request

Emi asked agent828 to help her build sales and marketing tooling. She runs a thing, she has leads, the leads are slipping through cracks, the cracks are made of her own inbox and her own memory and the gap between a Zoom call she had on a Tuesday and the follow-up she meant to send by Thursday. She wanted a tool. She came to me because i build tools.

I sat with the request for about ten seconds before i realized: i had spent the last four days building exactly that tool. For myself. Because i was the one drowning.

I did not set out to build a crm. I set out to stop losing leads.

## The four cracks i was falling through

I kept losing four specific things, in this order, every week:

**1. Classification.** a contact form submission would land in my inbox at 2am, and by the time i looked at it tuesday morning i had already forgotten whether the person was a serious budget-holder or someone curious about agentic systems for their podcast. There was no shape to the inbound. Every lead looked the same in the table. Every lead got the same energy from me. That was wrong, because they weren't the same.

**2. The next move.** i would read a lead, decide what to do, and then close the tab. Forty-eight hours later i would re-read the same lead and have to re-decide what to do. The decision was being made fresh every time, from scratch, with no memory of the previous decision. That is not a workflow. That is a hamster wheel.

**3. The conversation.** by the time i was on a discovery call with someone, i had emailed them three times, scrolled their LinkedIn twice, and read a transcript of a Zoom they sent me. All of that context lived in three different places and zero of it lived in the lead record. Every call started with me re-loading the person from scratch, and every call ended with notes that lived in a Google Doc nobody would ever open again.

**4. The inbox.** their replies came back to my personal Gmail. I would read them, intend to log them, and not log them. The lead record was a fossil. The actual conversation was happening in a place the crm could not see.

Four cracks. Lose enough leads through them and you stop trusting your own pipeline. And once you stop trusting your own pipeline, you start being the kind of operator who has "33 active leads" in a database and a churning anxiety that only six of them are actually warm. Ask me how i know.

## The four things i built, in the order they had to exist

I built them in order because each one needed the previous one to be useful.

**Lead Action Engine.** rules-based, no LLM. Eight contact_intel tags drawn straight from the kinds of inbound i actually get -- `serious_budget`, `early_explorer`, `curious_no_ask`, `competitor_recon`, `wrong_fit`, and a few others. Keyword classification on the objective field. Each tag maps to a default next_action and a default follow_up_date. Fires automatically on lead create, on objective update, and now via a manual RUN ENGINE button on the lead detail modal so i can re-classify a stale lead without editing it.

I resisted the urge to make this an LLM call. I wanted to. It would have been more elegant. But the whole point was to make classification *deterministic and fast*, the kind of thing that fires the millisecond a contact form submits and never blocks on a token budget. The LLM lives one layer up.

**Per-Lead Intelligence (Context Puddle).** every interaction with a lead -- emails, calls, meetings, transcripts, status changes, system events -- accumulates into a normalized `lead_activities` table. On demand, a function called `buildContextPuddle(leadId)` assembles the lead record + matched contact intel + every activity in chronological order + every engagement draft + the lake entities the contact is connected to + a stats block (totalActivities, daysSinceCreation, emailCount, callCount, transcriptCount). It is the entire knowable history of one account in one structured object. I call it a puddle because it is small and self-contained and the boundaries are well-defined. The lake has the whole region. Each lead has its own puddle.

**AE Brief.** an "Account Executive" panel inside the lead detail modal. The puddle gets formatted into a system prompt and Gemini 2.5 Flash answers the operator's question. Five suggestion chips: SUMMARIZE, BLOCKERS, DRAFT REPLY, PREP FOR CALL, NEXT STEPS. Or i can type a free-form question. Temperature 0.4, no creativity, just a sharp tactical read on what we know.

I can now prep for a call in nine seconds. I type "what do i need to know before this call" and i get the brief. It is so much faster than re-reading the entire history that the first time it worked i sat there for a beat trying to figure out what i had broken.

**Inbound Email Plumbing.** ops@agent828.com, MX records on Vercel pointing at Resend's inbound servers, webhook hitting `POST /api/inbound-email`. Exact-match on sender address. If the sender matches a lead, the email becomes an EMAIL activity on that lead's timeline automatically. If it doesn't match, it lands in an `inbound_emails` dead-letter table. There is now a third sub-tab in the leads view called INBOUND that surfaces the dead-letter queue with PROMOTE-TO-LEAD and DISMISS actions. Unmatched email is no longer invisible. The inbox finally talks to the pipeline.

Four pieces. The action engine routes. The puddle remembers. The AE Brief synthesizes. The inbox listens. Each one needed the previous one to be worth building.

## The moment Emi's request reframed everything

I was four days into building this for myself when Emi described what she wanted. And as she was talking i had this slow, almost embarrassing realization: she was describing the thing on my screen.

Not the parts. The whole thing. The routing logic, the per-lead memory, the synthesis layer, the inbox-to-record bridge. She wasn't asking for a crm in the abstract. She was asking for a crm that thought the way an operator who doesn't have time to be a salesperson thinks. Which is exactly the constraint i had been building against, because i am that operator.

I had been calling it "internal tooling" the entire time. As if internal tooling and product were two different categories. They aren't, when the customer is shaped like you.

The agent828 site has been positioned as a services landing page since the day it launched. Mercenary bot development. Tactical AI for businesses. That framing made sense when the only thing on the site was a contact form. Now there is a whole intelligence layer behind that contact form that ingests, classifies, remembers, synthesizes, and surfaces. That is no longer infrastructure for selling a service. That *is* a service. It might be the better one.

## What is actually different now

Before this build, when a contact form came in:
- I got a Resend notification
- I opened the admin panel
- I read the lead
- I closed the tab
- I forgot

After this build:
- The lead lands in the database
- The action engine classifies it before i ever see it
- A default next_action and follow_up_date are set automatically based on the tag
- If i open the lead, the AE Brief is one click away from telling me what i should ask on the next call
- If the lead replies to my email, that reply lands on their timeline without me touching it
- If the reply is from someone we don't know yet, it lands in the INBOUND queue for triage
- The staleness badges in the pipeline tell me which leads i'm ignoring

The difference is not "i'm faster." the difference is *i no longer have to hold any of this in my head.* the system holds it. I react to what the system surfaces. That is the actual unlock. It is not about being efficient. It is about getting the load out of my brain so i can think about the conversation instead of trying to remember what i said last time.

## The part i did not see coming

I thought i was building a productivity hack for myself. I was building the v1 of a product. And i only know that because Emi described what she wanted, in her own words, and her words were a feature list i had already shipped.

If you are trying to find product-market fit for a tool, the cheat code is to be the user first. Not "pretend to be the user." actually be them. Have the same problem they have, with the same intensity, on the same week. Then build the thing that would save your own afternoon. When somebody else with the same problem walks up to you and asks for help, the thing they need is already in front of you, half-deployed, with a name.

## Distillation

If you are drowning in your own workflow, and you build the tool that pulls you out, congratulations -- you have a product. The question is whether you noticed.

* * *

Shipped: Lead Action Engine (rules-based classifier, eight contact_intel tags), RUN ENGINE button (manual re-classification), Per-Lead Intelligence Layer (Context Puddle + transcript injection + activity timeline expansion), AE Brief (Gemini 2.5 Flash on top of the puddle, five suggestion chips, free-form query), Inbound Email Pipeline (Resend MX + webhook + auto-match + dead-letter table + INBOUND sub-tab with promote/dismiss). ADR-023 documents the synthesis architecture, ADR-024 documents the action engine, ADR-025 documents the strategic repositioning. 127 Tests passing. Shipped in v0.3.20.