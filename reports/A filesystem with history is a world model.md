# A filesystem with history is a world model
---
hero: "Each folder is fed by the part of the world it describes."
hero-alt: "A file tree on the left. On the right an ASCII skyline of a weather mast, a town hall, a forest, a power plant, a reservoir and a city whose windows light up and go dark. Dots of data flow from each place back into its folder."
---

**TL;DR.** If most of the world can be written down as files, then a folder under version control can serve as a world model: the files hold the current state, the commits hold every earlier state and every decision, and a simulator stored beside the data predicts what comes next. I test this on simulated cities and forests stored as git repositories and on eight real California reservoirs. When the shipped simulator was slightly wrong, frontier agents (Claude Opus 5.5 and gpt-6.2-sol) replayed it against the recorded history, corrected its parameters and forecast as well as a simulator with the true parameters; given only the history, Opus wrote and fitted a simulator of its own. A smaller model got much less out of the same folders. On the real reservoirs the agent beat simple forecasts, but the history and the simulator did not measurably improve it. Git history also did the job of an agent memory system: it answered questions about the past as well as a vector store and mem0, with no extra service and at lower cost. This suggests that a folder can hold what a twin needs, and that how much an agent gets out of it depends mostly on the model.

---

The world is one big filesystem.

On my Mac, everything I know and every program I use hangs somewhere off one tree. The internet is the same idea at a larger scale. Every page has a path, just with worse folder names.

Coding agents already work well in one part of that tree, the code repository. They list a directory, read files, make a change, run the tests and read the history when something breaks, so a repository is a small world that they can observe, remember, change and undo. Most physical systems are not stored this way. A power plant's readings sit in a time-series database, the weather comes from an API, decisions about the plant are recorded in emails and meeting notes, and a model of the plant, where one exists, runs somewhere else. I wanted to know what happens when all of this is put into one folder under version control, and whether an agent can then work with the plant the way it works with a codebase.

## A city in a folder

To test this I built small simulated worlds and stored each one as a git repository. Below is one of them, a city called Riverton with five districts, a reservoir, a power plant with a battery, and a council that sets policy.

```
riverton/
├── RULES.md            what every file means
├── policies.json       the council's decisions
├── weather.csv         observed, then forecast
├── state/
│   ├── clock.json
│   ├── reservoir.json  level, capacity
│   ├── grid.json       battery charge
│   └── districts/
│       ├── north.json  population, water, mood
│       └── ...
├── model/params.json   the simulator's settings
└── sim                 ./sim step · backtest
```

Each simulated week is one commit, and each decision is a separate commit whose message records what changed and why. These are the actual messages from this folder:

```
$ git log --oneline | head -3
81ce526 step 60
2269680 step 59
4c413e5 step 58

$ git log --format=%s | grep -v '^step'
policy: rationing set to level 3 in every district (drought emergency order)
policy: rationing in east set to level 2 (council vote)
policy: power priority order changed to west, center, south, east, north
event: plant output changed to 119.9 (maintenance schedule)
policy: desalination plant switched on
```

The folder contains nothing beyond JSON files, one CSV file, a short Python simulator and git.

## World Models

A **world model** is what lets you plan without trying things first. You know a glass pushed off the table will fall. You know your keys were in your jacket this morning. You can guess how the day goes if you take the bike instead of the train.

In machine learning the term in its current sense goes back to Ha and Schmidhuber's 2018 paper *World Models*, in which an agent learned a compressed model of a racing game and then practised inside it. The meaning has widened since, but it still comes down to a state of the world and rules for how that state changes, which in practice means being able to observe the state, update it, recall earlier states, predict the effect of an action, and try an action without committing to it. In the Riverton folder each of these operations corresponds to a command that coding agents already use:

| World model | In the folder | Example |
|---|---|---|
| State | `state/`, `policies.json` | The reservoir's current level |
| Observe | `cat`, `ls`, `grep` | Read the districts' satisfaction |
| Update | write a file, `git commit` | A new week of readings arrives |
| Remember | `git log`, `git show` | What the reservoir held before the drought order |
| Predict | `./sim step 20` | Where the reservoir will be in 20 weeks |
| Imagine | `git branch`, `git worktree` | A copy of the city without the rationing order |
| Undo | `git checkout`, `git revert` | Drop the copy and go back |
| Calibrate | `./sim backtest`, `model/params.json` | Replay the past and compare it with what was measured |

