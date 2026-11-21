import { __ } from '@wordpress/i18n';
import { createRoot } from '@wordpress/element';
import { select } from '@wordpress/data';
import domReady from '@wordpress/dom-ready';
import StockBrowser from './StockBrowser';

const TAB = 'bsb-stock';

// Only frames opened while a bSlider block (or a block inside one) is selected get the tab.
const openedFromSlider = () => {
	const editor = select('core/block-editor');
	const clientId = editor?.getSelectedBlockClientId?.();

	if (!clientId) {
		return false;
	}

	return 'bsb/slider' === editor.getBlockName(clientId) || 0 < editor.getBlockParentsByBlockName(clientId, 'bsb/slider').length;
};

const addStockTab = () => {
	const media = window.wp?.media;
	const Select = media?.view?.MediaFrame?.Select;

	if (!Select || Select.prototype.bsbStockTab) {
		return;
	}

	const { bindHandlers, browseRouter } = Select.prototype;

	Object.assign(Select.prototype, {
		bsbStockTab: true,

		bindHandlers(...args) {
			bindHandlers.apply(this, args);
			this.on(`content:create:${TAB}`, this.bsbStockContent, this);
		},

		browseRouter(routerView, ...args) {
			browseRouter.call(this, routerView, ...args);

			if (openedFromSlider()) {
				routerView.set({ [TAB]: { text: __('Stock Images', 'b-slider'), priority: 60 } });
			}
		},

		bsbStockContent(contentRegion) {
			const frame = this;
			const multiple = !!frame.state().get('selection')?.multiple;
			frame.$el.toggleClass('hide-toolbar', !multiple);

			const View = media.View.extend({
				className: 'bsbStockTab',

				render() {
					if (!this.root) {
						this.root = createRoot(this.el);
					}
					this.root.render(<StockBrowser multiple={multiple} onImported={item => frame.bsbStockSelect(item)} />);
					return this;
				},

				remove() {
					const root = this.root;
					this.root = null;
					if (root) {
						setTimeout(() => root.unmount());
					}
					return media.View.prototype.remove.apply(this, arguments);
				},
			});

			contentRegion.view = new View({ controller: frame });
		},

		async bsbStockSelect(item) {
			const attachment = media.attachment(item.id);
			await attachment.fetch();

			const state = this.state();
			const selection = state.get('selection');

			// Multi-pick frames keep collecting until their own toolbar button is pressed.
			if (selection?.multiple) {
				selection.add(attachment);
				return;
			}

			selection?.reset([attachment]);
			this.close();
			state.trigger('select');
			this.content.mode('browse');
		},
	});
};

domReady(addStockTab);
