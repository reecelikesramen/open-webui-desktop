<script lang="ts">
	import { DropdownMenu } from 'bits-ui';
	import { flyAndScale } from '$lib/utils/transitions';
	import { getContext, onMount } from 'svelte';
	import Switch from '$lib/components/common/Switch.svelte';

	import {
		user,
		tools as _tools,
		temporaryChatEnabled,
		MODEL_DOWNLOAD_POOL,
		models,
		mobile
	} from '$lib/stores';

	import Dropdown from '$lib/components/common/Dropdown.svelte';
	import Tooltip from '$lib/components/common/Tooltip.svelte';
	import DocumentArrowUpSolid from '$lib/components/icons/DocumentArrowUpSolid.svelte';
	import ChatBubbleOval from '../icons/ChatBubbleOval.svelte';
	import { goto } from '$app/navigation';
	import Search from '../icons/Search.svelte';
	import { toast } from 'svelte-sonner';
	import { getOllamaVersion, pullModel } from '$lib/apis/ollama';
	import { sanitizeResponseContent, splitStream } from '$lib/utils';
	import Fuse from 'fuse.js';
	import { marked } from 'marked';
	import Check from '../icons/Check.svelte';

	export let onClose: Function;
	export let id = '';
	export let value = '';
	export let selectedModels = [''];

	const i18n = getContext('i18n');
	let show = false;
	let showTemporaryChatControl =
		$user.role === 'user' ? ($user?.permissions?.chat?.temporary ?? true) : true;

	let items = $models.map((model) => ({
		value: model.id,
		label: model.name,
		model: model
	}));

	let selectedModel = '';
	$: selectedModel = items.find((item) => item.value === value) ?? '';
	$: selectedModels = [selectedModel.value];

	let searchValue = '';
	let ollamaVersion = null;

	let selectedModelIdx = 0;

	const fuse = new Fuse(
		items.map((item) => {
			const _item = {
				...item,
				modelName: item.model?.name,
				tags: item.model?.info?.meta?.tags?.map((tag) => tag.name).join(' '),
				desc: item.model?.info?.meta?.description
			};
			return _item;
		}),
		{
			keys: ['value', 'tags', 'modelName'],
			threshold: 0.4
		}
	);

	$: filteredItems = searchValue
		? fuse.search(searchValue).map((e) => {
				return e.item;
			})
		: items;

	const pullModelHandler = async () => {
		const sanitizedModelTag = searchValue.trim().replace(/^ollama\s+(run|pull)\s+/, '');

		console.log($MODEL_DOWNLOAD_POOL);
		if ($MODEL_DOWNLOAD_POOL[sanitizedModelTag]) {
			toast.error(
				$i18n.t(`Model '{{modelTag}}' is already in queue for downloading.`, {
					modelTag: sanitizedModelTag
				})
			);
			return;
		}
		if (Object.keys($MODEL_DOWNLOAD_POOL).length === 3) {
			toast.error(
				$i18n.t('Maximum of 3 models can be downloaded simultaneously. Please try again later.')
			);
			return;
		}

		const [res, controller] = await pullModel(localStorage.token, sanitizedModelTag, '0').catch(
			(error) => {
				toast.error(error);
				return null;
			}
		);

		if (res) {
			const reader = res.body
				.pipeThrough(new TextDecoderStream())
				.pipeThrough(splitStream('\n'))
				.getReader();

			MODEL_DOWNLOAD_POOL.set({
				...$MODEL_DOWNLOAD_POOL,
				[sanitizedModelTag]: {
					...$MODEL_DOWNLOAD_POOL[sanitizedModelTag],
					abortController: controller,
					reader,
					done: false
				}
			});

			while (true) {
				try {
					const { value, done } = await reader.read();
					if (done) break;

					let lines = value.split('\n');

					for (const line of lines) {
						if (line !== '') {
							let data = JSON.parse(line);
							console.log(data);
							if (data.error) {
								throw data.error;
							}
							if (data.detail) {
								throw data.detail;
							}

							if (data.status) {
								if (data.digest) {
									let downloadProgress = 0;
									if (data.completed) {
										downloadProgress = Math.round((data.completed / data.total) * 1000) / 10;
									} else {
										downloadProgress = 100;
									}

									MODEL_DOWNLOAD_POOL.set({
										...$MODEL_DOWNLOAD_POOL,
										[sanitizedModelTag]: {
											...$MODEL_DOWNLOAD_POOL[sanitizedModelTag],
											pullProgress: downloadProgress,
											digest: data.digest
										}
									});
								} else {
									toast.success(data.status);

									MODEL_DOWNLOAD_POOL.set({
										...$MODEL_DOWNLOAD_POOL,
										[sanitizedModelTag]: {
											...$MODEL_DOWNLOAD_POOL[sanitizedModelTag],
											done: data.status === 'success'
										}
									});
								}
							}
						}
					}
				} catch (error) {
					console.log(error);
					if (typeof error !== 'string') {
						error = error.message;
					}

					toast.error(error);
					// opts.callback({ success: false, error, modelName: opts.modelName });
					break;
				}
			}

			if ($MODEL_DOWNLOAD_POOL[sanitizedModelTag].done) {
				toast.success(
					$i18n.t(`Model '{{modelName}}' has been successfully downloaded.`, {
						modelName: sanitizedModelTag
					})
				);

				models.set(await getModels(localStorage.token));
			} else {
				toast.error($i18n.t('Download canceled'));
			}

			delete $MODEL_DOWNLOAD_POOL[sanitizedModelTag];

			MODEL_DOWNLOAD_POOL.set({
				...$MODEL_DOWNLOAD_POOL
			});
		}
	};

	onMount(async () => {
		ollamaVersion = await getOllamaVersion(localStorage.token).catch((error) => false);
	});

	const cancelModelPullHandler = async (model: string) => {
		const { reader, abortController } = $MODEL_DOWNLOAD_POOL[model];
		if (abortController) {
			abortController.abort();
		}
		if (reader) {
			await reader.cancel();
			delete $MODEL_DOWNLOAD_POOL[model];
			MODEL_DOWNLOAD_POOL.set({
				...$MODEL_DOWNLOAD_POOL
			});
			await deleteModel(localStorage.token, model);
			toast.success(`${model} download has been canceled`);
		}
	};
