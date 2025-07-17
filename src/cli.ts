import { Command } from 'commander';
import downloader from './downloader';
import formatter from './formatter';
import dotenv from 'dotenv';

dotenv.config();

const program = new Command();

program
    .name('iot-product-downloader')
    .description('Downloads and formats data from WooCommerce API')
    .version('1.0.0');

program
    .command('download')
    .description('Downloads all product and tag data from API')
    .option('-o, --out <folder>', 'Output folder', './data')
    .action((options) => downloader(options.out));

program
    .command('format')
    .description('Formats the product and tag data for iot-product-finder')
    .option('-p, --products <location>', 'Source JSON for product data', './data/products.json')
    .option('-t, --tags <location>', 'Source JSON for tag data', './data/tags.json')
    .option('-s, --save <boolean>', 'Save temp file for debugging', 'false')
    .option('-e  --temp <location>', 'Output folder for the temp files', './data')
    .option('-o, --output <location>', 'Output folder', './data')
    .action((options) => formatter({
        productsFileName: options.products,
        tagFileName: options.tags,
        output: options.output,
        save: options.save,
        tempFolder: options.temp
    }));

program.parse();