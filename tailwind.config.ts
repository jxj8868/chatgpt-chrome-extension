import { join } from 'path';
import type { Config } from 'tailwindcss';
import forms from '@tailwindcss/forms';
import typography from '@tailwindcss/typography';
import { skeleton } from '@skeletonlabs/tw-plugin'

const config = {
	darkMode: 'media',
	content: ['./src/**/*.{html,js,svelte,ts}', join(require.resolve('@skeletonlabs/skeleton'), '../**/*.{html,js,svelte,ts}')],
	theme: {
		extend: {}
	},
	variants: {
		extend: {
			backgroundColor: ['responsive', 'hover', 'focus', 'active'],
			textColor: ['responsive', 'hover', 'focus', 'active'],
		},
	},
	plugins: [
		forms,
		typography,
		// 注册的主题
		skeleton({ 
			themes: { 
				preset: [{ name: 'wintry', enhancements: true }] 
			} 
		}),
		function ({ addUtilities }) {
			addUtilities({
			  '.scrollbar-hide': {
				/* Firefox */
				'scrollbar-width': 'none',
				/* Safari and Chrome */
				'&::-webkit-scrollbar': {
				  display: 'none',
				},
			  },
			  '.scrollbar': {
				/* Firefox */
				'scrollbar-width': 'thin',
				'scrollbar-color': '#f4f4f4 transparent',
				/* Safari and Chrome */
				'&::-webkit-scrollbar': {
				  width: '8px',
				  height: '8px',
				},
				'&::-webkit-scrollbar-track': {
				  background: 'transparent',
				},
				'&::-webkit-scrollbar-thumb': {
				  background: '#f4f4f4',
				  borderRadius: '4px',
				},
				'&::-webkit-scrollbar-thumb:hover': {
				  background: '#f4f4f4',
				},
			  },
			});
		  }
	],
	// 使用 postcss-rem-to-responsive-pixel 来解决
	// presets: [
	// 	require('tailwindcss-rem2px-preset').createPreset({
	// 		fontSize: 16,
	// 		unit: 'px'
	// 	})
	// ]
} satisfies Config;

export default config;
