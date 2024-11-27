<script lang="ts">
	import { faker } from '@faker-js/faker';
	import { onMount } from 'svelte';
	import { Avatar, CodeBlock } from '@skeletonlabs/skeleton';
	import { browser } from '$app/environment';
	import markdownit from 'markdown-it'
	import hljs from 'highlight.js'

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

	interface ChatMessage {
		role: string;
		content: string;
		type: string;
	}

	interface Setting {
		apiUrl: string;
		token: string;
		instruction: string;
		model: string
	}
	
	interface MessageFeed {
		id: number;
		host: boolean;
		avatar: number;
		name: string;
		timestamp: string;
		message: string;
		color: string;
	}

	let elemChat: HTMLElement;
	let pending: boolean = false;
	const lorem = faker.lorem.paragraph();

	// Messages
	let messageFeed: MessageFeed[] = [
	];
	let currentMessage = '';

	// For some reason, eslint thinks ScrollBehavior is undefined...
	// eslint-disable-next-line no-undef
	function scrollChatBottom(behavior?: ScrollBehavior): void {
		elemChat.scrollTo({ top: elemChat.scrollHeight, behavior });
	}

	function getCurrentTimestamp(): string {
		return new Date().toLocaleString('zh-CN', { hour: 'numeric', minute: 'numeric', hour12: true });
	}

	async function loadChatHistory(){
		const messages = await getChatHistory();
		if(messages){
			messages.forEach(m => addMessage(m))
		}
	}

	function addMessage(message: ChatMessage): void {
		const newMessage = {
			id: messageFeed.length,
			host: message.type === "ai",
			avatar: message.type === "ai" ? 48 : 14,
			name: message.type === "ai" ? 'GPT' : 'User',
			timestamp: `Today @ ${getCurrentTimestamp()}`,
			message: md.render(message.content),
			color: 'variant-soft-primary'
		};
		// Update the message feed
		messageFeed = [...messageFeed, newMessage];
		// Smooth scroll to bottom
		// Timeout prevents race condition
		setTimeout(() => {
			scrollChatBottom('smooth');
		}, 0);

	}

	function onSend(){
		sendMessage(currentMessage)
	}

	async function sendMessage(message: string){
		const userChatMessage = {role: "user", content: message, type: "user"}
		addMessage(userChatMessage)
		// Clear prompt
		currentMessage = '';
		pending = true
		const assistantChatMessage: ChatMessage = await postMessage(userChatMessage)
		if(assistantChatMessage){
			addMessage(assistantChatMessage);
		}
		pending = false
	}

	function onPromptKeydown(event: KeyboardEvent): void {
		if (event.keyCode === 13 && (event.ctrlKey || event.altKey)) {
			event.preventDefault();
			event.target.value += "\n";
		} else if (event.keyCode === 13) {
			event.preventDefault();
			sendMessage();
		}
	}

	async function postMessage(chatMessage: ChatMessage): Promise<ChatMessage> {
		const chatMessages: ChatMessage[] = await getChatHistory() || [];
		chatMessages.push(chatMessage);
		const messages = chatMessages.map(e => {return {role: e.role, content: e.content}})
		const completion = await chatCompletion(messages);
		if(completion){
			const replyChatMessage: ChatMessage = {role: "assistant", content: completion, type: "ai"}
			storeChatMessage(chatMessage, replyChatMessage)
			return replyChatMessage;
		}
	}

	async function getChatHistory(): Promise<ChatMessage[]> {
		if(!isExtensionEnv()){
			const dataStr = localStorage.getItem("chat_history")
			if(dataStr){
				return JSON.parse(dataStr);
			}
			return null;
		}
		const store = await chrome.storage.local.get("chat_history")
		return store.chat_history
	}

	async function storeChatMessage(userMessage: ChatMessage, aiMessage: ChatMessage): Promise<void> {
		const chatMessages: ChatMessage[] = await getChatHistory() || [];
		chatMessages.push(userMessage);
		chatMessages.push(aiMessage);

		if(!isExtensionEnv()){
			localStorage.setItem("chat_history", JSON.stringify(chatMessages));
		} else {
			chrome.storage.local.set({"chat_history": chatMessages})
		}
	}

	/**
	 * 获取ChatGPT回复
	 * @return [statusCode, message]
	 */
	async function chatCompletion(messages) {
		if(!messages || messages.length == 0){
			console.log("没有发送的内容")
		}
		const setting = await getSetting();

		const apiUrl = setting.apiUrl || '';
		if(apiUrl === ''){
			console.log("API没有设置地址")
		}

		const postHeaders = {
			"Content-Type": "application/json",
		}

		const tokenValue = setting.token || '';
		if(tokenValue != ''){
			postHeaders['api-key'] = tokenValue;
		}

		const response = await fetch(apiUrl, {
			method: "POST",
			headers: postHeaders,
			body: JSON.stringify({
				"messages": messages,
				"temperature": 0.7,
				"max_tokens": 1000
			})
		});


		if (!response.ok) {
			console.log("failed to call chatComplete")
			return
		}

		const responseObj = await response.json();
		const result = responseObj.choices[0].message.content;
		return result;
	}

	async function getSetting(): Promise<Setting>{
		if(typeof chrome.runtime !== 'undefined'){
			const store = await chrome.storage.local.get("setting");
			return store.setting
		}
		if(localStorage.getItem("setting")){
			return JSON.parse(localStorage.getItem("setting"))
		}
	}

	function isExtensionEnv(){
		return typeof chrome.runtime !== 'undefined';
	}

	// When DOM mounted, scroll to bottom
	onMount(() => {
		loadChatHistory();
		scrollChatBottom();
	});
