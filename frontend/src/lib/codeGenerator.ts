export type Language = 'curl' | 'javascript' | 'typescript' | 'python';

interface EndpointConfig {
    method: string;
    path: string;
    params?: Record<string, string>;
    headers?: Record<string, string>;
}

const API_BASE = 'http://localhost:8000';

export function generateCodeSnippet(
    language: Language,
    endpoint: EndpointConfig,
    apiKey: string = 'your_api_key_here'
): string {
    const { method, path, params = {}, headers = {} } = endpoint;
    const allHeaders = { 'X-API-Key': apiKey, ...headers };

    // Build query string
    const queryString = Object.keys(params).length > 0
        ? '?' + new URLSearchParams(params).toString()
        : '';

    const fullUrl = `${API_BASE}${path}${queryString}`;

    switch (language) {
        case 'curl':
            return generateCurl(method, fullUrl, allHeaders);
        case 'javascript':
            return generateJavaScript(method, fullUrl, allHeaders, params);
        case 'typescript':
            return generateTypeScript(method, fullUrl, allHeaders, params);
        case 'python':
            return generatePython(method, fullUrl, allHeaders, params);
        default:
            return '';
    }
}

function generateCurl(method: string, url: string, headers: Record<string, string>): string {
    const headerFlags = Object.entries(headers)
        .map(([key, value]) => `-H "${key}: ${value}"`)
        .join(' \\\n  ');

    return `curl -X ${method} "${url}" \\
  ${headerFlags}`;
}

function generateJavaScript(
    method: string,
    url: string,
    headers: Record<string, string>,
    _params: Record<string, string>
): string {
    return `const response = await fetch('${url}', {
  method: '${method}',
  headers: ${JSON.stringify(headers, null, 4)}
});

const data = await response.json();
console.log(data);`;
}

function generateTypeScript(
    method: string,
    url: string,
    headers: Record<string, string>,
    _params: Record<string, string>
): string {
    return `interface PnLResponse {
  realizedPnl: string;
  unrealizedPnl: string;
  feesPaid: string;
  tradeCount: number;
  tainted: boolean;
}

const response = await fetch('${url}', {
  method: '${method}',
  headers: ${JSON.stringify(headers, null, 4)}
});

const data: PnLResponse = await response.json();
console.log(data);`;
}

function generatePython(
    method: string,
    url: string,
    headers: Record<string, string>,
    _params: Record<string, string>
): string {
    return `import requests

url = "${url}"
headers = ${JSON.stringify(headers, null, 4).replace(/"/g, "'")}

response = requests.${method.toLowerCase()}(url, headers=headers)
data = response.json()
print(data)`;
}

// Predefined endpoint templates
export const endpoints = {
    getPnL: {
        name: 'Get PnL',
        description: 'Retrieve aggregated PnL metrics for a user',
        method: 'GET',
        path: '/v1/pnl',
        params: {
            user: '0xb317d2bc2d3d2df5fa441b5bae0ab9d8b07283ae',
            builderOnly: 'true'
        }
    },
    getTrades: {
        name: 'Get Trades',
        description: 'Retrieve detailed trade history',
        method: 'GET',
        path: '/v1/trades',
        params: {
            user: '0xb317d2bc2d3d2df5fa441b5bae0ab9d8b07283ae',
            builderOnly: 'true'
        }
    },
    getLeaderboard: {
        name: 'Get Leaderboard',
        description: 'Retrieve top performers by realized PnL',
        method: 'GET',
        path: '/v1/leaderboard',
        params: {}
    }
};
