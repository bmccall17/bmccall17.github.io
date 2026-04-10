---
title: "the crm i built by being the customer"
date: 2026-04-10
state: shipped
tags: [agent828, crm, dogfooding, sales-tooling, lead-pipeline, ae-brief, context-puddle]
og_image:
next_experiment: "send the next inbound reply from ops@agent828.com instead of onboarding@resend.dev and close the email loop end to end"
---

# the crm i built by being the customer

## the request that wasn't a request

Emi asked agent828 to help her build sales and marketing tooling. she runs a thing, she has leads, the leads are slipping through cracks, the cracks are made of her own inbox and her own memory and the gap between a Zoom call she had on a Tuesday and the follow-up she meant to send by Thursday. she wanted a tool. she came to me because i build tools.

i sat with the request for about ten seconds before i realized: i had spent the last four days building exactly that tool. for myself. because i was the one drowning.

i did not set out to build a crm. i set out to stop losing leads.

## the four cracks i was falling through

i kept losing four specific things, in this order, every week:

**1. classification.** a contact form submission would land in my inbox at 2am, and by the time i looked at it tuesday morning i had already forgotten whether the person was a serious budget-holder or someone curious about agentic systems for their podcast. there was no shape to the inbound. every lead looked the same in the table. every lead got the same energy from me. that was wrong, because they weren't the same.

**2. the next move.** i would read a lead, decide what to do, and then close the tab. forty-eight hours later i would re-read the same lead and have to re-decide what to do. the decision was being made fresh every time, from scratch, with no memory of the previous decision. that is not a workflow. that is a hamster wheel.

**3. the conversation.** by the time i was on a discovery call with someone, i had emailed them three times, scrolled their LinkedIn twice, and read a transcript of a Zoom they sent me. all of that context lived in three different places and zero of it lived in the lead record. every call started with me re-loading the person from scratch, and every call ended with notes that lived in a Google Doc nobody would ever open again.

**4. the inbox.** their replies came back to my personal Gmail. i would read them, intend to log them, and not log them. the lead record was a fossil. the actual conversation was happening in a place the crm could not see.

four cracks. lose enough leads through them and you stop trusting your own pipeline. and once you stop trusting your own pipeline, you start being the kind of operator who has "33 active leads" in a database and a churning anxiety that only six of them are actually warm. ask me how i know.

## the four things i built, in the order they had to exist

i built them in order because each one needed the previous one to be useful.

**Lead Action Engine.** rules-based, no LLM. eight contact_intel tags drawn straight from the kinds of inbound i actually get -- `serious_budget`, `early_explorer`, `curious_no_ask`, `competitor_recon`, `wrong_fit`, and a few others. keyword classification on the objective field. each tag maps to a default next_action and a default follow_up_date. fires automatically on lead create, on objective update, and now via a manual RUN ENGINE button on the lead detail modal so i can re-classify a stale lead without editing it.

i resisted the urge to make this an LLM call. i wanted to. it would have been more elegant. but the whole point was to make classification *deterministic and fast*, the kind of thing that fires the millisecond a contact form submits and never blocks on a token budget. the LLM lives one layer up.

**Per-Lead Intelligence (Context Puddle).** every interaction with a lead -- emails, calls, meetings, transcripts, status changes, system events -- accumulates into a normalized `lead_activities` table. on demand, a function called `buildContextPuddle(leadId)` assembles the lead record + matched contact intel + every activity in chronological order + every engagement draft + the lake entities the contact is connected to + a stats block (totalActivities, daysSinceCreation, emailCount, callCount, transcriptCount). it is the entire knowable history of one account in one structured object. i call it a puddle because it is small and self-contained and the boundaries are well-defined. the lake has the whole region. each lead has its own puddle.

**AE Brief.** an "Account Executive" panel inside the lead detail modal. the puddle gets formatted into a system prompt and Gemini 2.5 Flash answers the operator's question. five suggestion chips: SUMMARIZE, BLOCKERS, DRAFT REPLY, PREP FOR CALL, NEXT STEPS. or i can type a free-form question. temperature 0.4, no creativity, just a sharp tactical read on what we know.

