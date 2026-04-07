# Standard Deck — Presentation Builder Engine

A lightweight, CDN-hosted presentation builder with:
- 🎨 Live color theming
- 📊 Charts, tables, and data visualization
- 🖼️ Custom logo management
- 📥 PowerPoint export
- ⌨️ Keyboard navigation

## CDN Usage

```html
<script src="https://cdn.jsdelivr.net/gh/gitbrent/pptxgenjs/dist/pptxgen.bundle.js"></script>
<script src="https://cdn.jsdelivr.net/gh/hugedeal-lab/standard-deck@main/standard-deck.js"></script>
<script src="https://cdn.jsdelivr.net/gh/hugedeal-lab/standard-deck@main/deck-layouts.js"></script>
<script src="https://cdn.jsdelivr.net/gh/hugedeal-lab/standard-deck@main/deck-shell.js"></script>
<script>
var D = [/* slide data */];
deckInit({title: 'My Presentation'});
</script>
