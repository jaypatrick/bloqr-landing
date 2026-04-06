<script>
  import { onMount } from 'svelte';
  import { LINKS } from '../config';

  let copied = $state(false);
  let copyTimeout;

  const code = `// Install: deno add @jk-com/adblock-compiler
import {
  FilterCompiler,
  TransformationType,
} from "@jk-com/adblock-compiler";

const compiler = new FilterCompiler();

const result = await compiler.compile({
  name: "My Privacy List",
  sources: [
    {
      source: "https://easylist.to/easylist/easylist.txt",
      type: "adblock",
    },
    {
      source: "https://someonewhocares.org/hosts/hosts",
      type: "hosts",
    },
  ],
  transformations: [
    TransformationType.RemoveComments,
    TransformationType.Deduplicate,
    TransformationType.Validate,
    TransformationType.Compress,
  ],
});

console.log(\`Compiled \${result.rules.length} rules\`);
// → Compiled 87,432 rules`;

  function handleCopy() {
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(code).then(() => {
        copied = true;
        clearTimeout(copyTimeout);
        copyTimeout = setTimeout(() => { copied = false; }, 2000);
      });
    }
  }

  // Simple syntax highlighter — returns HTML string
  function highlight(src) {
    return src
      // Comments
      .replace(/(\/\/[^\n]*)/g, '<span class="c">$1</span>')
      // Strings
      .replace(/("(?:[^"\\]|\\.)*")/g, '<span class="s">$1</span>')
      // Keywords
      .replace(/\b(import|from|const|await|new)\b/g, '<span class="kw">$1</span>')
      // Types
      .replace(/\b(FilterCompiler|TransformationType)\b/g, '<span class="t">$1</span>')
      // Enum members (after the dot)
      .replace(/\.(RemoveComments|Deduplicate|Validate|Compress|ConvertToAscii|TrimLines|InvertAllow)\b/g, '.<span class="en">$1</span>')
      // template literal variable
      .replace(/(\$\{[^}]+\})/g, '<span class="tmpl">$1</span>');
  }
</script>

<section class="demo" id="start">
  <div class="container">
    <div class="inner">

      <!-- Left: content -->
      <div class="content">
        <p class="section-label">Get started</p>
        <h2 class="section-title">Up and running<br />in minutes.</h2>
        <p class="section-desc">
          Install from JSR, configure your sources, and compile. Or deploy the
          full Worker and call it over HTTP. Either way, you're done before your
          VPN subscription renews.
        </p>

        <div class="links">
          <a href={LINKS.docs} class="btn btn-primary">
            View full docs <span aria-hidden="true">→</span>
          </a>
          <a
            href={LINKS.jsr}
            class="btn btn-outline"
            rel="noopener noreferrer"
            target="_blank"
          >
            JSR package
          </a>
        </div>

        <!-- Runtime badges -->
        <div class="runtimes">
          <span class="runtime-label">Runs on</span>
          <div class="runtime-badges">
            <span class="badge">Deno</span>
            <span class="badge">Node.js</span>
            <span class="badge">Workers</span>
            <span class="badge">Browser</span>
          </div>
        </div>
      </div>

      <!-- Right: code window -->
      <div class="window">
        <div class="titlebar">
          <div class="dots" aria-hidden="true">
            <span class="dot red"></span>
            <span class="dot yellow"></span>
            <span class="dot green"></span>
          </div>
          <span class="filename">example.ts</span>
          <button
            class="copy-btn"
            onclick={handleCopy}
            aria-label={copied ? 'Copied!' : 'Copy code'}
          >
            {#if copied}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              Copied
            {:else}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
              </svg>
              Copy
            {/if}
          </button>
        </div>
        <pre class="code" aria-label="TypeScript example code"><!-- eslint-disable-next-line svelte/no-at-html-tags -->{@html highlight(code)}</pre>
      </div>

    </div>
  </div>
</section>

<style>
  .demo {
    padding: 80px 0;
    border-top: 1px solid var(--border);
  }

  .inner {
    display: grid;
    grid-template-columns: 1fr 1.3fr;
    gap: 64px;
    align-items: center;
  }

  @media (max-width: 900px) {
    .inner { grid-template-columns: 1fr; gap: 40px; }
  }

  .content .section-desc { margin-bottom: 32px; }

  .links {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
    margin-bottom: 32px;
  }

  .runtimes {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
  }

  .runtime-label {
    font-size: 12px;
    color: var(--text-3);
    letter-spacing: 0.08em;
    text-transform: uppercase;
    font-weight: 600;
  }

  .runtime-badges {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }

  .badge {
    padding: 4px 10px;
    border-radius: 9999px;
    font-size: 11px;
    font-weight: 600;
    background: var(--bg-surface);
    border: 1px solid var(--border);
    color: var(--text-2);
    font-family: var(--font-mono);
    letter-spacing: 0.04em;
  }

  /* Code window */
  .window {
    background: var(--bg-base);
    border: 1px solid var(--border);
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 20px 64px rgba(0, 0, 0, 0.5);
  }

  .titlebar {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 20px;
    background: var(--bg-surface);
    border-bottom: 1px solid var(--border);
  }

  .dots { display: flex; gap: 6px; }

  .dot {
    display: block;
    width: 12px; height: 12px;
    border-radius: 50%;
  }

  .red    { background: #FF5F57; }
  .yellow { background: #FEBC2E; }
  .green  { background: #28C840; }

  .filename {
    margin-left: 4px;
    font-family: var(--font-mono);
    font-size: 12px;
    color: var(--text-3);
  }

  .copy-btn {
    margin-left: auto;
    display: flex;
    align-items: center;
    gap: 5px;
    padding: 4px 10px;
    border-radius: 6px;
    font-size: 12px;
    font-weight: 500;
    font-family: var(--font-display);
    color: var(--text-3);
    background: transparent;
    border: 1px solid transparent;
    cursor: pointer;
    transition: color 150ms, border-color 150ms, background 150ms;
  }

  .copy-btn:hover {
    color: var(--text-2);
    border-color: var(--border);
    background: var(--bg-elevated);
  }

  .code {
    display: block;
    padding: 24px;
    font-family: var(--font-mono);
    font-size: 13px;
    line-height: 1.75;
    color: var(--text-2);
    overflow-x: auto;
    white-space: pre;
    margin: 0;
    tab-size: 2;
  }

  /* Syntax colours (applied via {@html}) */
  :global(.c)    { color: #546E7A; }           /* comment */
  :global(.s)    { color: #C3E88D; }           /* string */
  :global(.kw)   { color: #C792EA; }           /* keyword */
  :global(.t)    { color: #00D4FF; }           /* type */
  :global(.en)   { color: #FF5500; }           /* enum member */
  :global(.tmpl) { color: #FFCB6B; }           /* template expr */
</style>
