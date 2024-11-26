<script lang="ts">
	import { onMount } from "svelte";
  import { getModalStore, getToastStore } from '@skeletonlabs/skeleton';
  import { isValidURL } from '$lib/validation'

  interface Setting {
    apiUrl: string;
    token: string;
    instruction: string;
    model: string
  }

  const modalStore = getModalStore();
  const toastStore = getToastStore();

  let setting: Setting = {
    apiUrl: '',
    token: '',
    instruction: '',
    model: ''
  }

  let errors = {
    apiUrl: '',
    token: '',
    instruction: '',
    model: ''
  }

  function onSave(){
    let isSub = true;

    if(setting.apiUrl === ''){
      errors.apiUrl = '接口地址不能为空'
      isSub = false;
    }

    if(setting.token === ''){
      errors.token = 'token不能为空'
      isSub = false;
    }

    if(setting.model === ''){
      errors.model = '模型不能为空'
      isSub = false;
    }

    if(!isSub){
      return;
    }

    if(typeof chrome.runtime !== 'undefined'){
      chrome.storage.local.set({"setting": setting});
    } else {
      localStorage.setItem("setting", JSON.stringify(setting))
    }
    toastStore.trigger({
        message: '保存成功',
        hideDismiss: true,
	      timeout: 2000,
        background: 'variant-filled-success',
    });
  }

  function loadSetting(){
    if(typeof chrome.runtime !== 'undefined'){
      chrome.storage.local.get("setting", (result) => {
        if(result.setting){
          setting = result.setting
        }
      });
    } else {
      if(localStorage.getItem("setting")){
        setting = JSON.parse(localStorage.getItem("setting"))
      }
    }
  }

  onMount(() => {
    loadSetting()
  })
</script>

<svelte:head>
  <title>ChatEase</title>
</svelte:head>
<div class="p-5">
  <div class="mt-10 grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-6">
    <div class="sm:col-span-12">
      <label class="label">
        <span>接口地址</span>
        <input class="input" type="text" bind:value={setting.apiUrl} placeholder="请输入接口地址" />
        {#if errors.apiUrl}
					<p class="text-red-700 text-sm">{errors.apiUrl}</p>
				{/if}
      </label>
    </div>
    <div class="sm:col-span-12">
      <label class="label">
        <span>token</span>
        <input class="input" type="text" bind:value={setting.token} placeholder="请输入token" />
        {#if errors.token}
					<p class="text-red-700 text-sm">{errors.token}</p>
				{/if}
      </label>
    </div>
    <div class="sm:col-span-12">
      <label class="label">
        <span>模型</span>
        <input class="input" type="text" bind:value={setting.model} placeholder="请输入模型名" />
        {#if errors.model}
					<p class="text-red-700 text-sm">{errors.model}</p>
				{/if}
      </label>
    </div>
    <div class="sm:col-span-12">
      <label class="label">
        <span>指令</span>
        <textarea class="textarea" rows="4" bind:value={setting.instruction} placeholder="请入指令" />
        {#if errors.instruction}
					<p class="text-red-700 text-sm">{errors.instruction}</p>
				{/if}
      </label>
    </div>
  </div>
  <div class="flex mt-10 gap-2">
		<button on:click={onSave} class="rounded-md w-full btn variant-filled-tertiary">应用</button>
    </div>
</div>
