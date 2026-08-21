#!/usr/bin/env node
/**
 * The free build's Premium-gating rules, checked.
 *
 * This plugin is cut from the Premium one, and the same four mistakes kept coming back while that was
 * done by hand. Each rule below is one of them, found in the source at least once — so this is not a
 * list of things that could go wrong in theory.
 *
 *   1. A `PRO_FEATURES` key nothing reads — a feature held back with no notice saying so — or a key
 *      read that does not exist, which composes a notice naming nothing.
 *   2. An upsell sentence written at the call site instead of composed from `PRO_FEATURES`. Thirteen
 *      of these had drifted apart; a control moving between free and Premium meant finding every
 *      sentence that named it, and a missed one leaves "available in the Premium version" printed
 *      under a control this build draws.
 *   3. An attribute default that has fallen behind the Premium build. `arrow.bg` was `transparent`
 *      against a translucent black there, which drew a white arrow on nothing.
 *   4. A panel that writes the free value into an attribute when it finds a Premium one saved. This
 *      is the worst of the four: it destroys a slider built under a licence rather than ignoring the
 *      part it cannot honour, does not restore when the licence returns, and marks the post dirty as
 *      soon as the inspector opens. Found twice. `PRO_ONLY` in `utils/config` is the shape to copy —
 *      strip it on the way out, leave the attribute alone.
 *
 * Exits non-zero on a finding, so `npm run build` fails rather than shipping one.
 *
 * Rule 3 is skipped when the Premium checkout is not beside this one, so a clone without it still
 * builds; the other three are always checked.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'src');
const PRO_BLOCK_JSON = path.resolve(ROOT, '../b-slider-pro/src/block.json');

const findings = [];
const notes = [];

const report = (rule, file, message) => findings.push({ rule, file, message });

/** Every .js under src/, as [repo-relative path, contents]. */
const sources = (() => {
	const out = [];
	const walk = dir => {
		for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
			const full = path.join(dir, entry.name);
			if (entry.isDirectory()) {
				walk(full);
			} else if (entry.name.endsWith('.js')) {
				out.push([path.relative(ROOT, full), fs.readFileSync(full, 'utf8')]);
			}
		}
	};
	walk(SRC);
	return out;
})();

/**
 * Comments stripped, so a rule matches code and not prose about code.
 *
 * Every rule here needs this: the notices are discussed at length in the very comments that explain
 * why they were centralised, and `PRO_ONLY`'s own note quotes the `setAttributes` call it replaced.
 * Without stripping, the explanation of a fixed bug reads as the bug.
 */
