import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const manifest = JSON.parse(readFileSync(path.join(root, "commerce", "products.json"), "utf8"));
const output = path.join(root, "commerce", "imports");
mkdirSync(output, { recursive: true });

const quote = (value) => `"${String(value ?? "").replaceAll('"', '""')}"`;
const wovenPairs = (attributes) => Object.entries(attributes).map(([key, value]) => `${key}=${value}`).join(";");
const pickupPairs = wovenPairs(manifest.pickup);

const shopifyHeader = [
  "Handle", "Title", "Body (HTML)", "Vendor", "Product Category", "Type", "Tags", "Published",
  "Option1 Name", "Option1 Value", "Variant SKU", "Variant Grams", "Variant Inventory Tracker",
  "Variant Inventory Qty", "Variant Inventory Policy", "Variant Fulfillment Service", "Variant Price",
  "Variant Requires Shipping", "Variant Taxable", "Status",
];
const shopifyRows = manifest.products.map((product) => [
  product.handle,
  product.title,
  `${product.description}\n[Woven] ${wovenPairs(product.attributes)};${pickupPairs}`,
  "Woven Trail Shop",
  "Sporting Goods > Outdoor Recreation > Camping & Hiking",
  "Camping Gear",
  `woven:category=${product.attributes.category}, woven:${wovenPairs(product.attributes)}, woven:${pickupPairs}`,
  "TRUE",
  "Title",
  "Default Title",
  product.sku,
  "0",
  "shopify",
  manifest.inventory,
  "deny",
  "manual",
  (product.priceCents / 100).toFixed(2),
  "TRUE",
  "TRUE",
  "active",
]);
writeFileSync(path.join(output, "shopify-products.csv"), [shopifyHeader, ...shopifyRows].map((row) => row.map(quote).join(",")).join("\n") + "\n");

const wooAttributeNames = [
  "category", "capacity", "waterproofMm", "dampReady", "rValue", "lumens", "ipRating",
  "peopleCovered", "waterResistant", "packedLiters", "locationName", "address", "pickupMinutes",
  "transitMinutes", "closesAt", "area",
];
const wooHeader = [
  "Type", "SKU", "Name", "Published", "Is featured?", "Visibility in catalog", "Short description",
  "Description", "Tax status", "In stock?", "Stock", "Regular price", "Categories",
  ...wooAttributeNames.flatMap((_, index) => [`Attribute ${index + 1} name`, `Attribute ${index + 1} value(s)`, `Attribute ${index + 1} visible`, `Attribute ${index + 1} global`]),
];
const wooRows = manifest.products.map((product) => {
  const attributes = { ...product.attributes, ...manifest.pickup };
  return [
    "simple", product.sku, product.title, "1", "0", "visible", product.description,
    `${product.description} Runtime recommendations use the live WooCommerce Store API.`, "taxable", "1",
    manifest.inventory, (product.priceCents / 100).toFixed(2), "Camping Gear",
    ...wooAttributeNames.flatMap((name) => [name, attributes[name] ?? "", "1", "0"]),
  ];
});
writeFileSync(path.join(output, "woocommerce-products.csv"), [wooHeader, ...wooRows].map((row) => row.map(quote).join(",")).join("\n") + "\n");

console.log(`Generated ${shopifyRows.length} Shopify rows and ${wooRows.length} WooCommerce rows from commerce/products.json.`);
