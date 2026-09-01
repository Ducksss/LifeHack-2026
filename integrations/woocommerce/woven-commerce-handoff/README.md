# Woven Commerce Handoff for WooCommerce

Install this directory as a WordPress plugin, then define two server-side constants in `wp-config.php` (or equivalent managed-host secret configuration):

```php
define('WOVEN_COMMERCE_HANDOFF_SECRET', 'use-the-same-random-32-plus-character-secret-as-Woven');
define('WOVEN_COMMERCE_ALLOWED_PRODUCT_IDS', '101,102,103,104,105');
```

The IDs must be the five products created by `commerce/imports/woocommerce-products.csv`. The secret must match Woven's `WOOCOMMERCE_HANDOFF_SECRET`; never expose it to browser code. The plugin accepts only signed product IDs, quantities, expiry, and nonce, records used nonces in WordPress transients, replaces the cart, and redirects to WooCommerce's native checkout.
