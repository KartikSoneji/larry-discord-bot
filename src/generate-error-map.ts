import https from 'https';
import fs from 'fs/promises';

const REPO_URL = 'https://github.com/samuelvanderwaal/metaboss';
const REVISION = 'main'; // branch or commit sha

async function fetch(url: string | URL, options: any = {}) {
    return new Promise((resolve, reject) => {
        let req = https.request(url, options, (res) => {
            let data: Buffer[] = [];
            res.on('data', (d) => data.push(d));
            res.on('end', () =>
                resolve({
                    headers: res.headers,
                    status: res.statusCode,
                    text: async () => Buffer.concat(data).toString(),
                })
            );
        });

        req.on('error', reject);

        req.end();
    });
}

async function fetchWithRedirects(url: string | URL, options?: any) {
    let response: any = await fetch(url, options);
    while (response.status == 301 || response.status == 302)
        response = await fetch(new URL(response.headers.location, url), options);
    return response;
}

function getDomains(text: string): [string, string][] {
    return Array.from(text.matchAll(/pub static (.*?): .*? \{((?:.|\n)*?)\};/g)).map(
        ([_, domain, content]) => [domain.toLowerCase().replace(/_/g, ' '), content]
    );
}

function parseDomainErrors(text: string): [string, string][] {
    return text
        .split(/,?\r?\n/)
        .filter((line) => line.length > 0)
        .map((line) => {
            let [code, error] = line.split('=>').map(unquoteString);
            if (!code || !error) throw new Error(`could not parse line: ${line}`);
            return [code, error];
        });
}

function unquoteString(s: string): string {
    s = s.trim();
    if (s[0] != '"' && s[s.length - 1] != '"') throw new Error(`improperly quoted string: ${s}`);
    return s.substring(1, s.length - 1);
}

async function main() {
    let text = await fetchWithRedirects(`${REPO_URL}/raw/${REVISION}/src/wtf_errors.rs`).then((e) =>
        e.text()
    );

    let errorMap = getDomains(text).map(([domain, content]) => ({
        domain,
        errors: Object.fromEntries(parseDomainErrors(content)),
    }));

    await fs.writeFile(`${__dirname}/docs-bot/errorMap.json`, JSON.stringify(errorMap, null, 4));
}

main();