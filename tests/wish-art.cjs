// Compatibility command for the original wish-only art review.
process.env.EGG_IDS ??= 'wish';
require('./egg-art.cjs');