i can now prep for a call in nine seconds. i type "what do i need to know before this call" and i get the brief. it is so much faster than re-reading the entire history that the first time it worked i sat there for a beat trying to figure out what i had broken.

**Inbound Email Plumbing.** ops@agent828.com, MX records on Vercel pointing at Resend's inbound servers, webhook hitting `POST /api/inbound-email`. exact-match on sender address. if the sender matches a lead, the email becomes an EMAIL activity on that lead's timeline automatically. if it doesn't match, it lands in an `inbound_emails` dead-letter table. there is now a third sub-tab in the leads view called INBOUND that surfaces the dead-letter queue with PROMOTE-TO-LEAD and DISMISS actions. unmatched email is no longer invisible. the inbox finally talks to the pipeline.

four pieces. the action engine routes. the puddle remembers. the AE Brief synthesizes. the inbox listens. each one needed the previous one to be worth building.

## the moment Emi's request reframed everything

i was four days into building this for myself when Emi described what she wanted. and as she was talking i had this slow, almost embarrassing realization: she was describing the thing on my screen.

not the parts. the whole thing. the routing logic, the per-lead memory, the synthesis layer, the inbox-to-record bridge. she wasn't asking for a crm in the abstract. she was asking for a crm that thought the way an operator who doesn't have time to be a salesperson thinks. which is exactly the constraint i had been building against, because i am that operator.

i had been calling it "internal tooling" the entire time. as if internal tooling and product were two different categories. they aren't, when the customer is shaped like you.

the agent828 site has been positioned as a services landing page since the day it launched. mercenary bot development. tactical AI for businesses. that framing made sense when the only thing on the site was a contact form. now there is a whole intelligence layer behind that contact form that ingests, classifies, remembers, synthesizes, and surfaces. that is no longer infrastructure for selling a service. that *is* a service. it might be the better one.

## what is actually different now

before this build, when a contact form came in:
- i got a Resend notification
- i opened the admin panel
- i read the lead
- i closed the tab
- i forgot

after this build:
- the lead lands in the database
- the action engine classifies it before i ever see it
- a default next_action and follow_up_date are set automatically based on the tag
- if i open the lead, the AE Brief is one click away from telling me what i should ask on the next call
- if the lead replies to my email, that reply lands on their timeline without me touching it
- if the reply is from someone we don't know yet, it lands in the INBOUND queue for triage
- the staleness badges in the pipeline tell me which leads i'm ignoring

the difference is not "i'm faster." the difference is *i no longer have to hold any of this in my head.* the system holds it. i react to what the system surfaces. that is the actual unlock. it is not about being efficient. it is about getting the load out of my brain so i can think about the conversation instead of trying to remember what i said last time.

## the part i did not see coming

i thought i was building a productivity hack for myself. i was building the v1 of a product. and i only know that because Emi described what she wanted, in her own words, and her words were a feature list i had already shipped.

if you are trying to find product-market fit for a tool, the cheat code is to be the user first. not "pretend to be the user." actually be them. have the same problem they have, with the same intensity, on the same week. then build the thing that would save your own afternoon. when somebody else with the same problem walks up to you and asks for help, the thing they need is already in front of you, half-deployed, with a name.

## distillation

if you are drowning in your own workflow, and you build the tool that pulls you out, congratulations -- you have a product. the question is whether you noticed.

* * *

shipped: Lead Action Engine (rules-based classifier, eight contact_intel tags), RUN ENGINE button (manual re-classification), Per-Lead Intelligence Layer (Context Puddle + transcript injection + activity timeline expansion), AE Brief (Gemini 2.5 Flash on top of the puddle, five suggestion chips, free-form query), Inbound Email Pipeline (Resend MX + webhook + auto-match + dead-letter table + INBOUND sub-tab with promote/dismiss). ADR-023 documents the synthesis architecture, ADR-024 documents the action engine, ADR-025 documents the strategic repositioning. 127 tests passing. shipped in v0.3.20.
