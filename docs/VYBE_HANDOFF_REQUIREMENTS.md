# VYBE Master Overview / Chat Handoff Requirements

Purpose: make every VYBE handoff reliable enough that a new chat can continue development without losing approved behavior, project context, or repository safety rules.

## 1. Mandatory source of truth

Every VYBE handoff must explicitly reference and carry forward:
- `docs/VYBE_PLATFORM_CONSTANTS.md`
- this file, `docs/VYBE_HANDOFF_REQUIREMENTS.md`
- the current Git branch
- the latest confirmed commit
- the current deployment/production status
- the current working-tree status
- the exact next recommended step

A new chat must review the Platform Constants before changing VYBE code.

## 2. Required handoff sections

Every Master Overview / Chat Handoff must contain:
- Project identity and current objective
- Current architecture and connected services
- Current branch and repository path
- Latest confirmed commit and push status
- Production deployment status
- Localhost/dev-server status when relevant
- What was completed in the current chat
- What was verified by the user
- What remains incomplete or unverified
- Exact files intentionally changed
- Important files intentionally left untracked or untouched
- Current VYBE Platform Constants
- Membership/public-presence rules
- Playback/player rules
- Mobile/desktop rules
- Privacy/access rules
- Identity/workspace rules
- Known regressions and resolved regressions
- Current unresolved issues
- Exact recommended next steps in order
- A master prompt for the next chat

## 3. Status language must be precise

Never collapse these states into one:
- CODED: code was changed
- BUILT: build completed successfully
- LOCAL TESTED: localhost was tested
- USER VERIFIED: user confirmed behavior
- COMMITTED: Git commit exists
- PUSHED: commit reached GitHub remote
- DEPLOYED: production deployment completed
- PRODUCTION VERIFIED: public production behavior was checked

A handoff must say which state applies to each important change.

## 4. Constants protection

Before making any future update, the new chat must:
1. read the relevant constants;
2. identify which LOCKED or VERIFY rules are affected;
3. make the smallest targeted change;
4. re-test affected constants;
5. verify desktop and mobile when structural UI is touched;
6. avoid declaring completion until required verification is done.
A LOCKED constant must not be intentionally changed unless the user explicitly approves that change.

## 5. Repository safety

Every handoff must preserve these development rules:
- inspect before changing;
- never reset or overwrite unrelated uncommitted work;
- never use `git add .` for VYBE work;
- stage only intentional files;
- leave unrelated untracked files untouched;
- do not mix VYBE with other repositories;
- local validation comes before production deployment;
- production verification comes after deployment.

If the repo has unrelated untracked files, the handoff must mention them as protected/unrelated rather than treating the tree as disposable.

## 6. Memory and continuity

The handoff is the project-level continuity source and must contain enough context to continue even if account memory is incomplete.

At the start of a new VYBE chat, the new chat should:
- review the supplied Master Overview / Chat Handoff;
- review the Platform Constants;
- inspect the live repository state before acting;
- use relevant remembered VYBE context when available;
- preserve newly verified rules in the next handoff.

ChatGPT account memory may update asynchronously and cannot be guaranteed to store every project detail immediately. Therefore the repo documents and Master Overview are the canonical continuity mechanism.
## 7. End-of-chat requirement

Before a VYBE development chat is considered ready to hand off:
- update the Master Overview with all meaningful changes from that chat;
- include all newly verified constants or regression findings;
- include the latest commit/push/deployment state;
- state what remains unfinished;
- identify the first task for the next chat;
- include the Master Prompt below.

## 8. Mandatory Master Prompt for the next chat

Use this structure at the end of every handoff:

"Continue development of the VYBE platform from this handoff. First review the entire handoff and the current `docs/VYBE_PLATFORM_CONSTANTS.md` and `docs/VYBE_HANDOFF_REQUIREMENTS.md`. Inspect the current repository and Git state before changing anything. Preserve all LOCKED constants and re-test affected VERIFY items. Do not reset or overwrite unrelated work. Do not use `git add .`; stage only intentional files. Keep desktop/mobile behavior, membership enforcement, privacy/access controls, identity/workspace boundaries, and persistent playback behavior intact unless I explicitly approve a change. Distinguish coded, built, local-tested, user-verified, committed, pushed, deployed, and production-verified states. Continue from the exact next step documented in this handoff."

## 9. Handoff quality check

Before delivering a new handoff, confirm:
- Can a new chat identify the correct repo and branch?
- Can it identify the latest safe commit?
- Can it tell what is deployed versus only local/pushed?
- Can it identify every unfinished item?
- Can it identify the VYBE behaviors that must not regress?
- Can it continue without asking the user to repeat already-documented decisions?
