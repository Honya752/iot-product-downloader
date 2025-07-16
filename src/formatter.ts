import path from "path";
import * as fs from 'fs'
import rawConfig from './config.json'

interface Product {
    name: string,
    slug: string,
    price: number,
    tags: { id: number, name: string }[],
    categories: { name: string }[],
    images: { src: string }[],
    stock_status: string,
    catalog_visibility: string,
    purchasable: boolean
}

interface formattedProduct {
    slug: string,
    name: string,
    price: number,
    tags: number[],
    category: string,
    image: string
}

interface Tag {
    id: number,
    name: string
}

interface Config {
    ignoreTags: string[],
    tagCategories: { [category: string]: string[] }
}

const config: Config = rawConfig;

const formatter = (productsFileName: string, tagFileName: string, output: string) => {

    const products: Product[] = JSON.parse(fs.readFileSync(productsFileName, 'utf-8'));
    const tags: Tag[] = JSON.parse(fs.readFileSync(tagFileName, 'utf-8'));

    const formattedProducts: formattedProduct[] = products
        .filter(x => x.stock_status != 'outofstock' && x.purchasable && x.catalog_visibility === 'visible')
        .map(x => ({
            slug: x.slug,
            name: x.name,
            price: Math.round(x.price * 1.27),
            tags: x.tags.filter(x => !config.ignoreTags.includes(x.name)).map(t => t.id),
            category: x.categories[0]?.name,
            image: x.images[0]?.src.replace('https://iotcentrum.hu/wp-content/uploads/', '')
        }))
        .filter(p => p.tags.length > 0);

    console.log("ℹ️ Product filtered:", formattedProducts.length)

    const fileName = path.join(output, `formattedProducts.json`);
    fs.mkdirSync(output, { recursive: true });
    fs.writeFileSync(fileName, JSON.stringify(formattedProducts, null, 2));

    const formattedTags: Tag[] = tags
        .filter(x => !config.ignoreTags.includes(x.name))
        .map(x => ({
            id: x.id,
            name: x.name,
        }))

    const categorisedTags: { [category: string]: Tag[] } = {};
    Object.keys(config.tagCategories).forEach(k => {
        categorisedTags[k] = []
    });
    categorisedTags['További'] = [];

    formattedTags.forEach(t => {
        let contains = false;
        Object.keys(categorisedTags).forEach(c => {
            if (config.tagCategories[c]?.includes(t.name)) {
                categorisedTags[c].push(t)
                contains = true;
            }
        })
        if (!contains) categorisedTags['További'].push(t);
    })

    console.log("ℹ️ Tags filtered:", formattedTags.length)

    const categorisedTagsFileName = path.join(output, `categorisedTags.json`);
    fs.mkdirSync(output, { recursive: true });
    fs.writeFileSync(categorisedTagsFileName, JSON.stringify(categorisedTags, null, 2));

    const compactProducts = formattedProducts.map(
        x => `${x.slug};${x.name};${x.price};${JSON.stringify(x.tags)};${x.category};${x.image}`
    ).join(';');

    const compactTags = Object.keys(categorisedTags).map(f =>
        `${f}:${categorisedTags[f].map(t => `${t.id},${t.name}`).join(',')}`
    ).join(';');

    const dataFile = path.join(output, `data.txt`);
    fs.mkdirSync(output, { recursive: true });
    fs.writeFileSync(dataFile, encodeToBase64(`${compactTags}|${compactProducts}`));

    function encodeToBase64(str: string) {
        const utf8Bytes = new TextEncoder().encode(str); // UTF-8 encode
        const binary = String.fromCharCode(...utf8Bytes); // Convert to binary string
        return btoa(binary); // Base64 encode
    }
}

export default formatter;