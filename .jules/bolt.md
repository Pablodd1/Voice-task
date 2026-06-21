## 2024-06-25 - Sequelize findOne raw: true null object risk
**Learning:** When using Sequelize `findOne` with `raw: true` for aggregations, the returned result object itself can be null if the database returns an empty set (e.g. no rows match, or no group by matches).
**Action:** Always provide an object fallback (e.g., `const stats = await Model.findOne(...) || {};`) before accessing aggregated properties to prevent 'Cannot read properties of null' TypeErrors.
