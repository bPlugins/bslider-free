/**
 * The layer system, loaded for its side effects.
 *
 * Each module registers one WordPress filter at import time; imported from the Slide block's own
 * entry point so the filters are installed exactly when that block is, and nowhere else.
 */
import './noNestedSlider';
import './detachPattern';
import './layerAttributes';
import './layerSaveProps';
import './LayerControls';
