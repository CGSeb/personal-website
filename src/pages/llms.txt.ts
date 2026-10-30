import type { APIRoute } from 'astro';
import { getSite } from '../content';
import { buildLlms } from '../lib/llms';
import { llmsInput } from '../lib/llms-input';

export const GET: APIRoute = async ({ site }) =>
  new Response(buildLlms(llmsInput(await getSite(), site!)), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
