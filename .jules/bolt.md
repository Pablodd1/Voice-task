
## 2024-06-19 - Sequelize Aggregation Mapping
**Learning:** When using DB-level aggregations in Sequelize (like `AVG` or `COUNT`), the driver might return values as strings to preserve precision. Also, we must explicitly map database column names (like `billed_amount`) inside `sequelize.col()` rather than mapped ORM attributes.
**Action:** Always parse returned scalar aggregate values (e.g. `parseFloat(stats.avgDuration || 0)`) when mimicking old JS array calculations, and verify column names using DB schema.