The last row matters most for a real asset, because a simulator of a real plant never matches the plant exactly.

## A perfect twin

I first generated 40 worlds, half of them cities and half of them forest reserves with vegetation, deer, wolves and fires, in which the simulator is exactly the program that produced the world. I asked Codex (gpt-5-mini) 152 questions, each of which needed one operation: recalling a past value, finding when something first happened, predicting a future value, undoing a past decision and reporting what would be true now, or choosing among three interventions. Each question was asked three times: with the current files only, with the git history added, and with the history and a `./sim` command.

<!-- fig:twins -->
```{=html}
<figure class="fsfig" role="group" aria-label="Perfect twin, by question type"><p class="fsfig-title">Perfect twin, by question type</p><p class="fsfig-sub">Codex on 40 simulated worlds (a city&#x27;s utilities, a forest ecosystem), 152 questions, answers checked exactly. Overall: 13% with a snapshot, 63% with history, 97% with the simulator.</p><p class="fsfig-legend"><span><i class="sw base"></i>snapshot only (current files)</span><span><i class="sw mid"></i>+ git history</span><span><i class="sw key"></i>+ simulator (./sim)</span></p><svg class="fschart" viewBox="0 0 640 464" role="img" aria-label="Perfect twin, by question type"><line class="grid" x1="235.0" x2="235.0" y1="18" y2="442"/><text class="tick" x="235.0" y="462" text-anchor="middle">0%</text><line class="grid" x1="320.0" x2="320.0" y1="18" y2="442"/><text class="tick" x="320.0" y="462" text-anchor="middle">25%</text><line class="grid" x1="405.0" x2="405.0" y1="18" y2="442"/><text class="tick" x="405.0" y="462" text-anchor="middle">50%</text><line class="grid" x1="490.0" x2="490.0" y1="18" y2="442"/><text class="tick" x="490.0" y="462" text-anchor="middle">75%</text><line class="grid" x1="575.0" x2="575.0" y1="18" y2="442"/><text class="tick" x="575.0" y="462" text-anchor="middle">100%</text><text class="lab key" x="223" y="63.0" text-anchor="end">Remember a past value</text><g class="row"><title>Remember a past value, snapshot only: 2% correct (n=40), 95% CI 0% to 8%</title><rect class="bar base grow-x" x="235" y="30" width="8.5" height="16" rx="2" style="transform-origin:235px 0"/><text class="val " x="250.5" y="43">2%</text></g><g class="row"><title>Remember a past value, + git history: 100% correct (n=40), 95% CI 100% to 100%</title><rect class="bar mid grow-x" x="235" y="50" width="340.0" height="16" rx="2" style="transform-origin:235px 0"/><text class="val " x="582.0" y="63">100%</text></g><g class="row"><title>Remember a past value, + simulator: 100% correct (n=40), 95% CI 100% to 100%</title><rect class="bar key grow-x" x="235" y="70" width="340.0" height="16" rx="2" style="transform-origin:235px 0"/><text class="val key" x="582.0" y="83">100%</text></g><text class="lab key" x="223" y="147.0" text-anchor="end">Find when something happened</text><g class="row"><title>Find when something happened, snapshot only: 3% correct (n=30), 95% CI 0% to 10%</title><rect class="bar base grow-x" x="235" y="114" width="11.3" height="16" rx="2" style="transform-origin:235px 0"/><text class="val " x="253.3" y="127">3%</text></g><g class="row"><title>Find when something happened, + git history: 93% correct (n=30), 95% CI 83% to 100%</title><rect class="bar mid grow-x" x="235" y="134" width="317.3" height="16" rx="2" style="transform-origin:235px 0"/><text class="val " x="559.3" y="147">93%</text></g><g class="row"><title>Find when something happened, + simulator: 90% correct (n=30), 95% CI 80% to 100%</title><rect class="bar key grow-x" x="235" y="154" width="306.0" height="16" rx="2" style="transform-origin:235px 0"/><text class="val key" x="548.0" y="167">90%</text></g><text class="lab key" x="223" y="231.0" text-anchor="end">Predict the future</text><g class="row"><title>Predict the future, snapshot only: 12% correct (n=40), 95% CI 2% to 22%</title><rect class="bar base grow-x" x="235" y="198" width="42.5" height="16" rx="2" style="transform-origin:235px 0"/><text class="val " x="284.5" y="211">12%</text></g><g class="row"><title>Predict the future, + git history: 35% correct (n=40), 95% CI 20% to 50%</title><rect class="bar mid grow-x" x="235" y="218" width="119.0" height="16" rx="2" style="transform-origin:235px 0"/><text class="val " x="361.0" y="231">35%</text></g><g class="row"><title>Predict the future, + simulator: 98% correct (n=40), 95% CI 92% to 100%</title><rect class="bar key grow-x" x="235" y="238" width="331.5" height="16" rx="2" style="transform-origin:235px 0"/><text class="val key" x="573.5" y="251">98%</text></g><text class="lab key" x="223" y="315.0" text-anchor="end">Undo a past decision</text><g class="row"><title>Undo a past decision, snapshot only: 16% correct (n=32), 95% CI 3% to 28%</title><rect class="bar base grow-x" x="235" y="282" width="53.1" height="16" rx="2" style="transform-origin:235px 0"/><text class="val " x="295.1" y="295">16%</text></g><g class="row"><title>Undo a past decision, + git history: 13% correct (n=30), 95% CI 3% to 27%</title><rect class="bar mid grow-x" x="235" y="302" width="45.3" height="16" rx="2" style="transform-origin:235px 0"/><text class="val " x="287.3" y="315">13%</text></g><g class="row"><title>Undo a past decision, + simulator: 97% correct (n=32), 95% CI 91% to 100%</title><rect class="bar key grow-x" x="235" y="322" width="329.4" height="16" rx="2" style="transform-origin:235px 0"/><text class="val key" x="571.4" y="335">97%</text></g><text class="lab key" x="223" y="399.0" text-anchor="end">Choose between interventions</text><g class="row"><title>Choose between interventions, snapshot only: 80% correct (n=10), 95% CI 50% to 100%</title><rect class="bar base grow-x" x="235" y="366" width="272.0" height="16" rx="2" style="transform-origin:235px 0"/><text class="val " x="514.0" y="379">80%</text></g><g class="row"><title>Choose between interventions, + git history: 80% correct (n=10), 95% CI 50% to 100%</title><rect class="bar mid grow-x" x="235" y="386" width="272.0" height="16" rx="2" style="transform-origin:235px 0"/><text class="val " x="514.0" y="399">80%</text></g><g class="row"><title>Choose between interventions, + simulator: 100% correct (n=10), 95% CI 100% to 100%</title><rect class="bar key grow-x" x="235" y="406" width="340.0" height="16" rx="2" style="transform-origin:235px 0"/><text class="val key" x="582.0" y="419">100%</text></g></svg></figure>
```
<!-- /fig:twins -->

