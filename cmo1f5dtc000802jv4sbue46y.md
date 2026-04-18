---
title: "Understanding the lake"
datePublished: Thu Apr 16 2026 11:51:37 GMT+0000 (Coordinated Universal Time)
cuid: cmo1f5dtc000802jv4sbue46y
slug: 2026-03-31-understanding-the-lake
canonical: https://bmccall17.github.io/darketype/weblog/2026-03-31_understanding_the_lake.html
cover: https://bmccall17.github.io/assets/social/og/2026-03-31_understanding_the_lake.png
tags: architecture, port, agent828, context-lake

---

# Understanding the lake

What if the most important part of the system i built is the context lake? Perhaps the center of it all is exactly that.

When people first look at agent828, they often see a sharp local brand with a tactical vibe. The website, the admin panel, the Discord bot, the social posts, and the lead tracking are all very real. However, the real breakthrough is how it was built from the inside out.

At the core of agent828 is a context lake. This acts as a living intelligence layer and a shared memory, forming a structured body of knowledge that holds everything the system needs to understand the 828 region in western North Carolina, including Asheville and the surrounding ecosystem.

My lake stores organizations, people, venues, neighborhoods, events, topics, scraped media, prospects, leads, engagement signals, preferences, performance metrics, and the relationships connecting them. The bot and admin panel read from it, while my research flows directly into it. My content comes out of it, and my operations run entirely through it.

![Agent dashboard overview](https://bmccall17.github.io/darketype/entries/media/2026-03-31_understanding_the_lake/agent_dashboard.png)

This is the key idea. I built memory first. Structure first. Context first. Only then did the interfaces follow. The website, admin panel, Discord, and publishing system act purely as interfaces. The real system lives underneath those surfaces. The real system is the lake itself.

Seeing it that way changed everything. The question shifted from making a clever bot to designing a system that actually knows its own operating environment. How do i create a source of truth that keeps getting richer over time? How do i make something that can be updated, queried, enriched, governed, and acted on by both humans and agents simultaneously?

This is exactly where [Zohar's framework from Port](https://autonomousengineering.substack.com/p/backstage-is-dead) hit me so hard. His argument suggests the industry is moving beyond the old portal-first way of thinking. In older models, the UI sat clearly at the center where humans looked things up, making the interface the product itself. In the newer model, the center has shifted. The real value is the localized context layer underneath. It becomes a shared infrastructure and a living model of the organization where both humans and agents work together. This perfectly describes putting the context lake at the center.

In his world, this applies to engineering organizations. Their lake holds things like services, teams, deployments, incidents, ownership, standards, scorecards, and actions. It is built to support modern internal developer platforms and agentic engineering, giving agents real-time structured context instead of stale instructions. This provides humans and agents a shared source of truth, making governance, permissions, orchestration, and action genuinely possible. The UI remains, but it loses its status as the center of gravity.

Reading that made me realize i arrived at a very similar architecture from a completely different direction. I am building a regional intelligence and action system for a local market instead of an engineering platform for the SDLC, yet the pattern is strikingly similar.

In Port's world, the software catalog models the engineering environment. In my world, the context lake models the 828 environment. Their agents need to understand ownership, dependencies, incidents, and readiness. My agents need to understand who matters in the region, what is happening, what topics are moving, which organizations connect to which places and people, what prospects are actively worth paying attention to, and what signals should shape the next automated action.

Their context lake supports engineering workflows. Mine supports research, enrichment, content generation, approvals, publishing, tracking, and local intelligence gathering. Their interfaces might be dashboards, APIs, and MCP. Mine are a website, an admin terminal, Discord workflows, and publishing channels. We operate in different domains with the exact same architectural truth, which feels incredibly exciting.

![Agent lake metrics](https://bmccall17.github.io/darketype/entries/media/2026-03-31_understanding_the_lake/lake_metrics.png)

I actually built a domain-specific operating layer for agents. This is a system where context is upstream and outputs deliberately fall downstream. It prioritizes memory from the very beginning. Agents and humans can both act securely from the same underlying source of truth. With several lines natively feeding it, the data participates actively in a formal workflow: **research > enrichment > organize > generate > approve > publish > measure > learn > repeat**. It feels like a much more modern idea than simply automating a feed.

I also want to be honest about our differences and gaps. Port's model is more mature, formal, and explicit in a few key ways. Their framework includes stronger notions of governance, scorecards, standards, permissions, and specialized agent-facing interfaces. Because they build for engineering organizations, their language is very precise around systems, services, risk, ownership, and operational quality. Their lake connects deeply to modern IDP concepts and a future where agents act inside complex engineering environments.

My system is charting its own path. The lake remains more lightweight in its governance right now. I have active approvals, auditability, protected routes, and workflow checkpoints. It is steadily moving toward the full formal policy layer that [Port.io](https://port.io/) describes.

We currently use actions existing as commands, scripts, workflows, and interfaces rather than a polished action library. However, once the agents join the party, they link all the entities together in meaningful, relational ways that increase efficiency and accuracy at the same time. The system has robust relationships right now, leaving plenty of room to make the graph itself more explicit, queryable, and operationally intelligent over time.

I avoid forcing the analogy too far since i am building something closer to a local market intelligence platform, a GTM ops system, and an agentic operating layer for a region and service business. Those unique differences actually make the comparison more meaningful.

I see clearly now that i independently found the exact same pattern. I ran into the same architectural truth: for agents to be heavily useful, they need context. Real, structured, current, governed, and shared context. They absolutely need a true world model. The context lake securely provides that world model. It makes the rest of the system coherent, and i think that is entirely worth celebrating.

Reading about a modern idea and nodding along is one experience, while actually building it is another entirely. Hearing someone say that AI systems need shared context, memory, structure, and orchestration is a profound realization, but making architectural decisions that reflect that understanding takes it critically further. Admiring the future is great; actively participating in building it feels completely different.

What i built with agent828 might look different from a traditional product category right now. It resists fitting neatly into the old language, which is part of what makes it brave. I am grokking the true pattern underneath the trend. I understand now that a context lake serves as the living center of an agentic system. It transforms into the primary place where knowledge becomes usable, action becomes grounded, interfaces become secondary, and intelligence becomes fully cumulative.

This represents a leap i feel genuinely proud of. I built something ultra-modern by understanding the concept deeply enough to make it real in my own domain. Taking an idea that feels abstract to many, i turned it entirely into an operating system for my own work. I built the tool first, learned by doing, and found the architecture directly by making it.

To me, this remains the true story. The focus successfully shifts from just making a bot into deeply understanding the lake.