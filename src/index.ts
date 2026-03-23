#!/usr/bin/env node

/**
 * NCBI E-utilities MCP Server
 * Single-tool server providing access to NCBI databases (Gene, Protein,
 * Nucleotide, OMIM) via the Entrez E-utilities API.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import axios, { AxiosInstance, AxiosError } from 'axios';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function txt(data: unknown) {
  return {
    content: [{ type: 'text' as const, text: JSON.stringify(data, null, 2) }],
  };
}

function err(msg: string) {
  return {
    content: [{ type: 'text' as const, text: JSON.stringify({ error: msg }) }],
    isError: true as const,
  };
}

/** NCBI rate-limit: 3 requests/sec without API key. 350ms gap is safe. */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ---------------------------------------------------------------------------
// API client
// ---------------------------------------------------------------------------

const BASE_URL = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils';

const COMMON_PARAMS = {
  tool: 'ncbi-mcp-server',
  email: 'mcp@example.com',
};

const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: {
    Accept: 'application/json',
    'User-Agent': 'NCBI-MCP-Server/1.0.0',
  },
  params: COMMON_PARAMS,
});

// ---------------------------------------------------------------------------
// Method handlers
// ---------------------------------------------------------------------------

async function searchGene(args: Record<string, unknown>) {
  const query = args.query as string | undefined;
  if (!query) return err('query is required');
  const limit = (args.limit as number) ?? 10;

  const searchRes = await api.get('/esearch.fcgi', {
    params: { db: 'gene', term: query, retmax: limit, retmode: 'json' },
  });

  const idList: string[] = searchRes.data?.esearchresult?.idlist ?? [];
  if (idList.length === 0) {
    return txt({ query, total: 0, results: [] });
  }

  await delay(350);

  const summaryRes = await api.get('/esummary.fcgi', {
    params: { db: 'gene', id: idList.join(','), retmode: 'json' },
  });

  const result = summaryRes.data?.result ?? {};
  const uids: string[] = result.uids ?? [];
  const genes = uids.map((uid: string) => result[uid]);

  return txt({
    query,
    total: searchRes.data?.esearchresult?.count ?? idList.length,
    results: genes,
  });
}

async function getGene(args: Record<string, unknown>) {
  const geneId = args.gene_id as string | undefined;
  if (!geneId) return err('gene_id is required');

  const res = await api.get('/esummary.fcgi', {
    params: { db: 'gene', id: geneId, retmode: 'json' },
  });

  const result = res.data?.result ?? {};
  const uids: string[] = result.uids ?? [];
  if (uids.length === 0) {
    return err(`No gene found for ID: ${geneId}`);
  }

  return txt(result[uids[0]]);
}

async function searchProtein(args: Record<string, unknown>) {
  const query = args.query as string | undefined;
  if (!query) return err('query is required');
  const limit = (args.limit as number) ?? 10;

  const searchRes = await api.get('/esearch.fcgi', {
    params: { db: 'protein', term: query, retmax: limit, retmode: 'json' },
  });

  const idList: string[] = searchRes.data?.esearchresult?.idlist ?? [];
  if (idList.length === 0) {
    return txt({ query, total: 0, results: [] });
  }

  await delay(350);

  const summaryRes = await api.get('/esummary.fcgi', {
    params: { db: 'protein', id: idList.join(','), retmode: 'json' },
  });

  const result = summaryRes.data?.result ?? {};
  const uids: string[] = result.uids ?? [];
  const proteins = uids.map((uid: string) => result[uid]);

  return txt({
    query,
    total: searchRes.data?.esearchresult?.count ?? idList.length,
    results: proteins,
  });
}

async function getProtein(args: Record<string, unknown>) {
  const proteinId = args.protein_id as string | undefined;
  if (!proteinId) return err('protein_id is required');

  const res = await api.get('/esummary.fcgi', {
    params: { db: 'protein', id: proteinId, retmode: 'json' },
  });

  const result = res.data?.result ?? {};
  const uids: string[] = result.uids ?? [];
  if (uids.length === 0) {
    return err(`No protein found for ID: ${proteinId}`);
  }

  return txt(result[uids[0]]);
}

async function searchNucleotide(args: Record<string, unknown>) {
  const query = args.query as string | undefined;
  if (!query) return err('query is required');
  const limit = (args.limit as number) ?? 10;

  const searchRes = await api.get('/esearch.fcgi', {
    params: { db: 'nucleotide', term: query, retmax: limit, retmode: 'json' },
  });

  const idList: string[] = searchRes.data?.esearchresult?.idlist ?? [];
  if (idList.length === 0) {
    return txt({ query, total: 0, results: [] });
  }

  await delay(350);

  const summaryRes = await api.get('/esummary.fcgi', {
    params: { db: 'nucleotide', id: idList.join(','), retmode: 'json' },
  });

  const result = summaryRes.data?.result ?? {};
  const uids: string[] = result.uids ?? [];
  const sequences = uids.map((uid: string) => result[uid]);

  return txt({
    query,
    total: searchRes.data?.esearchresult?.count ?? idList.length,
    results: sequences,
  });
}

