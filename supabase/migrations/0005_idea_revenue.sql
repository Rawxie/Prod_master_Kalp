-- Revenue is collected only when the founder picks "Generating revenue".
-- Share links do not need a column: they are a signed report id checked on the server.
alter table public.idea_reports
  add column if not exists revenue text;
