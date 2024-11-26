module.exports = {
	plugins: [
		require("tailwindcss"),
		require("autoprefixer"),
		require('postcss-rem-to-responsive-pixel')({
			rootValue: 16,
			propList: ['*'],
			transformUnit: 'px',
		  }),
	]
}