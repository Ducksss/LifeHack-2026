<?php
/**
 * Plugin Name: Woven Commerce Handoff
 * Description: Validates a short-lived Woven HMAC payload, replaces the WooCommerce cart, and redirects to native checkout.
 * Version: 0.1.0
 * Requires PHP: 8.1
 * Requires Plugins: woocommerce
 * License: MIT
 */

if (!defined('ABSPATH')) {
    exit;
}

final class Woven_Commerce_Handoff {
    private const ROUTE = 'woven-commerce/handoff';
    private const MAX_FUTURE_SECONDS = 600;
    private const MAX_LINE_QUANTITY = 10;
    private const MAX_TOTAL_QUANTITY = 50;

    public static function boot(): void {
        add_action('template_redirect', [self::class, 'handle']);
    }

    private static function fail(string $message, int $status = 400): void {
        status_header($status);
        wp_die(esc_html($message), esc_html__('Woven checkout handoff', 'woven-commerce-handoff'), ['response' => $status]);
    }

    private static function config(): array {
        $secret = defined('WOVEN_COMMERCE_HANDOFF_SECRET') ? (string) WOVEN_COMMERCE_HANDOFF_SECRET : '';
        $allowed = defined('WOVEN_COMMERCE_ALLOWED_PRODUCT_IDS') ? (string) WOVEN_COMMERCE_ALLOWED_PRODUCT_IDS : '';
        $ids = array_values(array_filter(array_map('absint', explode(',', $allowed))));
        if (strlen($secret) < 32 || count($ids) === 0) {
            self::fail('Woven checkout handoff is not configured.', 503);
        }
        return [$secret, array_fill_keys($ids, true)];
    }

    private static function base64url_decode(string $value): string|false {
        if (!preg_match('/^[A-Za-z0-9_-]+$/', $value)) {
            return false;
        }
        $padding = (4 - strlen($value) % 4) % 4;
        return base64_decode(strtr($value, '-_', '+/') . str_repeat('=', $padding), true);
    }

    public static function handle(): void {
        $path = trim((string) wp_parse_url($_SERVER['REQUEST_URI'] ?? '', PHP_URL_PATH), '/');
        if ($path !== self::ROUTE) {
            return;
        }
        if (!function_exists('WC') || !WC()->cart) {
            self::fail('WooCommerce cart is unavailable.', 503);
        }

        [$secret, $allowed] = self::config();
        $encoded = isset($_GET['woven_payload']) ? sanitize_text_field(wp_unslash($_GET['woven_payload'])) : '';
        $signature = isset($_GET['woven_signature']) ? sanitize_text_field(wp_unslash($_GET['woven_signature'])) : '';
        if ($encoded === '' || $signature === '') {
            self::fail('The Woven checkout handoff is incomplete.');
        }
        $expected = rtrim(strtr(base64_encode(hash_hmac('sha256', $encoded, $secret, true)), '+/', '-_'), '=');
        if (!hash_equals($expected, $signature)) {
            self::fail('The Woven checkout handoff signature is invalid.', 403);
        }
        $decoded = self::base64url_decode($encoded);
        $payload = $decoded === false ? null : json_decode($decoded, true, 32, JSON_BIGINT_AS_STRING);
        if (!is_array($payload) || array_keys($payload) !== ['items', 'expiresAt', 'nonce']) {
            self::fail('The Woven checkout handoff payload is invalid.');
        }

        $now = time();
        $expires = filter_var($payload['expiresAt'], FILTER_VALIDATE_INT);
        if ($expires === false || $expires <= $now) {
            self::fail('The Woven checkout handoff expired.', 410);
        }
        if ($expires > $now + self::MAX_FUTURE_SECONDS) {
            self::fail('The Woven checkout handoff expiry is invalid.');
        }
        $nonce = is_string($payload['nonce']) ? $payload['nonce'] : '';
        if (!preg_match('/^[A-Za-z0-9_-]{16,80}$/', $nonce)) {
            self::fail('The Woven checkout handoff nonce is invalid.');
        }
        $nonce_key = 'woven_handoff_' . hash('sha256', $nonce);
        if (get_transient($nonce_key) !== false) {
            self::fail('This Woven checkout handoff was already used.', 409);
        }

        if (!is_array($payload['items']) || count($payload['items']) < 1 || count($payload['items']) > 20) {
            self::fail('The Woven checkout handoff item list is invalid.');
        }
        $items = [];
        $total_quantity = 0;
        foreach ($payload['items'] as $item) {
            if (!is_array($item) || array_keys($item) !== ['productId', 'quantity']) {
                self::fail('A Woven checkout handoff line is invalid.');
            }
            $product_id = filter_var($item['productId'], FILTER_VALIDATE_INT);
            $quantity = filter_var($item['quantity'], FILTER_VALIDATE_INT);
            if ($product_id === false || !isset($allowed[$product_id])) {
                self::fail('The Woven checkout handoff contains an unapproved product.', 403);
            }
            if ($quantity === false || $quantity < 1 || $quantity > self::MAX_LINE_QUANTITY) {
                self::fail('The Woven checkout handoff quantity is invalid.');
            }
            $total_quantity += $quantity;
            $product = wc_get_product($product_id);
            if (!$product || !$product->is_purchasable() || !$product->is_in_stock() || !$product->has_enough_stock($quantity)) {
                self::fail('A Woven checkout item is no longer available.', 409);
            }
            $items[] = [$product_id, $quantity];
        }
        if ($total_quantity > self::MAX_TOTAL_QUANTITY) {
            self::fail('The Woven checkout handoff contains too many items.');
        }

        set_transient($nonce_key, 1, max(1, $expires - $now));
        WC()->cart->empty_cart(true);
        foreach ($items as [$product_id, $quantity]) {
            if (WC()->cart->add_to_cart($product_id, $quantity) === false) {
                WC()->cart->empty_cart(true);
                self::fail('WooCommerce could not create the requested cart.', 409);
            }
        }
        wp_safe_redirect(wc_get_checkout_url(), 303);
        exit;
    }
}

Woven_Commerce_Handoff::boot();
