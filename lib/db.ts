import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseKey)

// 数据库表名常量
export const TABLES = {
  USERS: 'users',
  PAYMENTS: 'payments',
  KNOWLEDGE_BASES: 'knowledge_bases',
  CONTENT_ITEMS: 'content_items',
  PROMPTS: 'prompts',
  XIAOHONGSHU_ACCOUNTS: 'xiaohongshu_accounts',
  XIAOHONGSHU_POSTS: 'xiaohongshu_posts',
  SYSTEM_CONFIGS: 'system_configs',
} as const