Accuracy rose from 13% to 63% to 97%. Most of this increase follows from the setup, since a snapshot does not contain past values and an exact simulator predicts its own world.

The behaviour on the what-if questions does not follow from the setup. Asked what would be true today had the council not ordered rationing in week 48, the agent checked out the world as it was the week before, removed the decision from `policies.json`, ran the simulator forward to the present and reported the result. It did so in 26 of 32 such questions without being told how.

## When the twin is wrong

A real twin does not match its asset, so in a second set of 80 worlds I made the simulator and the world disagree. Reality runs the simulator's equations with every parameter changed by up to 6% and adds one process that the simulator does not model. In the city this is a slow reservoir leak, higher household water use, a plant that delivers less than its setting, or demand that responds more strongly to heat; in the forest it is a deer disease, poorer soil, unrecorded poaching, or wolves arriving from outside. The weather file holds the observed weather up to the present and a forecast after it, and the real weather departs from the forecast. Git records what actually happened, and the simulator's parameters are stored in `model/params.json`.

To keep the questions hard, I kept a forecasting question only if three simple answers were all wrong (the current value, the recent trend extended, and the shipped simulator's prediction) and a simulator with the true parameters got it right. I asked the 109 resulting questions of three agents: Codex on gpt-5-mini, Codex on gpt-6.2-sol, and Claude Code on Claude Opus 5.5.

| What the folder contains | gpt-5-mini | gpt-6.2-sol | Opus 5.5 |
|---|---|---|---|
| Current files only | 8% | 9% | 18% |
| Current files and git history | 16% | 85% | 89% |
| History, simulator and a `./sim backtest` command | 2% | 93% | 97% |
| The same, plus one paragraph in `RULES.md` asking for calibration | 31% | 99% | 100% |
| A simulator with the true parameters | 94% | 98% | 99% |

The backtest command replays the simulator over the recorded past and reports where it departs from the measurements. Given that command, gpt-5-mini ran it once in 109 questions and mostly reported what the uncorrected simulator predicted. Opus 5.5 ran it in all 109, and in 107 it went on to change the parameters until the replay matched the record. With the written procedure in `RULES.md` it recalibrated in all 109 and answered every question correctly. For gpt-5-mini the paragraph raised the recalibration rate from 22 of 192 runs to 94 of 189 and its accuracy to 31%. gpt-6.2-sol ran the backtest in 104 of 109 questions without being asked and in all 109 with the paragraph, and ended close to Opus 5.5 in every row. Both larger models did worst with history alone on questions about when something will first happen, 71% for gpt-6.2-sol and 81% for Opus 5.5.

With only the history and no simulator, Opus 5.5 still answered 89% of the questions. In 107 of the 109 runs it read the description of the rules in `RULES.md`, extracted every recorded week from git, wrote its own simulator in Python, fitted that simulator's parameters to the record with a least-squares fit, and forecast with it. I checked the runs for leaks: none of them read anything outside its own folder. Measured in pairs on the same questions, the written procedure beat history alone by 11 points (95% confidence interval +6 to +17), and the backtest command alone beat history by 8 points (+3 to +15).

## A real reservoir

The simulated worlds follow rules that I wrote, and the simulator always has the right form. To see how far this carries to a real asset, I built the same kind of folder for eight large reservoirs in California (Folsom, Oroville, Shasta, New Melones, Don Pedro, New Bullards Bar, Pine Flat and Trinity), using the daily storage, inflow and release that the California Data Exchange Center publishes. For each of 96 dates between January 2025 and October 2026, the folder holds the reservoir as it was on that date: two years of daily readings as one commit per day, a separate commit whenever the release changed by more than a quarter, the operators' release plan for the next 14 days, and, in one condition, a water-balance simulator whose inflow assumption is a parameter. The question is what the storage will be 14 days later. The release plan is given; the inflow is not, and depends on rain, snowmelt and upstream operations.

| 14-day storage forecast, 96 dates | Median error |
|---|---|
| Storage unchanged | 45,600 acre-feet |
| Inflow held at today's value | 12,600 |
| Inflow as in the same weeks last year | 14,400 |
| Opus 5.5, current files only | 9,100 |
| Opus 5.5, with git history | 8,200 |
| Opus 5.5, with history, simulator and procedure | 7,500 |
| Balance with the true future inflow (the best possible with this model) | 1,200 |

The agent beat every simple forecast, but the history and the simulator did little for it. Measured on the same dates, history lowered the median error by 400 acre-feet (95% confidence interval from 1,300 lower to 500 higher), and the simulator with its procedure by another 200, both within the noise. In the runs with history, the agent looked at the same season in earlier years in only 3 of 96 cases and otherwise worked from the last few weeks. On a real asset, the part of the future that matters here is the weather, and two years of the reservoir's own readings say little about it.

## Git or a memory system?

Git is not the only way to keep a history. To compare it with memory systems built for agents, I fed the same stream of changes, one record per commit, into two stores for each of the 40 perfect-twin worlds: a vector store that keeps every record verbatim and retrieves by similarity, and mem0, which extracts facts from each record and updates them as new records arrive. The agent (Opus 5.5) got the current files and a `./memory search` command in place of the git history, and answered the 70 questions about the past: recalling a past value and finding when something first happened.

All three answered all 70 correctly, so I wrote 137 harder questions for the same worlds: which value a policy had during a past step, in how many steps of a 20-step window a quantity went up, at which step of a window it peaked, and what a quantity would be today had a past decision not been made. The last kind needs the exact state at the time of the decision, fed into the simulator. All three conditions had the simulator, and the memory conditions also had `./memory all`, which lists every entry the way mem0's own API does. Git, the vector store and mem0 again answered every question correctly. The agents with a memory store listed all of it in every run, and since each world has 67 steps, it fit in context. mem0 had stored the full state of each step together with the step number, so the agent could rebuild the files from text and run the simulator from them.

Accuracy therefore does not decide between them, and the cost of getting there does. When the state of a world is kept as files in git, the history is written by every commit and needs nothing else. The memory stores needed a pipeline of their own: a language model call to extract facts from every record, an embedding model, a vector database, and a search command for the agent. The agent with git also spent less per question, because it read the commits it needed instead of the whole store.

| | Git history | Vector store | mem0 |
|---|---|---|---|
| Correct, 207 questions | 207 | 207 | 207 |
| Written by | every commit | an ingest pipeline | an ingest pipeline |
| Extra services | none | embedding model, vector database | language model for fact extraction, embedding model, vector database |
| How the agent reads it | `git log`, `git show` | `./memory search` or `all` | `./memory search` or `all` |
| Cost per question* | $0.068 | $0.107 | $0.119 |
| Input tokens per question* | 75,000 | 120,000 | 121,000 |

\*Averages over the 137 harder questions, Claude Opus 5.5.

For a world kept in a folder, an agent does not need a separate memory system.

## What agents actually use

With gpt-5-mini, the agents acted on what was placed in front of them and left alone what was only available: a backtest command that was run in 1 of 109 questions, a semantic search tool that was installed in 260 runs on real GitHub issues and called in none, and recommendations offered as a tool that were called in 1 to 4% of runs. Opus 5.5 explored the folder on its own, ran the backtest every time it was available, and wrote a simulator when none was provided. Written procedures in the folder helped both models, but they mattered much more for the smaller one.

## And on code

I started with code because a repository is already a world stored in a folder, and ran three benchmarks on public GitHub projects. Two results carry over to twins.

An agent without access to history does not say that it cannot know the past. Asked about earlier values, it gave the current value in 30 to 46% of answers, and in 0 to 8% once it could read the history.

When the same bug had been reported twice, showing the agent the files that an earlier agent had used on the first report raised accuracy by 4 to 10 points, whereas embeddings and commit-message search did no better than grep. Problems with physical assets also recur, so a record of what earlier runs consulted is worth keeping in the folder.

## Further work

Three directions look most interesting to me next.

The first is other questions about a real asset. The reservoir study asked for a two-week storage forecast, where the weather decides most of the answer. Questions such as what led up to an alarm, or what a different release schedule would have done, lean more on the history and on running the simulator from an earlier state.

The second is long histories. The simulated worlds have 67 steps, few enough for an agent to read every record. A plant that logs every minute for years cannot be read in one go, and comparing git's exact addressing with similarity search at that scale is the natural next test for the memory question.

The third is simulators with the wrong equations. In my worlds the simulator always had the right form and only its numbers were off. For a real asset the equations are also partly wrong, and I would like to see whether an agent can find and rewrite the part of the model that does not fit the record.

*Measurement: all runs in isolated E2B sandboxes. Simulated worlds: 454 Codex (gpt-5-mini) runs on 40 idealized worlds and about 1,150 on 80 realistic ones; 545 Claude Code (Claude Opus 5.5) runs and 545 Codex (gpt-6.2-sol) runs on the 109 realistic forecasting questions. Memory comparison: 621 Opus 5.5 runs, with stores built from the same commits using text-embedding-3-small and mem0 (gpt-4.1-mini for extraction). Reservoirs: 287 Opus 5.5 runs on 96 dates from CDEC data, January 2025 to October 2026; one run returned no answer. Code: 4,076 runs of Claude Code (Claude Haiku 5.5, Claude Sonnet 5.5) and Codex on real GitHub repositories. Confidence intervals are 95% intervals from a paired bootstrap over questions. The realistic forecasting questions were filtered to be hard, so those percentages describe hard cases.*