async function getGeneLinks(args: Record<string, unknown>) {
  const geneId = args.gene_id as string | undefined;
  if (!geneId) return err('gene_id is required');
  const linkDb = (args.link_db as string) ?? 'biosystems';

  const res = await api.get('/elink.fcgi', {
    params: { dbfrom: 'gene', db: linkDb, id: geneId, retmode: 'json' },
  });

  return txt(res.data);
}

async function searchOmim(args: Record<string, unknown>) {
  const query = args.query as string | undefined;
  if (!query) return err('query is required');
  const limit = (args.limit as number) ?? 10;

  const searchRes = await api.get('/esearch.fcgi', {
    params: { db: 'omim', term: query, retmax: limit, retmode: 'json' },
  });

  const idList: string[] = searchRes.data?.esearchresult?.idlist ?? [];
  if (idList.length === 0) {
    return txt({ query, total: 0, results: [] });
  }

  await delay(350);

  const summaryRes = await api.get('/esummary.fcgi', {
    params: { db: 'omim', id: idList.join(','), retmode: 'json' },
  });

  const result = summaryRes.data?.result ?? {};
  const uids: string[] = result.uids ?? [];
  const entries = uids.map((uid: string) => result[uid]);

  return txt({
    query,
    total: searchRes.data?.esearchresult?.count ?? idList.length,
    results: entries,
  });
}

// ---------------------------------------------------------------------------
// Server setup
// ---------------------------------------------------------------------------

const METHODS = [
  'search_gene',
  'get_gene',
  'search_protein',
  'get_protein',
  'search_nucleotide',
  'get_gene_links',
  'search_omim',
] as const;

const server = new Server(
  { name: 'ncbi-server', version: '1.0.0' },
  { capabilities: { tools: {} } },
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'ncbi_data',
      description:
        'Query NCBI databases (Gene, Protein, Nucleotide, OMIM) via the Entrez E-utilities API. Choose a method and supply its parameters.',
      inputSchema: {
        type: 'object' as const,
        properties: {
          method: {
            type: 'string',
            enum: METHODS as unknown as string[],
            description: [
              'search_gene - Search NCBI Gene database by query term',
              'get_gene - Get gene details by NCBI Gene ID',
              'search_protein - Search NCBI Protein database by query term',
              'get_protein - Get protein details by Protein ID',
              'search_nucleotide - Search nucleotide sequences by query term',
              'get_gene_links - Get related links for a gene (pathways, diseases, etc.)',
              'search_omim - Search OMIM for genetic disorders',
            ].join('\n'),
          },
          query: {
            type: 'string',
            description:
              'Search term for search_gene, search_protein, search_nucleotide, search_omim.',
          },
          gene_id: {
            type: 'string',
            description:
              'NCBI Gene ID for get_gene and get_gene_links (e.g., "7157" for TP53).',
          },
          protein_id: {
            type: 'string',
            description:
              'NCBI Protein ID for get_protein (e.g., "119395734").',
          },
          link_db: {
            type: 'string',
            description:
              'Target database for get_gene_links (default: "biosystems"). Examples: biosystems, omim, pubmed, snp.',
          },
          limit: {
            type: 'integer',
            description:
              'Maximum number of results for search methods (default: 10).',
          },
        },
        required: ['method'],
      },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name !== 'ncbi_data') {
    return err(`Unknown tool: ${request.params.name}`);
  }

  const args = (request.params.arguments ?? {}) as Record<string, unknown>;
  const method = args.method as string;

  try {
    switch (method) {
      case 'search_gene':
        return await searchGene(args);
      case 'get_gene':
        return await getGene(args);
      case 'search_protein':
        return await searchProtein(args);
      case 'get_protein':
        return await getProtein(args);
      case 'search_nucleotide':
        return await searchNucleotide(args);
      case 'get_gene_links':
        return await getGeneLinks(args);
      case 'search_omim':
        return await searchOmim(args);
      default:
        return err(`Unknown method: ${method}. Valid: ${METHODS.join(', ')}`);
    }
  } catch (e: unknown) {
    const axErr = e as AxiosError;
    if (axErr.response) {
      return err(`NCBI API ${axErr.response.status}: ${axErr.response.statusText}`);
    }
    return err(e instanceof Error ? e.message : String(e));
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('NCBI E-utilities MCP Server running on stdio');
}

main().catch((e) => {
  console.error('Server error:', e);
  process.exit(1);
});
