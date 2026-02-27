import { supabase } from '@/integrations/supabase/client';

export async function fetchNextDocNumber(docType: string): Promise<string> {
  const { data, error } = await supabase.rpc('next_doc_number', { p_doc_type: docType });
  if (error) throw error;
  return data as string;
}
