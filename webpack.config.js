const defaultConfig = require('@wordpress/scripts/config/webpack.config');
const ESLintPlugin = require('eslint-webpack-plugin');

const plugins = defaultConfig.plugins.filter(p => {
	if (Object.values(p).length === 2 && Object.values(p)?.[1]['filename'] && Object.values(p)?.[1]['filename'] === '[name]-rtl.css') {
		return false;
	}
	return true;
});

module.exports = {
	...defaultConfig,
	entry: {
		...defaultConfig.entry(),
		'admin-dashboard': './src/admin/dashboard.js',
	},
	module: {
		...defaultConfig.module,
		rules: [
			...defaultConfig.module.rules,
			{
				test: /ace-builds.*snippets[\\/]html\.js$/,
				loader: 'string-replace-loader',
				options: {
					multiple: [
						{ search: 'https://cdnjs.cloudflare.com/ajax/libs/html5shiv/3.7.3/html5shiv.min.js', replace: '' },
						{ search: 'https://cdnjs.cloudflare.com/ajax/libs/html5shiv/3.7.3/html5shiv-printshiv.min.js', replace: '' }
					]
				}
			}
		]
	},
	plugins: [
		...plugins,
		new ESLintPlugin()
	],
	/**
	 * This block used to be `{}`, which threw away @wordpress/scripts' Terser setup along with it.
	 * That Terser is configured for i18n: it preserves `translators:` comments through
	 * minification and keeps `__`, `_n`, `_nx` and `_x` out of the mangler. Webpack's plain
	 * defaults strip both, so every translator note written in JS was gone before
	 * `wp i18n make-pot` ever read the bundle and none of them reached the .pot file.
	 *
	 * Its `splitChunks` is deliberately not taken: that pulls `style.scss` out of each entry into
	 * a `style-*.css` of its own, and block.json enqueues `index.css` and `view.css` — the split
	 * files are named in no manifest and would simply not load.
	 */
	optimization: {
		concatenateModules: defaultConfig.optimization?.concatenateModules,
		minimizer: defaultConfig.optimization?.minimizer
	}
};