const stripComments = code => code
	.replace(/\/\*[\s\S]*?\*\//g, '')
	.replace(/(^|[^:\\])\/\/.*$/gm, '$1');

/* ── 1. PRO_FEATURES keys ─────────────────────────────────────────────────── */

const featuresPath = path.join(SRC, 'utils/pro-features.js');
const featuresFile = fs.readFileSync(featuresPath, 'utf8');

/* The registry's own keys, from the one indent level `PRO_FEATURES` members sit at. */
const declared = [...featuresFile.matchAll(/^\t([a-zA-Z][a-zA-Z0-9]*)\s*:/gm)].map(m => m[1]);

const referenced = new Set();
for (const [, code] of sources) {
	for (const m of stripComments(code).matchAll(/PRO_FEATURES\.([a-zA-Z][a-zA-Z0-9]*)/g)) {
		referenced.add(m[1]);
	}
}

for (const key of declared) {
	if (!referenced.has(key)) {
		report(1, 'src/utils/pro-features.js', `\`${key}\` is declared and never read — the feature is held back with nothing telling anyone. Point a panel at it, or drop the key if a locked control already names itself.`);
	}
}

for (const key of referenced) {
	if (!declared.includes(key)) {
		report(1, 'src/utils/pro-features.js', `\`PRO_FEATURES.${key}\` is read but not declared — the notice composed from it would name nothing.`);
	}
}

/* ── 2. Upsell sentences written by hand ──────────────────────────────────── */

/**
 * `PlayerGeneral` is allowed its own `Notice`.
 *
 * Eleven groups of locked controls, and a sentence each is "available in the Premium version"
 * printed eleven times down one 280px sidebar. Its `ProLine` prints the short caption form instead —
 * and it takes `PRO_FEATURES` keys, so rule 1 still holds it to the registry.
 */
const OWN_NOTICE_ALLOWED = [
	'src/Components/Backend/Settings/General/PlayerGeneral.js',
	/* The component every other notice is expected to use — it is what builds the premium `Notice`. */
	'src/Components/Panel/ProNotice.js'
];

/** Where the one sentence is composed. Rule 2 is about copies of it elsewhere. */
const SENTENCE_SOURCE = 'src/utils/pro-features.js';

for (const [file, code] of sources) {
	const body = stripComments(code);

	if (/available in the Premium version/.test(body) && SENTENCE_SOURCE !== file) {
		report(2, file, 'writes an upsell sentence out in full. Add the feature names to `PRO_FEATURES` and let `ProNotice`/`ProCard` compose it, so the sentence cannot drift from what the panel actually locks.');
	}

	if (/status=["']premium["']/.test(body) && !OWN_NOTICE_ALLOWED.includes(file)) {
		report(2, file, 'builds a premium `Notice` directly. Use `ProNotice` (a sentence) or `ProCard` (a card inside an existing panel) so the pricing link and wording stay in one place.');
	}

	if (/<PremiumPanel\b/.test(body) && !file.endsWith('Panel/ProCard.js')) {
		report(2, file, 'uses `PremiumPanel` directly. Use `ProCard`, which carries `pricingUrl` and the button label for every card.');
	}
}

/* ── 2b. Premium controls rendered at all ─────────────────────────────────── */

/**
 * A control for a feature this build cannot deliver, drawn rather than described.
 *
 * WordPress.org does not allow a plugin to put options for its paid version in front of the user. A
 * notice naming the feature is allowed; a control is not — and `BControlPro` and its siblings are
 * exactly that: the real control, with a Pro tag on the label, whose click opens a pricing modal
 * instead of doing anything. A tag makes it more of a shopfront, not less.
 *
 * The released build has never had one. The feed branch introduced fifty-two, so this rule exists to
 * keep them out: the control comes off the screen and the feature is named in `ProNotice`,
 * `ProPanel` or `ProCard` instead.
 */
const PRO_CONTROL = /<(?:BControl|SelectControl|RadioControl|BtnGroup)Pro\b/;

for (const [file, code] of sources) {
	if (PRO_CONTROL.test(stripComments(code))) {
		report(2, file, 'renders a Premium control (`BControlPro` or a sibling). WordPress.org allows a notice naming a paid feature, not an option for it — take the control off the screen and name the feature in `ProNotice`/`ProPanel`/`ProCard`.');
	}
}

/* ── 3. Attribute defaults against the Premium build ──────────────────────── */

/**
 * Where free and Premium are meant to differ, with the reason.
 *
 * A key here is not unchecked — its *presence* is asserted below, so a split that gets resolved has
 * to be removed from this list rather than sitting here claiming a difference that is gone.
 */
const INTENDED_ATTRIBUTE_SPLITS = {
	postsQuery: 'ACF sorting and meta filter rules are Premium — orderByField, metaFilters and the rest.',
	sliders: "A slide's own button — btnLabel, btnUrl, target — is Premium, so this build has no control for it; `MainItem` names it in a notice.",
	videoConf: 'The Plyr options behind the Premium player panels, and `controls.duration`, which is a free toggle here and not offered there.'
};

const orderInsensitive = value => {
	if (Array.isArray(value)) {
		return value.map(orderInsensitive);
	}

	if (value && 'object' === typeof value) {
		return Object.keys(value).sort().reduce((out, key) => {
			out[key] = orderInsensitive(value[key]);
			return out;
		}, {});
	}

	return value;
};

const sameShape = (a, b) => JSON.stringify(orderInsensitive(a)) === JSON.stringify(orderInsensitive(b));

if (!fs.existsSync(PRO_BLOCK_JSON)) {
	notes.push('b-slider-pro is not beside this checkout, so attribute defaults were not compared.');
} else {
	const free = JSON.parse(fs.readFileSync(path.join(SRC, 'block.json'), 'utf8')).attributes || {};
	const pro = JSON.parse(fs.readFileSync(PRO_BLOCK_JSON, 'utf8')).attributes || {};

	for (const name of Object.keys(pro)) {
		if (!(name in free)) {
			report(3, 'src/block.json', `\`${name}\` is in the Premium build and missing here. A panel reading it gets undefined, and the shared components read the same attributes in both builds.`);
			continue;
		}

		const differs = !sameShape(free[name], pro[name]);
		const intended = name in INTENDED_ATTRIBUTE_SPLITS;

		if (differs && !intended) {
			report(3, 'src/block.json', `\`${name}\` differs from the Premium build. If free is behind, forward it; if the split is deliberate, add \`${name}\` to INTENDED_ATTRIBUTE_SPLITS in bin/check-pro.js with the reason. (Key order alone is not a difference.)`);
		}

		if (!differs && intended) {
			report(3, 'bin/check-pro.js', `\`${name}\` is listed in INTENDED_ATTRIBUTE_SPLITS but now matches the Premium build. Remove the entry so the list keeps describing what is really split.`);
		}
	}

	for (const name of Object.keys(free)) {
		if (!(name in pro)) {
			report(3, 'src/block.json', `\`${name}\` exists only here. That is fine for something free-only, but check it is not a Premium attribute that was renamed.`);
		}
	}
}

/* ── 4. Panels that rewrite a Premium value ───────────────────────────────── */

/**
 * A `setAttributes` reached only when the build is unlicensed.
 *
 * Both instances looked the same: an effect whose body is `if (!isPro) { … setAttributes(…) }`,
 * comparing each Premium-only value against the free one and writing the difference away. So the
 * shape to find is a not-Premium guard with a write inside it, and the search is bounded to the
 * lines after the guard rather than the whole file.
 */
const NEGATED_PRO_GUARD = /(?:if\s*\(\s*!\s*(?:isPro|isPremium)\b|!\s*(?:isPro|isPremium)\s*&&)/;

for (const [file, code] of sources) {
	const lines = stripComments(code).split('\n');

	lines.forEach((line, index) => {
		if (!NEGATED_PRO_GUARD.test(line)) {
			return;
		}

		/**
		 * The guarded block, followed to the brace that closes it.
		 *
		 * Not a fixed number of lines: the `PlayerGeneral` instance compared five settings one after
		 * another and reached its `setAttributes` twenty-seven lines below the guard, so a window
		 * wide enough to be safe is wide enough to run past the block and into unguarded code.
		 * Counting braces from the guard ends exactly where the guard stops applying.
		 */
		let depth = 0;
		let opened = false;

		for (let cursor = index; cursor < lines.length; cursor++) {
			const text = lines[cursor];

			for (const ch of text) {
				if ('{' === ch) {
					depth++;
					opened = true;
				} else if ('}' === ch) {
					depth--;
				}
			}

			if (/\bsetAttributes\s*\(/.test(text)) {
				report(4, file, `line ${index + 1}: \`setAttributes\` on line ${cursor + 1} runs only when the build is unlicensed. That overwrites a slider configured under a licence instead of ignoring the part this build cannot honour — it does not come back when the licence does, and it dirties the post as the inspector opens. Gate it where the value is used, as \`PRO_ONLY\` does in utils/config.`);
				return;
			}

			/* Left the guarded block without finding a write. */
			if (opened && depth <= 0) {
				return;
			}
		}
	});
}

/* ── Result ───────────────────────────────────────────────────────────────── */

for (const note of notes) {
	console.log(`note: ${note}`);
}

if (!findings.length) {
	console.log(`check-pro: all four rules pass (${declared.length} PRO_FEATURES keys, ${sources.length} files).`);
	process.exit(0);
}

const RULE_TITLES = {
	1: 'PRO_FEATURES key with no reader, or no declaration',
	2: 'upsell written by hand, or a Premium control rendered',
	3: 'attribute default out of step with the Premium build',
	4: 'panel overwrites a value saved under a licence'
};

console.error(`\ncheck-pro: ${findings.length} finding${1 === findings.length ? '' : 's'}.\n`);

for (const rule of [4, 3, 2, 1]) {
	const group = findings.filter(f => rule === f.rule);

	if (!group.length) {
		continue;
	}

	console.error(`Rule ${rule} — ${RULE_TITLES[rule]}`);

	for (const { file, message } of group) {
		console.error(`  ${file}\n    ${message}`);
	}

	console.error('');
}

process.exit(1);
