import { sveltekit } from '@sveltejs/kit/vite';
import { purgeCss } from 'vite-plugin-tailwind-purgecss';
import { resolve } from 'path';
import { defineConfig } from 'vite';

export default defineConfig( {
	plugins: [
		sveltekit(), 
		purgeCss()
	],
	resolve: {
		alias: {
			'~': resolve(__dirname, 'src'),
		},
	}
});
