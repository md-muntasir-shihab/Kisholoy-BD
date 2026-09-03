const fs = require('fs');

let content = fs.readFileSync('src/admin/ProductsAdmin.tsx', 'utf8');

// Insert new states and useEffect for suppliers
content = content.replace(
  "import { Product } from '../types';",
  "import { Product, Supplier } from '../types';\nimport { useEffect } from 'react';"
);

content = content.replace(
  "const [badge, setBadge] = useState('Artisan Handcrafted');",
  `const [badge, setBadge] = useState('Artisan Handcrafted');
  const [supplierId, setSupplierId] = useState('');
  const [taxRate, setTaxRate] = useState(0);
  const [weight, setWeight] = useState(0.5);
  const [lowStockThreshold, setLowStockThreshold] = useState(5);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);

  useEffect(() => {
    fetch('/api/suppliers')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setSuppliers(data.suppliers);
          if (data.suppliers.length > 0) {
            setSupplierId(data.suppliers[0].id);
          }
        }
      })
      .catch(console.error);
  }, []);`
);

// Update addProduct payload
content = content.replace(
  "readyToShip: true",
  `readyToShip: true,
      supplierId,
      taxRate: Number(taxRate),
      lowStockThreshold: Number(lowStockThreshold),
      attributes: {
        weight: weight.toString()
      }`
);

// Update getMargin to use taxRate
content = content.replace(
  "const getMargin = (price: number, cost: number) => {",
  `const getMargin = (price: number, cost: number, taxRate: number = 0) => {
    if (!price || !cost) return 0;
    const postTaxPrice = price - (price * (taxRate / 100));
    return (((postTaxPrice - cost) / postTaxPrice) * 100).toFixed(1);
  }`
);

// Replace margin calculation in table
content = content.replace(
  "const margin = getMargin(p.price, p.costPrice);",
  "const margin = getMargin(p.price, p.costPrice, p.taxRate || 0);"
);

// Update getMargin usage in the table cell
content = content.replace(
  "Cost: ৳{p.costPrice.toLocaleString()}",
  "Cost: ৳{p.costPrice.toLocaleString()} {p.taxRate ? `| Tax: ${p.taxRate}%` : ''}"
);

// We need to rewrite the modal completely to have tabs or a better layout. Let's do that cleanly.
fs.writeFileSync('src/admin/ProductsAdmin.tsx', content);
