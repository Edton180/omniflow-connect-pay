-- Corrigir view de ranking para não usar SECURITY DEFINER
DROP VIEW IF EXISTS evaluation_rankings;

CREATE VIEW evaluation_rankings AS
SELECT 
  e.agent_id,
  p.full_name as agent_name,
  e.tenant_id,
  COUNT(*) as total_evaluations,
  ROUND(AVG(e.score), 2) as average_score,
  COUNT(CASE WHEN e.score = 5 THEN 1 END) as excellent_count,
  COUNT(CASE WHEN e.score >= 4 THEN 1 END) as good_count,
  COUNT(CASE WHEN e.score <= 2 THEN 1 END) as poor_count
FROM evaluations e
LEFT JOIN profiles p ON e.agent_id = p.id
GROUP BY e.agent_id, p.full_name, e.tenant_id;

GRANT SELECT ON evaluation_rankings TO authenticated;