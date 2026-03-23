# NCBI MCP Server

Model Context Protocol (MCP) server for NCBI E-utilities — access Gene, Protein, Nucleotide, and OMIM databases from the National Center for Biotechnology Information.

## Features

- **Single unified tool** (`ncbi_data`) with 7 methods
- No API key required — uses the public NCBI E-utilities
- Gene search and lookup (symbols, descriptions, genomic locations)
- Protein sequence search and metadata
- Nucleotide sequence search
- Cross-database gene links (pathways, diseases, literature)
- OMIM genetic disorder search

## Installation

```bash
cd ncbi-mcp-server
npm install
npm run build
```

## Usage

```json
{
  "mcpServers": {
    "ncbi": {
      "command": "node",
      "args": ["/path/to/ncbi-mcp-server/build/index.js"]
    }
  }
}
```

## Tool: ncbi_data

Single unified tool with multiple methods accessed via the `method` parameter.

### Methods

#### 1. search_gene

Search NCBI Gene database by keyword.

```json
{
  "method": "search_gene",
  "query": "BRAF",
  "limit": 5
}
```

Returns: gene ID, name, description, organism, chromosome location.

#### 2. get_gene

Get gene details by NCBI Gene ID.

```json
{
  "method": "get_gene",
  "gene_id": "673"
}
```

Returns: full gene summary, aliases, genomic info, RefSeq status.

#### 3. search_protein

Search NCBI Protein database.

```json
{
  "method": "search_protein",
  "query": "human insulin receptor",
  "limit": 5
}
```

Returns: protein accession, title, organism, length.

#### 4. get_protein

Get protein details by accession or GI number.

```json
{
  "method": "get_protein",
  "protein_id": "NP_000199"
}
```

Returns: full protein metadata and annotations.

#### 5. search_nucleotide

Search nucleotide sequences.

```json
{
  "method": "search_nucleotide",
  "query": "BRCA1 mRNA homo sapiens",
  "limit": 5
}
```

Returns: accession, title, organism, sequence length.

#### 6. get_gene_links

Get cross-database links for a gene (pathways, diseases, etc.).

```json
{
  "method": "get_gene_links",
  "gene_id": "673",
  "link_db": "biosystems"
}
```

Returns: linked database records with IDs.

#### 7. search_omim

Search OMIM (Online Mendelian Inheritance in Man) for genetic disorders.

```json
{
  "method": "search_omim",
  "query": "cystic fibrosis",
  "limit": 5
}
```

Returns: OMIM ID, title, disorder description.

## Data Source

- **API**: https://eutils.ncbi.nlm.nih.gov/entrez/eutils
- **Databases**: Gene, Protein, Nucleotide, OMIM, and 40+ others
- **Rate limits**: 3 requests/second without API key

## License

MIT
