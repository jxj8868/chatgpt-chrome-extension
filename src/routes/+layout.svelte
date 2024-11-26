<script lang='ts'>

	// Most of your app wide CSS should be put in this file
	import '../app.postcss';
	import { AppShell, AppBar, initializeStores, Modal, Toast  } from '@skeletonlabs/skeleton';
	import type { ModalComponent } from '@skeletonlabs/skeleton';
	import { computePosition, autoUpdate, offset, shift, flip, arrow } from '@floating-ui/dom';
	import { storePopup } from '@skeletonlabs/skeleton';

	initializeStores();
	const modalComponentRegistry: Record<string, ModalComponent> = {
	};

	storePopup.set({ computePosition, autoUpdate, offset, shift, flip, arrow });
</script>

<Modal components={modalComponentRegistry} />
<Toast padding="px-5 py-2" position="t" />
<!-- App Shell -->
<AppShell>
	<!-- Page Route Content -->
	<slot />
</AppShell>
