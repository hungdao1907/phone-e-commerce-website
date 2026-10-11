import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const candidatePath = path.resolve(process.cwd(), '..', 'WebPhone - seven fixes OFFLINE candidate (review before import).json');
const candidate = JSON.parse(readFileSync(candidatePath, 'utf8')) as {
  active: boolean;
  nodes: Array<{ name: string; type: string; parameters?: any }>;
  connections: Record<string, { main?: Array<Array<{ node: string }>> }>;
};
const nodesByName = new Map(candidate.nodes.map(node => [node.name, node]));

test('offline n8n candidate is explicitly inactive and keeps product consultation routes', () => {
  assert.equal(candidate.active, false);
  for (const name of [
    'Prepare Search Filters', 'Prepare Product Detail', 'Prepare Compare Filters',
    'Prepare Recommendation Filters', 'Edit Fields - Prepare FAQ', 'Build Conversation State',
  ]) assert.ok(nodesByName.has(name), `Missing preserved product/chat route: ${name}`);
  assert.equal(candidate.connections['Normalize Input'].main?.[0]?.[0]?.node, 'Gemini - Intent Router');
});

test('legacy quotation/PDF/upload and pending-session nodes are absent from the offline flow', () => {
  const serialized = JSON.stringify(candidate);
  const retiredNames = [
    'Prepare Quote Filters', 'Format Quote Data', 'Prepare Quote HTML', 'Gotenberg - Convert HTML to PDF',
    'Prepare PDF Output', 'Generate HTML', 'Convert to File', 'Prepare Quotation Response',
    'API - Fetch Products Quote', 'Build Quote Error Response', 'IF - Quote Ready', 'Upload Quotation PDF',
    'Pending Quote - Lookup', 'IF - Needs Variant Selection', 'Prepare Pending Record', 'Save Pending Quote',
    'Delete Pending Quote',
  ];
  for (const name of retiredNames) assert.equal(nodesByName.has(name), false, `Retired node remains: ${name}`);
  for (const forbidden of [
    '/api/chatbot/quotation-files', 'download_url', 'ready_to_quote', 'quote_status', 'Gotenberg - Convert HTML to PDF',
  ]) assert.equal(serialized.includes(forbidden), false, `Legacy quotation success/file contract remains: ${forbidden}`);
});

test('all remaining workflow connections resolve, and standard switch branches are unchanged', () => {
  for (const [source, groups] of Object.entries(candidate.connections)) {
    assert.ok(nodesByName.has(source), `Missing connection source ${source}`);
    for (const group of Object.values(groups)) {
      for (const output of group || []) {
        for (const edge of output) assert.ok(nodesByName.has(edge.node), `Dangling connection ${source} -> ${edge.node}`);
      }
    }
  }
  const branches = candidate.connections['Intent Router'].main || [];
  assert.deepEqual(branches.slice(0, 5).map(output => output[0]?.node), [
    'Prepare Search Filters', 'Prepare Product Detail', 'Prepare Compare Filters',
    'Prepare Recommendation Filters', 'Edit Fields - Prepare FAQ',
  ]);
  assert.equal(branches.length, 6);
});

test('legacy quotation intent is normalized to catalog search/compare and cannot emit a quotation success', () => {
  const validator = nodesByName.get('Validate Router')?.parameters?.jsCode as string;
  assert.match(validator, /rawIntent === "quotation"/);
  assert.match(validator, /intent = "product_compare"/);
  assert.match(validator, /intent = data\.brand \|\| data\.model \? "product_search" : "default"/);
  const prompt = nodesByName.get('Gemini - Intent Router')?.parameters?.options?.systemMessage as string;
  assert.match(prompt, /Never calculate or return unit price/);
  assert.match(prompt, /Never claim that a quotation, PDF, order, or transaction was created or confirmed/);
});

test('final n8n response allowlists product IDs and removes model-generated product prices', () => {
  const builder = nodesByName.get('Build Conversation State')?.parameters?.jsCode as string;
  assert.match(builder, /\.slice\(0, 12\)\.map\(id => \(\{ id \}\)\)/);
  assert.match(builder, /output\.json\.products = productIds/);
  assert.match(builder, /Product suggestions are sent to the WebPhone Backend for catalog validation/);
  assert.match(builder, /router\.turn_action === "CANCEL"/);
  assert.match(builder, /authenticated WebPhone account; this chatbot cannot verify or cancel a quotation/);
  assert.doesNotMatch(builder, /\.\.\.input,\s*conversation_state/);
  const defaultResponse = nodesByName.get('Edit Response Default')?.parameters?.assignments?.assignments
    ?.find((assignment: any) => assignment.name === 'response')?.value as string;
  assert.match(defaultResponse, /authenticated WebPhone account; this chatbot cannot verify or cancel a quotation/);
  assert.doesNotMatch(defaultResponse, /no quotation is waiting/i);
});
