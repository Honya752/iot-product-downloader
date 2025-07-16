import path from 'path';
import * as fs from 'fs'

const downloader = async (output: string) => {

    const url = process.env.API_URL ?? '';
    const key = process.env.API_KEY ?? '';
    const secret = process.env.API_SECRET ?? '';
    const auth = Buffer.from(`${key}:${secret}`).toString('base64');

    async function fetchAllPages(name: string, apiEndPoint: string, params: string = '') {
        console.info('ℹ️ Fetching', name);
        console.time(name);

        const perPage = 100;
        let currentPage = 1;
        let totalPages = 1;
        const allData = [];
        const fullURL = new URL(apiEndPoint, url).toString()

        do {
            const response =
                await fetch(`${fullURL}?per_page=${perPage}&page=${currentPage}&${params}`, {
                    headers: { Authorization: `Basic ${auth}` }
                });

            if (currentPage === 1) totalPages = parseInt(response.headers.get('X-WP-TotalPages') ?? '1', 10)

            const data = await response.json();
            allData.push(...data);
            console.log(`ℹ️ ${currentPage}/${totalPages} pages downloaded`);
            currentPage++;
        }
        while (currentPage <= totalPages);

        const fileName = path.join(output, `${name}.json`);
        fs.mkdirSync(output, { recursive: true });
        fs.writeFileSync(fileName, JSON.stringify(allData, null, 2));
        console.log(`✅ Saved ${allData.length} ${name} to ${fileName}`);
        console.timeEnd(name);
    }

    try {
        await fetchAllPages('products', 'products',
            new URLSearchParams({
                orderby: 'popularity',
                order: 'desc',
            }).toString()
        );
        await fetchAllPages('tags', 'products/tags');
    } catch (e) {
        console.error('❌ Download failed:', e);
    }
}

export default downloader;