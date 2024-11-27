<script lang="ts">
    import markdownit from 'markdown-it'
	  import hljs from 'highlight.js'
    import 'highlight.js/styles/default.css'
    import 'highlight.js/styles/dark.min.css'

    export let content;
    let markdownContainer;
    
    const md = markdownit({
		html: true,
		highlight: function (str, lang) {
			if (lang && hljs.getLanguage(lang)) {
              try {
                return '<pre><code class="hljs">' +
                       hljs.highlight(str, { language: lang, ignoreIllegals: true }).value +
                       '</code></pre>';
              } catch (__) {}
            }
            return '<pre><code class="hljs">' + md.utils.escapeHtml(str) + '</code></pre>';
		}
	})

    $: renderedMarkdown = md.render(content)
</script>
<div class="markdown-content" bind:this={markdownContainer}>
{@html renderedMarkdown}
</div>