</script>

<svelte:head>
  <title>ChatEase</title>
</svelte:head>
<div class="chat w-full h-screen grid grid-cols-1 lg:grid-cols-[30%_1fr]">
  <!-- Chat -->
  <div class="grid grid-row-[1fr_auto]">
    <!-- Conversation -->
    <section bind:this={elemChat} class="h-full p-4 overflow-y-auto space-y-4 pb-[100px]">
      {#each messageFeed as bubble}
        {#if bubble.host === true}
          <div class="grid grid-cols-[auto_1fr] gap-2">
            <!-- <Avatar src="https://i.pravatar.cc/?img={bubble.avatar}" width="w-12" /> -->
            <div class="card p-4 variant-soft rounded-tl-none space-y-2">
              <header class="flex justify-between items-center">
                <p class="font-bold">{bubble.name}</p>
                <small class="opacity-50">{bubble.timestamp}</small>
              </header>
              <p>{@html bubble.message}</p>
            </div>
          </div>
        {:else}
          <div class="grid grid-cols-[1fr_auto] gap-2">
            <div class="card p-4 rounded-tr-none space-y-2 {bubble.color}">
              <header class="flex justify-between items-center">
                <p class="font-bold">{bubble.name}</p>
                <small class="opacity-50">{bubble.timestamp}</small>
              </header>
              <p>{@html bubble.message}</p>
            </div>
            <!-- <Avatar src="https://i.pravatar.cc/?img={bubble.avatar}" width="w-12" /> -->
          </div>
        {/if}
      {/each}
    </section>
    <!-- Prompt -->
    <section class="border-t border-surface-500/30 p-4 fixed bottom-0 left-0">
      <div class="input-group input-group-divider grid-cols-[auto_1fr_auto] rounded-container-token">
        <button class="input-group-shim">+</button>
        <textarea
          bind:value={currentMessage}
          class="bg-transparent border-0 ring-0"
          name="prompt"
          id="prompt"
          placeholder="有问题尽管问我~"
          rows="1"
          on:keydown={onPromptKeydown}
        ></textarea>
        <button class={currentMessage ? 'variant-filled-primary' : 'input-group-shim'} on:click={onSend}>
			<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="size-6">
				<path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" />
			  </svg>			  
        </button>
      </div>
    </section>
  </div>
</div>