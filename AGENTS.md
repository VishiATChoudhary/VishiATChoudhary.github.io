# Agent instructions for this repo

This repo is Vishisht's personal site, served by GitHub Pages at https://vishi.dev.

## Publishing blog posts

Every blog post goes on the main page (`index.html`, the Writing section) once Vishisht says it is completed.
Until then it stays a draft: do not build it into `notes/`, add it to `index.html`, commit it or push it.

When Vishisht says a post is completed ("it's done", "publish", "push this"):

1. Put the post in `reports/<Title>.md`. The first line is `# <Title>`.
2. Run `./build.sh`. It renders every `reports/*.md` to `notes/<slug>.html`.
3. Add an entry at the top of the Writing list in `index.html`, newest first, in the same form as the existing entries:
   ```html
   <li class="entry">
     <span class="year">YYYY</span>
     <div class="body">
       <a class="entry-title" href="notes/<slug>.html">Title</a>
       <p class="entry-note">One or two sentences on what the post finds.</p>
     </div>
   </li>
   ```
4. Commit only the post, its built page, `index.html` and any assets it needs, then push to `main`.
5. Check that the post is live on https://vishi.dev (Pages takes a minute or two to deploy).

When a published post changes, rebuild, check that its `index.html` entry still describes it, and push again.

## Do not commit

`drafts/`, `spike/`, `experiments/`, `research_notes/` and `assets/fs-bench/` are local working files. Do not commit them unless Vishisht asks.

## Writing style

No em dashes. No AI-sounding aphorisms, summary sentences or signposts. Personal-site posts are written with "I"; posts for the Invertix site use "we" and "our".
