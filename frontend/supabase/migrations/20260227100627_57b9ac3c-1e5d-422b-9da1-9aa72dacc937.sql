
-- Create atomic function to get next document number
CREATE OR REPLACE FUNCTION public.next_doc_number(p_doc_type text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_prefix text;
  v_next integer;
  v_year text;
BEGIN
  v_year := to_char(now(), 'YYYY');
  
  UPDATE document_counters
  SET last_number = last_number + 1, updated_at = now()
  WHERE doc_type = p_doc_type
  RETURNING prefix, last_number INTO v_prefix, v_next;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Unknown doc_type: %', p_doc_type;
  END IF;
  
  RETURN v_prefix || '-' || v_year || '-' || lpad(v_next::text, 4, '0');
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.next_doc_number(text) TO authenticated;