</script>

<Dropdown
	bind:show
	on:change={(e) => {
		if (e.detail === false) {
			onClose();
		}
	}}
>
	<Tooltip content={$i18n.t('Options')}>
		<slot />
	</Tooltip>

	<div slot="content">
		<DropdownMenu.Content
			class="w-full max-w-[300px] rounded-xl px-1 py-1  border-gray-300/30 dark:border-gray-700/50 z-50 bg-white dark:bg-gray-850 dark:text-white shadow"
			sideOffset={15}
			alignOffset={-8}
			side="top"
			align="start"
			transition={flyAndScale}
		>
			<div class="flex items-center gap-2.5 px-3 mt-3.5 mb-3">
				<Search className="size-4" strokeWidth="2.5" />

				<input
					id="model-search-input"
					bind:value={searchValue}
					class="w-full text-sm bg-transparent outline-none"
					placeholder={$i18n.t('Search models')}
					autocomplete="off"
					on:keydown={(e) => {
						if (e.code === 'Enter' && filteredItems.length > 0) {
							value = filteredItems[selectedModelIdx].value;
							show = false;
							return; // dont need to scroll on selection
						} else if (e.code === 'ArrowDown') {
							selectedModelIdx = Math.min(selectedModelIdx + 1, filteredItems.length - 1);
						} else if (e.code === 'ArrowUp') {
							selectedModelIdx = Math.max(selectedModelIdx - 1, 0);
						} else {
							// if the user types something, reset to the top selection.
							selectedModelIdx = 0;
						}
						const item = document.querySelector(`[data-arrow-selected="true"]`);
						item?.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'instant' });
					}}
				/>
			</div>

			<hr class="border-gray-50 dark:border-gray-800" />

			<div class="px-3 my-2 max-h-[6.75rem] overflow-y-auto scrollbar-hidden group">
				{#each filteredItems as item, index}
					<button
						aria-label="model-item"
						class="flex w-full text-left font-medium line-clamp-1 select-none items-center rounded-button py-2 pl-3 pr-1.5 text-sm text-gray-700 dark:text-gray-100 outline-none transition-all duration-75 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg cursor-pointer data-[highlighted]:bg-muted {index ===
						selectedModelIdx
							? 'bg-gray-100 dark:bg-gray-800 group-hover:bg-transparent'
							: ''}"
						data-arrow-selected={index === selectedModelIdx}
						on:click={() => {
							value = item.value;
							selectedModelIdx = index;

							show = false;
						}}
					>
						<div class="flex flex-col">
							{#if $mobile && (item?.model?.info?.meta?.tags ?? []).length > 0}
								<div class="flex gap-0.5 self-start h-full mb-1.5 -translate-x-1">
									{#each item.model?.info?.meta.tags as tag}
										<div
											class=" text-xs font-bold px-1 rounded uppercase line-clamp-1 bg-gray-500/20 text-gray-700 dark:text-gray-200"
										>
											{tag.name}
										</div>
									{/each}
								</div>
							{/if}
							<div class="flex items-center gap-2">
								<div class="flex items-center min-w-fit">
									<div class="line-clamp-1">
										<div class="flex items-center min-w-fit">
											<Tooltip
												content={$user?.role === 'admin' ? (item?.value ?? '') : ''}
												placement="top-start"
											>
												<img
													src={item.model?.info?.meta?.profile_image_url ?? '/static/favicon.png'}
													alt="Model"
													class="rounded-full size-5 flex items-center mr-2"
												/>
												{item.label}
											</Tooltip>
										</div>
									</div>
									{#if item.model.owned_by === 'ollama' && (item.model.ollama?.details?.parameter_size ?? '') !== ''}
										<div class="flex ml-1 items-center translate-y-[0.5px]">
											<Tooltip
												content={`${
													item.model.ollama?.details?.quantization_level
														? item.model.ollama?.details?.quantization_level + ' '
														: ''
												}${
													item.model.ollama?.size
														? `(${(item.model.ollama?.size / 1024 ** 3).toFixed(1)}GB)`
														: ''
												}`}
												className="self-end"
											>
												<span
													class=" text-xs font-medium text-gray-600 dark:text-gray-400 line-clamp-1"
													>{item.model.ollama?.details?.parameter_size ?? ''}</span
												>
											</Tooltip>
										</div>
									{/if}
								</div>

								<!-- {JSON.stringify(item.info)} -->

								{#if item.model.owned_by === 'openai'}
									<Tooltip content={`${'External'}`}>
										<div class="translate-y-[1px]">
											<svg
												xmlns="http://www.w3.org/2000/svg"
												viewBox="0 0 16 16"
												fill="currentColor"
												class="size-3"
											>
												<path
													fill-rule="evenodd"
													d="M8.914 6.025a.75.75 0 0 1 1.06 0 3.5 3.5 0 0 1 0 4.95l-2 2a3.5 3.5 0 0 1-5.396-4.402.75.75 0 0 1 1.251.827 2 2 0 0 0 3.085 2.514l2-2a2 2 0 0 0 0-2.828.75.75 0 0 1 0-1.06Z"
													clip-rule="evenodd"
												/>
												<path
													fill-rule="evenodd"
													d="M7.086 9.975a.75.75 0 0 1-1.06 0 3.5 3.5 0 0 1 0-4.95l2-2a3.5 3.5 0 0 1 5.396 4.402.75.75 0 0 1-1.251-.827 2 2 0 0 0-3.085-2.514l-2 2a2 2 0 0 0 0 2.828.75.75 0 0 1 0 1.06Z"
													clip-rule="evenodd"
												/>
											</svg>
										</div>
									</Tooltip>
								{/if}

								{#if item.model?.info?.meta?.description}
									<Tooltip
										content={`${marked.parse(
											sanitizeResponseContent(item.model?.info?.meta?.description).replaceAll(
												'\n',
												'<br>'
											)
										)}`}
									>
										<div class=" translate-y-[1px]">
											<svg
												xmlns="http://www.w3.org/2000/svg"
												fill="none"
												viewBox="0 0 24 24"
												stroke-width="1.5"
												stroke="currentColor"
												class="w-4 h-4"
											>
												<path
													stroke-linecap="round"
													stroke-linejoin="round"
													d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z"
												/>
											</svg>
										</div>
									</Tooltip>
								{/if}

								{#if !$mobile && (item?.model?.info?.meta?.tags ?? []).length > 0}
									<div class="flex gap-0.5 self-center items-center h-full translate-y-[0.5px]">
										{#each item.model?.info?.meta.tags as tag}
											<Tooltip content={tag.name}>
												<div
													class=" text-xs font-bold px-1 rounded uppercase line-clamp-1 bg-gray-500/20 text-gray-700 dark:text-gray-200"
												>
													{tag.name}
												</div>
											</Tooltip>
										{/each}
									</div>
								{/if}
							</div>
						</div>

						{#if value === item.value}
							<div class="ml-auto pl-2 pr-2 md:pr-0">
								<Check />
							</div>
						{/if}
					</button>
				{:else}
					<div>
						<div class="block px-3 py-2 text-sm text-gray-700 dark:text-gray-100">
							{$i18n.t('No results found')}
						</div>
					</div>
				{/each}

				{#if !(searchValue.trim() in $MODEL_DOWNLOAD_POOL) && searchValue && ollamaVersion && $user.role === 'admin'}
					<Tooltip
						content={$i18n.t(`Pull "{{searchValue}}" from Ollama.com`, {
							searchValue: searchValue
						})}
						placement="top-start"
					>
						<button
							class="flex w-full font-medium line-clamp-1 select-none items-center rounded-button py-2 pl-3 pr-1.5 text-sm text-gray-700 dark:text-gray-100 outline-none transition-all duration-75 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg cursor-pointer data-[highlighted]:bg-muted"
							on:click={() => {
								pullModelHandler();
							}}
						>
							<div class=" truncate">
								{$i18n.t(`Pull "{{searchValue}}" from Ollama.com`, { searchValue: searchValue })}
							</div>
						</button>
					</Tooltip>
				{/if}

				{#each Object.keys($MODEL_DOWNLOAD_POOL) as model}
					<div
						class="flex w-full justify-between font-medium select-none rounded-button py-2 pl-3 pr-1.5 text-sm text-gray-700 dark:text-gray-100 outline-none transition-all duration-75 rounded-lg cursor-pointer data-[highlighted]:bg-muted"
					>
						<div class="flex">
							<div class="-ml-2 mr-2.5 translate-y-0.5">
								<svg
									class="size-4"
									viewBox="0 0 24 24"
									fill="currentColor"
									xmlns="http://www.w3.org/2000/svg"
									><style>
										.spinner_ajPY {
											transform-origin: center;
											animation: spinner_AtaB 0.75s infinite linear;
										}
										@keyframes spinner_AtaB {
											100% {
												transform: rotate(360deg);
											}
										}
									</style><path
										d="M12,1A11,11,0,1,0,23,12,11,11,0,0,0,12,1Zm0,19a8,8,0,1,1,8-8A8,8,0,0,1,12,20Z"
										opacity=".25"
									/><path
										d="M10.14,1.16a11,11,0,0,0-9,8.92A1.59,1.59,0,0,0,2.46,12,1.52,1.52,0,0,0,4.11,10.7a8,8,0,0,1,6.66-6.61A1.42,1.42,0,0,0,12,2.69h0A1.57,1.57,0,0,0,10.14,1.16Z"
										class="spinner_ajPY"
									/></svg
								>
							</div>

							<div class="flex flex-col self-start">
								<div class="flex gap-1">
									<div class="line-clamp-1">
										Downloading "{model}"
									</div>

									<div class="flex-shrink-0">
										{'pullProgress' in $MODEL_DOWNLOAD_POOL[model]
											? `(${$MODEL_DOWNLOAD_POOL[model].pullProgress}%)`
											: ''}
									</div>
								</div>

								{#if 'digest' in $MODEL_DOWNLOAD_POOL[model] && $MODEL_DOWNLOAD_POOL[model].digest}
									<div class="-mt-1 h-fit text-[0.7rem] dark:text-gray-500 line-clamp-1">
										{$MODEL_DOWNLOAD_POOL[model].digest}
									</div>
								{/if}
							</div>
						</div>

						<div class="mr-2 ml-1 translate-y-0.5">
							<Tooltip content={$i18n.t('Cancel')}>
								<button
									class="text-gray-800 dark:text-gray-100"
									on:click={() => {
										cancelModelPullHandler(model);
									}}
								>
									<svg
										class="w-4 h-4 text-gray-800 dark:text-white"
										aria-hidden="true"
										xmlns="http://www.w3.org/2000/svg"
										width="24"
										height="24"
										fill="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											stroke="currentColor"
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M6 18 17.94 6M18 18 6.06 6"
										/>
									</svg>
								</button>
							</Tooltip>
						</div>
					</div>
				{/each}
			</div>

			{#if showTemporaryChatControl}
				<hr class="border-gray-50 dark:border-gray-800" />
				<div class="h-2" />
				<DropdownMenu.Item
					class="flex gap-2 justify-between items-center px-3 py-2 text-sm  font-medium cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800  rounded-xl"
					on:click={async () => {
						$temporaryChatEnabled = !$temporaryChatEnabled;
						await goto('/desktop-app/chatbar');
						const newChatButton = document.getElementById('new-chat-button');
						setTimeout(() => {
							newChatButton?.click();
						}, 0);

						// add 'temporary-chat=true' to the URL
						if ($temporaryChatEnabled) {
							history.replaceState(null, '', '?temporary-chat=true');
						} else {
							history.replaceState(null, '', location.pathname);
						}
					}}
				>
					<div class="flex gap-2 items-center">
						<ChatBubbleOval className="size-4" strokeWidth="2.5" />
						{$i18n.t(`Temporary Chat`)}
					</div>
					<div>
						<Switch state={$temporaryChatEnabled} />
					</div>
				</DropdownMenu.Item>{/if}
		</DropdownMenu.Content>
	</div>
</Dropdown>
