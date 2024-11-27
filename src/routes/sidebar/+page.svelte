<script lang="ts">
	import { faker } from '@faker-js/faker';
	import { onMount } from 'svelte';
	import { Avatar, CodeBlock } from '@skeletonlabs/skeleton';
	import MarkdownRenderer from '$lib/markdown/MarkdownRenderer.svelte';

	interface ChatMessage {
		role: string;
		content: string;
		type: string;
		timestamp: string;
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
	let promptInput: HTMLElement;
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
		scrollChatBottom();
	}

	function addMessage(message: ChatMessage): void {
		const newMessage = {
			id: messageFeed.length,
			host: message.type === "ai",
			avatar: message.type === "ai" ? 48 : 14,
			name: message.type === "ai" ? 'GPT' : 'User',
			timestamp: message.timestamp,
			message: message.content,
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

	function onClear(){
		chrome.storage.local.remove("chat_history", () => {
			messageFeed = [];
		})
	}

	function adjustHeight() {
		promptInput.style.height = 'auto';
		promptInput.style.height = promptInput.scrollHeight + 'px';
	}

	function handleInput() {
		adjustHeight();
	}


	async function sendMessage(message: string){
		const userChatMessage: ChatMessage = {role: "user", content: message, type: "user", timestamp: getCurrentTimestamp()}
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
			adjustHeight();
		} else if (event.keyCode === 13) {
			event.preventDefault();
			sendMessage(currentMessage);
		}
	}

	async function postMessage(chatMessage: ChatMessage): Promise<ChatMessage> {
		const chatMessages: ChatMessage[] = await getChatHistory() || [];
		const setting = await getSetting();
		
		let messages = [];
		
		// instruction
		if(setting.instruction && setting.instruction.trim() !== ''){
			messages.push({role: "system", content: setting.instruction});
		}
		
		// history
		chatMessages.forEach(e => {messages.push({role: e.role, content: e.content})})
		
		// user prompt
		messages.push({role: chatMessage.role, content: chatMessage.content})

		const completion = await chatCompletion(messages);
		if(completion){
			const replyChatMessage: ChatMessage = {role: "assistant", content: completion, type: "ai", timestamp: getCurrentTimestamp()}
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
			postHeaders['Authorization'] = `Bearea ${tokenValue}`;
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
	});
</script>

<svelte:head>
  <title>ChatEase</title>
</svelte:head>
<div class="chat w-full h-screen grid grid-cols-1 lg:grid-cols-[30%_1fr]">
  <div class="text-right px-5 py-3"><button class="anchor" on:click={onClear}>清空对话</button></div>
  <hr />
  <!-- Chat -->
  <div class="grid grid-row-[1fr_auto]">
    <!-- Conversation -->
    <section bind:this={elemChat} class="h-[90vh] p-4 overflow-y-auto space-y-4 pb-[100px]">
      {#each messageFeed as bubble}
        {#if bubble.host === true}
          <div class="grid grid-cols-[auto_1fr] gap-2">
            <!-- <Avatar src="https://i.pravatar.cc/?img={bubble.avatar}" width="w-12" /> -->
			<div class="w-[24px] h-[24px]">
				<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="currentColor" xmlns="http://www.w3.org/2000/svg" color="inherit" class="eyeqlp52 st-emotion-cache-1pbsqtx ex0cdmw0"><rect width="24" height="24" fill="none"></rect><path d="M20 9V7c0-1.1-.9-2-2-2h-3c0-1.66-1.34-3-3-3S9 3.34 9 5H6c-1.1 0-2 .9-2 2v2c-1.66 0-3 1.34-3 3s1.34 3 3 3v4c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2v-4c1.66 0 3-1.34 3-3s-1.34-3-3-3zm-2 10H6V7h12v12zm-9-6c-.83 0-1.5-.67-1.5-1.5S8.17 10 9 10s1.5.67 1.5 1.5S9.83 13 9 13zm7.5-1.5c0 .83-.67 1.5-1.5 1.5s-1.5-.67-1.5-1.5.67-1.5 1.5-1.5 1.5.67 1.5 1.5zM8 15h8v2H8v-2z"></path></svg>
			</div>
            <div class="card p-4 variant-soft rounded-tl-none space-y-2">
              <header class="flex justify-between items-center">
                <!-- <p class="font-bold">{bubble.name}</p> -->
                <small class="opacity-50">{bubble.timestamp}</small>
              </header>
              <p><MarkdownRenderer content={bubble.message} /></p>
            </div>
          </div>
        {:else}
          <div class="grid grid-cols-[1fr_auto] gap-2">
            <div class="card p-4 rounded-tr-none space-y-2 {bubble.color}">
              <header class="flex justify-between items-center">
                <!-- <p class="font-bold">{bubble.name}</p> -->
                <small class="opacity-50">{bubble.timestamp}</small>
              </header>
              <p><MarkdownRenderer content={bubble.message} /></p>
            </div>
            <!-- <Avatar src="https://i.pravatar.cc/?img={bubble.avatar}" width="w-12" /> -->
			<div class="w-[24px] h-[24px]">
				<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="currentColor" xmlns="http://www.w3.org/2000/svg" color="inherit" class="eyeqlp52 st-emotion-cache-1pbsqtx ex0cdmw0"><path fill="none" d="M0 0h24v24H0V0z"></path><path d="M10.25 13a1.25 1.25 0 11-2.5 0 1.25 1.25 0 012.5 0zM15 11.75a1.25 1.25 0 100 2.5 1.25 1.25 0 000-2.5zm7 .25c0 5.52-4.48 10-10 10S2 17.52 2 12 6.48 2 12 2s10 4.48 10 10zM10.66 4.12C12.06 6.44 14.6 8 17.5 8c.46 0 .91-.05 1.34-.12C17.44 5.56 14.9 4 12 4c-.46 0-.91.05-1.34.12zM4.42 9.47a8.046 8.046 0 003.66-4.44 8.046 8.046 0 00-3.66 4.44zM20 12c0-.78-.12-1.53-.33-2.24-.7.15-1.42.24-2.17.24a10 10 0 01-7.76-3.69A10.016 10.016 0 014 11.86c.01.04 0 .09 0 .14 0 4.41 3.59 8 8 8s8-3.59 8-8z"></path></svg>
			</div>
          </div>
        {/if}
      {/each}
    </section>
    <!-- Prompt -->
    <section class="border-t border-surface-500/30 p-4 fixed bottom-0 left-0 w-full">
      <div class="input-group input-group-divider grid-cols-[auto_1fr_auto] rounded-container-token w-full">
        <button class="input-group-shim">+</button>
        <textarea
		  bind:this={promptInput}
          bind:value={currentMessage}
          class="bg-transparent border-0 ring-0"
          placeholder="有问题尽管问我~"
          rows="1"
		  on:input={handleInput}
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