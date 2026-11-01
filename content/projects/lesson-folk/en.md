## Context

Learning AI often means choosing between videos that stay too general and documentation that gets too technical. LessonFolk starts from another idea: AI itself is a great teacher, as long as you give it a real curriculum.

LessonFolk is a collection of open-source AI courses designed to be taught *by* an AI. Connect your assistant (Claude, ChatGPT, Cursor…) to LessonFolk, say "let's start", and it runs the lesson as a conversation: it explains, asks questions, adapts to your level and saves your progress.

## How it works

- **A website and an MCP server** (Model Context Protocol, the standard that lets AI assistants use tools): the assistant gets the courses and the tutor's instructions there, and saves progress there
- **A personal path**: the tutor asks about your level and interests, recommends a path, then teaches one short lesson at a time, with check questions and targeted reviews
- **Courses by theme**: understanding AI, using AI tools, building with AI, AI and society; from the fundamentals to RAG and agents
- **Hosted or at home**: on lessonfolk.com with a GitHub or Google account, or on your own computer with Docker, with no data sent anywhere
- **A Claude Code plugin** that connects LessonFolk in one command

## Approach

An open-source project: the code is MIT-licensed, the courses CC BY 4.0. Writing a course takes no code: open your AI agent in the repository, say "create a course about…", and it interviews the author, proposes an outline, writes the lessons with them and checks them.

Under the hood: an Astro dashboard, a TypeScript MCP server, progress stored in PostgreSQL, OAuth sign-in, automated tests and regular releases.

## What's next

**Projects** to put it into practice: a subject, a few milestones, and the tutor as a coach who gives hints instead of the solution.
